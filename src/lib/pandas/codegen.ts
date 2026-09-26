/**
 * Python for the pandas tool. pandas runs for real in the browser (Pyodide ships
 * it), so every table, dtype and error shown comes from pandas itself. `extra`
 * holds hidden helpers (e.g. which cells a selection took), computed by applying
 * the same pandas operation to a table of element ids.
 */
import type { PandasAccessor, PandasMissing, PandasOp, PandasReduce, PandasState } from '../lab/types';
import { toPythonToken } from '../array/literal';

export type Label = string | number;
type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

export type PandasCode = {
	lines: string[];
	extra?: string;
	targets: string[];
	inputError?: string;
};

export const PANDAS_NAMES = ['df', 'values', 'numbers', 'result', 's1', 's2', 'positional'];
export const PANDAS_HELPERS = ['__shared', '__base', '__np', '__ids', '__src'];

const WORD = /^[A-Za-z_]\w{0,11}$/;
const INT = /^-?\d{1,9}$/;

/** Labels typed as "r0 r1" or "10, 20": words become strings, whole numbers ints. */
export function parseLabels(text: string): Parsed<Label[]> {
	const tokens = text.split(/[\s,]+/).filter(Boolean);
	const labels: Label[] = [];
	for (const t of tokens) {
		if (INT.test(t)) labels.push(Number(t));
		else if (WORD.test(t)) labels.push(t);
		else return { ok: false, message: `“${t}” is not a label here. Use short words (r0, Ana) or whole numbers (10).` };
	}
	const seen = new Set(labels.map(String));
	if (seen.size !== labels.length) {
		return { ok: false, message: 'Use each label once. (pandas allows repeated labels, but then one label can select several rows.)' };
	}
	return { ok: true, value: labels };
}

export function pyLabel(label: Label): string {
	return typeof label === 'number' ? String(label) : `'${label}'`;
}

export function pyLabels(labels: Label[]): string {
	return `[${labels.map(pyLabel).join(', ')}]`;
}

function letters(i: number): string {
	return i < 26 ? String.fromCharCode(65 + i) : `c${i}`;
}

/**
 * Makes typed labels fit `n` rows or columns: keeps the ones given, drops extras,
 * and continues the pattern (10 20 → 30; r0 r1 → r2; A B → C). Empty stays empty.
 */
export function fitLabels(labels: Label[], n: number, kind: 'index' | 'columns'): Label[] {
	if (labels.length === 0 || labels.length === n) return labels;
	if (labels.length > n) return labels.slice(0, n);
	const out = [...labels];
	const used = new Set(out.map(String));
	const ints = out.every((l) => typeof l === 'number');
	const step = ints && out.length >= 2 ? (out[out.length - 1] as number) - (out[out.length - 2] as number) || 1 : 1;
	for (let i = out.length; out.length < n; i++) {
		let next: Label = ints ? (out[out.length - 1] as number) + step : kind === 'index' ? `r${i}` : letters(i);
		while (used.has(String(next))) next = typeof next === 'number' ? next + 1 : `${next}_`;
		used.add(String(next));
		out.push(next);
	}
	return out;
}

/** Rows and columns a DataFrame built from an array of this shape has (null: not 1-D/2-D). */
export function frameShape(shape: readonly number[]): [number, number] | null {
	if (shape.length === 1) return [shape[0], 1];
	if (shape.length === 2) return [shape[0], shape[1]];
	return null;
}

/** The DataFrame line; labels are fitted when the array's shape is known. */
function frameCall(s: PandasState, shape: number[] | null): Parsed<string> {
	const index = parseLabels(s.index);
	if (!index.ok) return { ok: false, message: `Row labels: ${index.message}` };
	const columns = parseLabels(s.columns);
	if (!columns.ok) return { ok: false, message: `Column labels: ${columns.message}` };
	const fit = shape ? frameShape(shape) : null;
	const rows = fit ? fitLabels(index.value, fit[0], 'index') : index.value;
	const cols = fit ? fitLabels(columns.value, fit[1], 'columns') : columns.value;
	const args = ['a'];
	if (rows.length) args.push(`index=${pyLabels(rows)}`);
	if (cols.length) args.push(`columns=${pyLabels(cols)}`);
	return { ok: true, value: `df = pd.DataFrame(${args.join(', ')})` };
}

