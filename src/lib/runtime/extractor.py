"""ArrayLab execution & extraction layer (runs inside Pyodide).

Executes Python snippets in isolated namespaces and converts NumPy (and pandas)
objects into a JSON-friendly, UI-agnostic description. Nothing here knows how the
arrays are drawn; the Svelte visualization layer only sees the JSON.
"""

import ast
import io
import json
import sys
import traceback

import numpy as np

# Per-axis preview limits. The innermost two axes get room for a readable grid;
# outer axes (blocks) are kept short because each one repeats a whole grid.
PREVIEW_INNER = 20
PREVIEW_OUTER = 4
# DataFrame previews: rows × columns.
PREVIEW_ROWS = 20
PREVIEW_COLS = 12
MAX_TEXT = 4000

_namespaces = {}


def _namespace(ns_id):
    ns = _namespaces.get(ns_id)
    if ns is None:
        ns = {"__name__": "__main__", "np": np, "numpy": np}
        _namespaces[ns_id] = ns
    return ns


def reset(ns_id):
    _namespaces.pop(ns_id, None)
    return "ok"


def _format_float(x):
    x = float(x)
    if x != x:
        return "nan"
    if x in (float("inf"), float("-inf")):
        return "inf" if x > 0 else "-inf"
    ax = abs(x)
    if ax != 0 and (ax >= 1e8 or ax < 1e-4):
        return np.format_float_scientific(x, precision=3, unique=True, trim="0")
    return np.format_float_positional(x, precision=4, unique=True, trim="0")


def _format_scalar(x, kind):
    if kind == "b":
        return "True" if x else "False"
    if kind in "iu":
        return str(int(x))
    if kind == "f":
        return _format_float(x)
    if kind == "c":
        c = complex(x)
        sign = "+" if c.imag >= 0 or c.imag != c.imag else "-"
        return f"{_format_float(c.real)}{sign}{_format_float(abs(c.imag))}j"
    text = str(x)
    return text if len(text) <= 12 else text[:11] + "…"


def _preview(arr):
    if arr.ndim == 0:
        return arr, False
    caps = []
    for axis, n in enumerate(arr.shape):
        inner = axis >= arr.ndim - 2
        caps.append(min(n, PREVIEW_INNER if inner else PREVIEW_OUTER))
    truncated = any(c < n for c, n in zip(caps, arr.shape))
    return arr[tuple(slice(0, c) for c in caps)], truncated


def describe_array(name, arr, with_values=True):
    arr = np.asarray(arr)
    info = {
        "kind": "array",
        "name": name,
        "backend": "numpy",
        "shape": [int(n) for n in arr.shape],
        "ndim": int(arr.ndim),
        "size": int(arr.size),
        "dtype": str(arr.dtype),
        "dtypeKind": arr.dtype.kind,
        "itemsize": int(arr.itemsize),
        "nbytes": int(arr.nbytes),
        "strides": [int(s) for s in arr.strides],
        "cContiguous": bool(arr.flags["C_CONTIGUOUS"]),
        "ownsData": bool(arr.flags["OWNDATA"]),
        "writeable": bool(arr.flags["WRITEABLE"]),
    }
    if with_values:
        prev, truncated = _preview(arr)
        kind = arr.dtype.kind
        info["values"] = [_format_scalar(v, kind) for v in prev.ravel().tolist()]
        info["previewShape"] = [int(n) for n in prev.shape]
        info["truncated"] = bool(truncated)
    return info


def _type_name(value):
    t = type(value)
    mod = t.__module__
    return t.__name__ if mod in ("builtins", "__main__") else f"{mod}.{t.__name__}"


def _short(text):
    return text if len(text) <= 12 else text[:11] + "…"


def _format_cell(v):
    """One DataFrame cell, written the way pandas prints it (NaN, None, <NA>)."""
    if v is None:
        return "None"
    pd = sys.modules["pandas"]
    if v is pd.NA:
        return "<NA>"
    if v is pd.NaT:
        return "NaT"
    if isinstance(v, (float, np.floating)) and v != v:
        return "NaN"
    if isinstance(v, (np.generic, bool, int, float, complex)) and not isinstance(v, (str, np.str_)):
        kind = np.asarray(v).dtype.kind
        if kind in "biufc":
            return _format_scalar(v, kind)
    return _short(str(v))


def _is_pandas(value):
    pd = sys.modules.get("pandas")
    return pd is not None and isinstance(value, (pd.DataFrame, pd.Series))


