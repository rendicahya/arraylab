"""Record real PyTorch behavior for ArrayLab's PyTorch chapters.

PyTorch does not run in the browser, so ArrayLab shows PyTorch code next to the
NumPy that actually runs. Every PyTorch fact the UI states (result dtypes, default
dtypes, element sizes, error messages, grad_fn names) comes from this file's
output, recorded with a real PyTorch installation:

    pip install torch numpy
    python scripts/torch_reference.py > src/lib/torch/reference.json

Re-run it after changing the operation lists below or when upgrading PyTorch.
"""

import json
import sys

import numpy as np
import torch

DTYPES = ["bool", "int8", "uint8", "int16", "int32", "int64", "float16", "float32", "float64", "complex128"]

# Must match TORCH_OPS in src/lib/torch/translate.ts (id -> (numpy, torch)).
OPS = {
    "sum0": ("a.sum(axis=0)", "t.sum(dim=0)"),
    "sum": ("a.sum()", "t.sum()"),
    "mean": ("a.mean()", "t.mean()"),
    "max": ("a.max()", "t.max()"),
    "double": ("a * 2", "t * 2"),
    "half": ("a / 2", "t / 2"),
    "sqrt": ("np.sqrt(a)", "torch.sqrt(t)"),
    "row0": ("a[0]", "t[0]"),
    "flat": ("a.reshape(-1)", "t.reshape(-1)"),
    "unsqueeze": ("np.expand_dims(a, 0)", "t.unsqueeze(0)"),
    "float32": ("a.astype(np.float32)", "t.to(torch.float32)"),
    "copy": ("a.copy()", "t.clone()"),
    "concat": ("np.concatenate([a, a])", "torch.cat([t, t])"),
}

# Must match CREATE_PRESETS in src/lib/torch/translate.ts.
CREATE = {
    "zeros": "torch.zeros(2, 3)",
    "ones": "torch.ones(2, 3)",
    "full": "torch.full((2, 3), 7)",
    "arange": "torch.arange(12).reshape(3, 4)",
    "linspace": "torch.linspace(0, 1, 5)",
    "eye": "torch.eye(3)",
    "rand": "torch.rand(2, 3)",
    "randint": "torch.randint(0, 10, (3, 4))",
}
CREATE_NUMPY = {
    "zeros": "np.zeros((2, 3))",
    "ones": "np.ones((2, 3))",
    "full": "np.full((2, 3), 7)",
    "arange": "np.arange(12).reshape(3, 4)",
    "linspace": "np.linspace(0, 1, 5)",
    "eye": "np.eye(3)",
    "rand": "np.random.default_rng(0).random((2, 3))",
    "randint": "np.random.default_rng(0).integers(0, 10, size=(3, 4))",
}


def first_line(exc):
    return f"{type(exc).__name__}: {str(exc).splitlines()[0]}"


def sample(dtype):
    base = np.array([[1, 2, 3], [4, 5, 6]])
    if dtype == "bool":
        return np.array([[True, False, True], [False, True, False]])
    return base.astype(dtype)