// ---- dtypes: a table with one dtype per column -------------------------------------

export const EXAMPLE_TABLE: { column: Exclude<PandasMissing, 'none'>; values: string[] }[] = [
	{ column: 'name', values: ["'Ana'", "'Budi'", "'Citra'", "'Dewi'"] },
	{ column: 'age', values: ['20', '21', '19', '22'] },
	{ column: 'score', values: ['88.5', '92.0', '79.5', '85.0'] },
	{ column: 'passed', values: ['True', 'True', 'False', 'True'] }
];
/** Row that receives the missing value. */
export const MISSING_ROW = 2;

function tableCode(missing: PandasMissing): string {
	const width = Math.max(...EXAMPLE_TABLE.map((c) => c.column.length)) + 3;
	const rows = EXAMPLE_TABLE.map(({ column, values }) => {
		const vals = values.map((v, i) => (column === missing && i === MISSING_ROW ? 'None' : v));
		return `    ${`'${column}':`.padEnd(width)}[${vals.join(', ')}],`;
	});
	return ['df = pd.DataFrame({', ...rows, '})'].join('\n');
}

// ---- axis: reductions -----------------------------------------------------------

export const PANDAS_REDUCE: PandasReduce[] = ['sum', 'mean', 'max', 'min'];

// ---- loc / iloc -----------------------------------------------------------------

export function accessorText(accessor: PandasAccessor): string {
	return accessor ? `df.${accessor}` : 'df';
}

/**
 * Selections that are safe to run as the learner types: labels in quotes,
 * numbers, slices, lists and comparisons on df. Anything else waits for Apply.
 */
export function isSimpleSelection(expr: string): boolean {
	const rest = expr
		.replace(/'[^'\\\n]*'|"[^"\\\n]*"/g, ' ')
		.replace(/\b(?:df|True|False|None)\b/g, ' ');
	return /^[\d\s:,.\-+[\]()<>=!&|~%*]*$/.test(rest);
}

// ---- alignment: two labeled Series ---------------------------------------------

export type SeriesInput = { labels: Label[]; values: string[] };

/** "a:1 b:2 c:3" (or a=1, b=2) → labels and Python values. */
export function parseSeries(text: string): Parsed<SeriesInput> {
	const tokens = text.split(/[\s,]+/).filter(Boolean);
	if (!tokens.length) return { ok: false, message: 'Type label:value pairs, e.g. a:1 b:2 c:3.' };
	const labels: string[] = [];
	const values: string[] = [];
	for (const t of tokens) {
		const m = t.match(/^([^:=]+)[:=](.+)$/);
		if (!m) return { ok: false, message: `“${t}” needs a label and a value, like b:2.` };
		const value = toPythonToken(m[2]);
		if (value === null || value === 'True' || value === 'False' || value.endsWith('j')) {
			return { ok: false, message: `“${m[2]}” is not a number (in “${t}”).` };
		}
		labels.push(m[1]);
		values.push(value);
	}
	const parsed = parseLabels(labels.join(' '));
	if (!parsed.ok) return parsed;
	return { ok: true, value: { labels: parsed.value, values } };
}

export const PANDAS_OPS: { op: PandasOp; method: string }[] = [
	{ op: '+', method: 'add' },
	{ op: '-', method: 'sub' },
	{ op: '*', method: 'mul' }
];

function seriesCode(name: string, s: SeriesInput): string {
	return `${name} = pd.Series([${s.values.join(', ')}], index=${pyLabels(s.labels)})`;
}