def describe_frame(name, obj):
    """Describe a pandas DataFrame or Series (a Series as a single column)."""
    pd = sys.modules["pandas"]
    series = isinstance(obj, pd.Series)
    df = obj.to_frame(name="" if obj.name is None else obj.name) if series else obj
    rows = min(len(df), PREVIEW_ROWS)
    cols = min(df.shape[1], PREVIEW_COLS)
    part = df.iloc[:rows, :cols]
    values = [_format_cell(part.iat[i, j]) for i in range(rows) for j in range(cols)]
    usage = obj.memory_usage(index=False)
    return {
        "kind": "series" if series else "frame",
        "name": name,
        "backend": "pandas",
        "shape": [int(n) for n in obj.shape],
        "ndim": int(obj.ndim),
        "size": int(obj.size),
        "index": [_short(str(x)) for x in part.index],
        "indexKind": df.index.dtype.kind,
        "indexType": type(df.index).__name__,
        "columns": [_short(str(x)) for x in part.columns],
        "columnsKind": df.columns.dtype.kind,
        "columnsType": type(df.columns).__name__,
        "dtypes": [str(t) for t in part.dtypes],
        "values": values,
        "previewShape": [rows, cols],
        "truncated": bool(rows < len(df) or cols < df.shape[1]),
        "nbytes": int(usage if series else usage.sum()),
        "pythonType": "pandas.Series" if series else "pandas.DataFrame",
    }


def describe_value(name, value, with_values=True):
    """Describe any Python value; arrays, DataFrames and numbers get full detail."""
    if _is_pandas(value):
        return describe_frame(name, value)
    if isinstance(value, np.ndarray):
        return describe_array(name, value, with_values)
    if isinstance(value, (np.generic, bool, int, float, complex)) and not isinstance(value, np.str_):
        info = describe_array(name, np.asarray(value), with_values)
        info["kind"] = "scalar"
        info["pythonType"] = _type_name(value)
        return info
    text = repr(value)
    if len(text) > MAX_TEXT:
        text = text[:MAX_TEXT] + " …"
    return {"kind": "other", "name": name, "pythonType": _type_name(value), "repr": text}


def _repr(value):
    try:
        text = repr(value)
    except Exception as exc:  # pragma: no cover - defensive
        text = f"<unprintable {type(value).__name__}: {exc}>"
    return text if len(text) <= MAX_TEXT else text[:MAX_TEXT] + " …"


def _error_info(exc):
    line = None
    if isinstance(exc, SyntaxError) and exc.filename == "<lab>":
        line = exc.lineno
        lines = traceback.format_exception_only(type(exc), exc)
    else:
        tb = exc.__traceback__
        frames = [f for f in traceback.extract_tb(tb) if f.filename == "<lab>"]
        if frames:
            line = frames[-1].lineno
        lines = traceback.format_exception(type(exc), exc, tb)
        # Hide ArrayLab's own frames; keep the frames of user code and libraries.
        lines = [l for l in lines if "extractor.py" not in l and "<exec>" not in l]
    return {
        "type": type(exc).__name__,
        "message": str(exc),
        "line": line,
        "traceback": "".join(lines).strip(),
    }


def _exec(code, ns):
    """Execute code; if the last statement is an expression, return its value."""
    tree = ast.parse(code, "<lab>", "exec")
    last = None
    if tree.body and isinstance(tree.body[-1], ast.Expr):
        last = ast.Expression(tree.body.pop().value)
    exec(compile(tree, "<lab>", "exec"), ns)
    if last is None:
        return False, None
    return True, eval(compile(last, "<lab>", "eval"), ns)


def _list_arrays(ns):
    """ndarray variables, plus DataFrames/Series (summarized for the variable list)."""
    out = []
    for key, value in ns.items():
        if key.startswith("_") or key in ("np", "numpy"):
            continue
        if isinstance(value, np.ndarray):
            out.append(describe_array(key, value, with_values=False))
        elif _is_pandas(value):
            info = describe_frame(key, value)
            out.append(info)
    return out


def run(request_json):
    """Entry point called from the worker. Returns a JSON string."""
    req = json.loads(request_json)
    ns = _namespace(req.get("namespace", "default"))
    stdout, stderr = io.StringIO(), io.StringIO()
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = stdout, stderr
    result = None
    error = None
    targets = {}
    for name in req.get("clear", []):
        ns.pop(name, None)
    try:
        has_value, value = _exec(req.get("code", ""), ns)
        if has_value and value is not None:
            ns["_"] = value
            result = describe_value("_", value)
            result["repr"] = _repr(value)
        extra = req.get("extra")
        if extra:
            exec(compile(extra, "<arraylab>", "exec"), ns)
    except BaseException as exc:  # noqa: BLE001 - report everything to the learner
        error = _error_info(exc)
    finally:
        sys.stdout, sys.stderr = old_out, old_err

    # Described even after an error, so the UI can still show the operands
    # (e.g. both shapes of a failed broadcast). Callers clear stale names first.
    for name in req.get("targets", []):
        if name in ns:
            try:
                targets[name] = describe_value(name, ns[name])
            except Exception:  # pragma: no cover - defensive
                pass

    response = {
        "stdout": stdout.getvalue()[-MAX_TEXT:],
        "stderr": stderr.getvalue()[-MAX_TEXT:],
        "result": result,
        "targets": targets,
        "error": error,
    }
    if req.get("listVariables"):
        response["variables"] = _list_arrays(ns)
    return json.dumps(response, allow_nan=False, default=str)


def versions():
    return json.dumps({"python": sys.version.split()[0], "numpy": np.__version__})