def main():
    out = {"torch": torch.__version__.split("+")[0], "numpy": np.__version__}

    out["tensorFromList"] = {
        "int": str(torch.tensor([[1, 2], [3, 4]]).dtype),
        "float": str(torch.tensor([[1.5, 2.0]]).dtype),
        "bool": str(torch.tensor([[True, False]]).dtype),
        "complex": str(torch.tensor([1 + 2j]).dtype),
        "mixedIntFloat": str(torch.tensor([1, 2.5]).dtype),
    }
    out["numpyFromList"] = {
        "float": str(np.array([[1.5, 2.0]]).dtype),
        "complex": str(np.array([1 + 2j]).dtype),
    }

    from_numpy, element_size, tensor_of_array = {}, {}, {}
    for d in DTYPES:
        a = sample(d)
        t = torch.from_numpy(a)
        from_numpy[d] = str(t.dtype)
        element_size[str(t.dtype)] = t.element_size()
        tensor_of_array[d] = str(torch.tensor(a).dtype)
        assert t.shape == a.shape and t.numel() == a.size
        # from_numpy shares memory; torch.tensor copies.
        a2 = sample(d)
        shared, copied = torch.from_numpy(a2), torch.tensor(a2)
        a2[0, 0] = 0
        assert shared[0, 0].item() == 0 and copied[0, 0].item() != 0
    out["fromNumpy"] = from_numpy
    out["tensorOfArray"] = tensor_of_array
    out["elementSize"] = element_size

    ops = {}
    for op_id, (np_expr, torch_expr) in OPS.items():
        per_dtype = {}
        for d in DTYPES:
            a = sample(d)
            t = torch.from_numpy(a.copy())
            try:
                r = eval(torch_expr, {"torch": torch, "t": t})
            except Exception as exc:  # noqa: BLE001 - we record the error
                per_dtype[str(t.dtype)] = {"error": first_line(exc)}
                continue
            entry = {"dtype": str(r.dtype)}
            try:
                n = eval(np_expr, {"np": np, "a": a})
                assert list(np.shape(n)) == list(r.shape), (op_id, d)
            except Exception:  # noqa: BLE001
                pass
            per_dtype[str(t.dtype)] = entry
        ops[op_id] = {"numpy": np_expr, "torch": torch_expr, "byDtype": per_dtype}
    out["ops"] = ops

    create = {}
    for key, expr in CREATE.items():
        t = eval(expr, {"torch": torch})
        n = eval(CREATE_NUMPY[key], {"np": np})
        create[key] = {
            "torch": expr,
            "dtype": str(t.dtype),
            "shape": list(t.shape),
            "numpy": CREATE_NUMPY[key],
            "numpyDtype": str(n.dtype),
        }
        assert list(t.shape) == list(n.shape), key
    out["create"] = create

    t = torch.tensor([[1, 2, 3], [4, 5, 6]])
    out["tensorFacts"] = {
        "shapeRepr": repr(t.shape),
        "sizeIsTuple": isinstance(t.shape, tuple),
        "size1": t.size(1),
        "defaultDevice": str(t.device),
        "defaultFloat": str(torch.get_default_dtype()),
        "requiresGrad": t.requires_grad,
        "isLeaf": t.is_leaf,
        "gradFn": repr(t.grad_fn),
        "dim": t.dim(),
        "len": len(t),
    }

    # Autograd: the graph used by the Autograd tool.
    x = torch.tensor(2.0)
    w = torch.tensor(3.0, requires_grad=True)
    b = torch.tensor(1.0, requires_grad=True)
    y = torch.tensor(10.0)
    m = w * x
    pred = m + b
    diff = pred - y
    loss = diff**2
    grad_fn = {
        "mul": type(m.grad_fn).__name__,
        "add": type(pred.grad_fn).__name__,
        "sub": type(diff.grad_fn).__name__,
        "pow": type(loss.grad_fn).__name__,
    }
    loss.backward()
    autograd = {
        "gradFn": grad_fn,
        "example": {"loss": loss.item(), "w.grad": w.grad.item(), "b.grad": b.grad.item(), "x.grad": repr(x.grad)},
        "leafGradFn": repr(w.grad_fn),
        "lossRepr": repr(loss),
    }
    # Second backward without retain_graph fails; with a fresh graph gradients accumulate.
    loss2 = (w * x + b - y) ** 2
    loss2.backward()
    autograd["accumulated"] = {"w.grad": w.grad.item(), "b.grad": b.grad.item()}
    try:
        loss.backward()
    except Exception as exc:  # noqa: BLE001
        autograd["secondBackward"] = first_line(exc)
    try:
        nog = (torch.tensor(3.0) * torch.tensor(2.0) + torch.tensor(1.0) - torch.tensor(10.0)) ** 2
        nog.backward()
    except Exception as exc:  # noqa: BLE001
        autograd["noGrad"] = first_line(exc)
    try:
        torch.tensor(3.0, requires_grad=True).numpy()
    except Exception as exc:  # noqa: BLE001
        autograd["numpyOfGrad"] = first_line(exc)
    out["autograd"] = autograd

    json.dump(out, sys.stdout, indent="\t", sort_keys=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