// ---- code for each view ---------------------------------------------------------

/**
 * Lines after the imports. `source` is the code that creates `a` ('' when the view
 * does not use it); `shape` is a's shape when known before running (typed numbers),
 * so the labels can be fitted to it.
 */
export function pandasCode(s: PandasState, source: string, shape: number[] | null = null): PandasCode {
	if (s.view === 'dtypes') {
		return {
			lines: [
				tableCode(s.missing),
				'',
				'values = df.to_numpy()                      # one array for the whole table',
				"numbers = df[['age', 'score']].to_numpy()   # only the numeric columns",
				'df.dtypes'
			],
			// The same table without the missing value, to show which dtype changed.
			extra: s.missing === 'none' ? undefined : `__base = ${tableCode('none').replace(/^df = /, '')}.dtypes`,
			targets: s.missing === 'none' ? ['df', 'values', 'numbers'] : ['df', 'values', 'numbers', '__base']
		};
	}

	if (s.view === 'align') {
		const left = parseSeries(s.left);
		if (!left.ok) return { lines: [], targets: [], inputError: `s1: ${left.message}` };
		const right = parseSeries(s.right);
		if (!right.ok) return { lines: [], targets: [], inputError: `s2: ${right.message}` };
		const method = PANDAS_OPS.find((o) => o.op === s.op)?.method ?? 'add';
		const n1 = left.value.labels.length;
		const n2 = right.value.labels.length;
		const pandasLine = s.fill
			? `result = s1.${method}(s2, fill_value=0)`.padEnd(45) + '# pandas: matched by label, a missing side counts as 0'
			: `result = s1 ${s.op} s2`.padEnd(45) + '# pandas: matched by label';
		const numpyLine =
			n1 === n2 || n1 === 1 || n2 === 1
				? `positional = s1.to_numpy() ${s.op} s2.to_numpy()`.padEnd(45) + '# NumPy: matched by position'
				: `# NumPy matches by position: lengths ${n1} and ${n2} cannot be combined`;
		return {
			lines: [seriesCode('s1', left.value), seriesCode('s2', right.value), '', pandasLine, numpyLine, 'result'],
			targets: ['s1', 's2', 'result', 'positional']
		};
	}

	const frame = frameCall(s, shape);
	if (!frame.ok) return { lines: [], targets: [], inputError: frame.message };
	const head = [source, '', frame.value];

	switch (s.view) {
		case 'frame':
			return {
				lines: [...head, 'values = df.to_numpy()   # the array inside, without labels', '', 'df'],
				extra: '__shared = np.shares_memory(values, a)',
				targets: ['a', 'df', 'values', '__shared']
			};
		case 'axis': {
			const fn = PANDAS_REDUCE.includes(s.fn) ? s.fn : 'sum';
			return {
				lines: [...head, `result = df.${fn}(axis=${s.axis})`, 'result'],
				// NumPy's answer for the same data, to compare how each treats NaN.
				extra: [
					'try:',
					'    with np.errstate(all="ignore"):',
					`        __np = np.${fn}(df.to_numpy(), axis=${s.axis})`,
					'except Exception:',
					'    pass'
				].join('\n'),
				targets: ['a', 'df', 'result', '__np']
			};
		}
		case 'select': {
			const expr = s.select.trim() || ':';
			const pick = (name: string) => (s.accessor ? `${name}.${s.accessor}[${expr}]` : `${name}[${expr}]`);
			return {
				lines: [...head, `result = ${pick('df')}`, 'result'],
				extra: [
					'__ids = pd.DataFrame(np.arange(df.size).reshape(df.shape), index=df.index, columns=df.columns)',
					`__src = np.asarray(${pick('__ids')})`
				].join('\n'),
				targets: ['a', 'df', 'result', '__src']
			};
		}
	}
	return { lines: head, targets: ['a', 'df'] };
}
