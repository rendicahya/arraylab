/**
 * Runs the real extraction layer inside Pyodide + NumPy (the same versions the
 * browser uses) to make sure the JSON contract matches the TypeScript types.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import type { RunRequest, RunResult } from './protocol';
import type { ArrayInfo, FrameInfo } from '../array/types';

let run: (req: Partial<RunRequest> & { code: string }) => RunResult;

beforeAll(async () => {
	const py = await loadPyodide();
	// The browser loads pandas only when code imports it; here it is loaded up front.
	await py.loadPackage(['numpy', 'pandas']);
	py.runPython(readFileSync(new URL('./extractor.py', import.meta.url), 'utf8'));
	const fn = py.globals.get('run');
	run = (req) => JSON.parse(fn(JSON.stringify({ namespace: 'test', ...req })));
});

describe('extractor', () => {
	it('describes arrays with real NumPy metadata', () => {
		const r = run({ code: 'a = np.array([[1, 2, 3], [4, 5, 6]])\na.sum(axis=0)', targets: ['a'] });
		expect(r.error).toBeNull();
		const a = r.targets.a as ArrayInfo;
		expect(a.shape).toEqual([2, 3]);
		expect(a.ndim).toBe(2);
		expect(a.size).toBe(6);
		// Pyodide is 32-bit WebAssembly: NumPy's default integer is int32 here,
		// unlike 64-bit desktop NumPy (int64). The UI explains this difference.
		expect(a.dtype).toBe('int32');
		expect(a.itemsize).toBe(4);
		expect(a.nbytes).toBe(24);
		expect(a.values).toEqual(['1', '2', '3', '4', '5', '6']);
		const res = r.result as ArrayInfo;
		expect(res.values).toEqual(['5', '7', '9']);
		expect(res.repr).toBe('array([5, 7, 9])');
	});

	it('keeps namespaces between runs', () => {
		const r = run({ code: 'a.T.shape' });
		expect(r.result?.kind).toBe('other');
		expect((r.result as { repr: string }).repr).toBe('(3, 2)');
	});

	it('formats special floats as strings (valid JSON)', () => {
		const r = run({ code: 'print("hi")\nnp.array([1.0, np.nan, 1e10, -np.inf, 0.1 + 0.2])' });
		expect(r.stdout).toBe('hi\n');
		expect((r.result as ArrayInfo).values).toEqual(['1.0', 'nan', '1.0e+10', '-inf', '0.3']);
	});

	it('reports broadcasting errors with the original message', () => {
		const r = run({ code: 'a + np.array([1, 2])' });
		expect(r.error?.type).toBe('ValueError');
		expect(r.error?.message).toContain('could not be broadcast');
		expect(r.error?.line).toBe(1);
	});

	it('reports syntax errors with a line number', () => {
		const r = run({ code: 'x = 1\ndef f(:\n  pass' });
		expect(r.error?.type).toBe('SyntaxError');
		expect(r.error?.line).toBe(2);
	});

	it('truncates large arrays and says so', () => {
		const r = run({ code: 'np.arange(1_000_000).reshape(1000, 1000)' });
		const res = r.result as ArrayInfo;
		expect(res.truncated).toBe(true);
		expect(res.previewShape).toEqual([20, 20]);
		expect(res.values).toHaveLength(400);
		expect(res.size).toBe(1_000_000);
	});

	it('describes scalars as 0-d with their Python type', () => {
		const r = run({ code: 'np.float64(2.5)' });
		const res = r.result as ArrayInfo;
		expect(res.kind).toBe('scalar');
		expect(res.shape).toEqual([]);
		expect(res.pythonType).toBe('numpy.float64');
	});

	it('lists ndarray variables', () => {
		const r = run({ code: 'b = np.zeros((2, 2), dtype=np.float32)', listVariables: true });
		const names = r.variables?.map((v) => v.name);
		expect(names).toContain('a');
		expect(names).toContain('b');
	});

	it('runs hidden helper code and reports view vs copy', () => {
		const r = run({
			code: 't = a.T',
			extra: '__view = np.shares_memory(t, a)',
			targets: ['t', '__view']
		});
		expect((r.targets.t as ArrayInfo).cContiguous).toBe(false);
		expect((r.targets.__view as ArrayInfo).values).toEqual(['True']);
	});
});

describe('error explanations match real NumPy messages', async () => {
	const { explainError } = await import('../array/errors');
	const cases: [string, RegExp][] = [
		['np.ones((2, 3)) + np.ones(2)', /cannot be broadcast/],
		['np.arange(6).reshape(4)', /cannot be arranged/],
		['np.array([[1, 2], [3]])', /different lengths/],
		['np.ones((2, 3))[5, 0]', /does not exist along axis 0/],
		['np.ones((2, 3))[0, 0, 0]', /Too many indices/],
		['np.ones((2, 3)).sum(axis=2)', /Axis 2 does not exist/],
		['np.ones(3)[np.array([True, False])]', /mask has the wrong shape/],
		['np.array([300], dtype=np.uint8)', /does not fit in uint8/],
		['x = np.ones(2, dtype=np.int32)\nx += 0.5', /cannot be stored back/],
		['import torch', /PyTorch is not available/],
		['import pandas as pd\npd.DataFrame(np.ones((2, 3)), index=[1])', /labels does not match/],
		['import pandas as pd\npd.DataFrame(np.ones((2, 2, 2)))', /cannot hold a 3-D/],
		['import pandas as pd\npd.DataFrame({"A": [1]}).loc[5]', /no key or label 5/],
		['import pandas as pd\npd.DataFrame({"A": [1]}).iloc[5]', /position does not exist/],
		['np.concatenate([np.ones((2, 3)), np.ones(3)])', /2-D and a 1-D array cannot be concatenated/],
		['np.concatenate([np.ones((2, 3)), np.ones((1, 3))], axis=1)', /do not fit together along axis 0/],
		['np.stack([np.ones((2, 3)), np.ones((1, 3))])', /exactly the same shape/],
		['np.split(np.ones(6), 4)', /cannot cut this axis into equal pieces/],
		['b = np.ones((2, 3))[0, 1]\nb[...] = 99', /single element \(numpy.float64\) cannot be written/]
	];
	for (const [code, expected] of cases) {
		it(code, () => {
			const r = run({ code });
			expect(r.error).not.toBeNull();
			expect(explainError(r.error!).title).toMatch(expected);
		});
	}
});

describe('every tool generates code that NumPy runs', async () => {
	const { buildSpec, benchmarkCode, VECTOR_OPS, DTYPES } = await import('../lab/codegen');
	const { TORCH_OPS } = await import('../torch/translate');
	const { DEFAULT_SETTINGS } = await import('../lab/types');
	type Settings = typeof DEFAULT_SETTINGS;
	const variants: [string, Partial<Settings>][] = [
		['array', { tool: 'array' }],
		['axis 0', { tool: 'axis' }],
		['axis None keepdims', { tool: 'axis', axis: { fn: 'mean', axis: null, keepdims: true } }],
		['argmax axis 1', { tool: 'axis', axis: { fn: 'argmax', axis: 1, keepdims: false } }],
		['index scalar', { tool: 'index', index: { expr: '0, 1' } }],
		['index column', { tool: 'index', index: { expr: ':, 1' } }],
		['index mask', { tool: 'index', index: { expr: 'a > 2' } }],
		['index fancy', { tool: 'index', index: { expr: '[1, 0], [2, 0]' } }],
		['reshape', { tool: 'reshape' }],
		['reshape -1', { tool: 'reshape', reshape: { op: 'reshape', shape: '-1, 1', axes: '' } }],
		['transpose', { tool: 'reshape', reshape: { op: 'transpose', shape: '', axes: '' } }],
		['flatten', { tool: 'reshape', reshape: { op: 'flatten', shape: '', axes: '' } }],
		['broadcast row', { tool: 'broadcast' }],
		['broadcast scalar', { tool: 'broadcast', broadcast: { b: '10', op: '*' } }],
		['broadcast column', { tool: 'broadcast', broadcast: { b: '10\n20', op: '+' } }],
		['3-D source', { tool: 'axis', source: { mode: 'expr', expr: 'np.arange(24).reshape(2, 3, 4)', text: '', dtype: '' } }],
		...VECTOR_OPS.map((op): [string, Partial<Settings>] => [`vectorize ${op.id}`, { tool: 'vectorize', vectorize: { op: op.id } }]),
		...DTYPES.map((t): [string, Partial<Settings>] => [`dtype ${t}`, { tool: 'dtype', dtype: { target: t } }]),
		...(['tensor', 'convert', 'create', 'device'] as const).map((view): [string, Partial<Settings>] => [
			`torch ${view}`,
			{ tool: 'torch', torch: { view, op: 'sum0', focus: null } }
		]),
		...TORCH_OPS.map((op): [string, Partial<Settings>] => [`torch op ${op.id}`, { tool: 'torch', torch: { view: 'ops', op: op.id, focus: null } }]),
		['autograd', { tool: 'autograd' }],
		...(['frame', 'dtypes', 'axis', 'select', 'align'] as const).map((view): [string, Partial<Settings>] => [
			`pandas ${view}`,
			{ tool: 'pandas', pandas: { ...DEFAULT_SETTINGS.pandas, view } }
		]),
		['pandas default labels', { tool: 'pandas', pandas: { ...DEFAULT_SETTINGS.pandas, index: '', columns: '' } }],
		['pandas iloc', { tool: 'pandas', pandas: { ...DEFAULT_SETTINGS.pandas, view: 'select', accessor: 'iloc', select: '0:1, 1:' } }],
		['pandas column', { tool: 'pandas', pandas: { ...DEFAULT_SETTINGS.pandas, view: 'select', accessor: '', select: "['A', 'C']" } }],
		['pandas mask', { tool: 'pandas', pandas: { ...DEFAULT_SETTINGS.pandas, view: 'select', select: "df['A'] > 2, 'B'" } }],
		...['', '[0]', '[:, 1]', '[:, ::2]', '[::-1]', '.T', '.reshape(3, 2)', '.ravel()', '.flatten()', '[[0, 1]]', '[a > 2]', '.copy()', '.T.ravel()', '[:, 1].copy()'].flatMap(
			(suffix): [string, Partial<Settings>][] => [
				[`views b = a${suffix}`, { tool: 'views', views: { suffix, write: false } }],
				[`views b = a${suffix} + write`, { tool: 'views', views: { suffix, write: true } }]
			]
		),
		['views 3-D expr', { tool: 'views', views: { suffix: '[..., 0]', write: true }, source: { mode: 'expr', expr: 'np.arange(24).reshape(2, 3, 4)', text: '', dtype: '' } }],
		...(['concatenate', 'stack'] as const).flatMap((op): [string, Partial<Settings>][] =>
			[0, 1, -1].map((axis) => [`combine ${op} axis ${axis}`, { tool: 'combine', combine: { op, b: '7 8 9\n10 11 12', axis, parts: 2 } }])
		),
		['combine stack axis 2', { tool: 'combine', combine: { op: 'stack', b: '7 8 9\n10 11 12', axis: 2, parts: 2 } }],
		['combine split 3 along axis 1', { tool: 'combine', combine: { op: 'split', b: '', axis: 1, parts: 3 } }],
		['combine split 2 along axis 0', { tool: 'combine', combine: { op: 'split', b: '', axis: 0, parts: 2 } }],
		['pandas fill', { tool: 'pandas', pandas: { ...DEFAULT_SETTINGS.pandas, view: 'align', fill: true, op: '*' } }]
	];
	for (const [label, patch] of variants) {
		it(label, () => {
			const spec = buildSpec({ ...DEFAULT_SETTINGS, ...patch });
			expect(spec.inputError).toBeUndefined();
			const r = run({ code: spec.code, extra: spec.extra, targets: spec.targets, clear: spec.clear });
			expect(r.error).toBeNull();
			// complex dtypes have no single min/max range, by design
			const expected = spec.targets.filter((t) => !(t === '__range' && label.includes('complex')));
			for (const t of expected) expect(Object.keys(r.targets)).toContain(t);
		});
	}
	it('keeps operands when broadcasting fails', () => {
		const spec = buildSpec({ ...DEFAULT_SETTINGS, tool: 'broadcast', broadcast: { b: '1 2', op: '+' } });
		const r = run({ code: spec.code, extra: spec.extra, targets: spec.targets, clear: spec.clear });
		expect(r.error?.message).toContain('could not be broadcast');
		expect((r.targets.b as ArrayInfo).shape).toEqual([2]);
		expect(r.targets.result).toBeUndefined();
	});
	it('benchmarks loop vs vectorized', () => {
		const r = run({ code: benchmarkCode('double', 1000), namespace: 'bench' });
		expect(r.error).toBeNull();
		expect((r.result as ArrayInfo).shape).toEqual([2]);
	});
});

describe('every lesson step and task runs under real NumPy', async () => {
	const { chapters } = await import('../lessons');
	const { buildSpec } = await import('../lab/codegen');
	const { DEFAULT_SETTINGS } = await import('../lab/types');
	type Patch = import('../lab/types').LabPatch;
	type Settings = typeof DEFAULT_SETTINGS;

	// Examples that intentionally demonstrate an error.
	const INTENDED_ERRORS = [
		'Make one row shorter — what does NumPy say?',
		'An index that does not exist',
		'An impossible shape: (5, 3)',
		'Creating (not converting) an out-of-range value raises an error',
		'Incompatible shapes',
		'A label that does not exist',
		'The same row beside a: axis=1',
		'A 1-D b: shape (3,)',
		'Different shapes cannot be stacked',
		'4 pieces do not fit into 6 columns'
	];

	function applyPatch(s: Settings, p: Patch): Settings {
		const n = structuredClone(s);
		if (p.tool) n.tool = p.tool;
		for (const k of ['source', 'axis', 'index', 'reshape', 'broadcast', 'vectorize', 'dtype', 'views', 'combine', 'torch', 'pandas'] as const) {
			if (p[k]) Object.assign(n[k], p[k]);
		}
		if (p.autograd) {
			const { values, requiresGrad, ...rest } = p.autograd;
			Object.assign(n.autograd.values, values);
			Object.assign(n.autograd.requiresGrad, requiresGrad);
			Object.assign(n.autograd, rest);
		}
		return n;
	}

	function check(label: string, settings: Settings, patch: Patch) {
		const expectError = INTENDED_ERRORS.includes(label);
		const r =
			patch.code !== undefined
				? run({ code: patch.code, namespace: `lesson-${label}` })
				: (() => {
						const spec = buildSpec(settings);
						expect(spec.inputError, label).toBeUndefined();
						return run({ code: spec.code, extra: spec.extra, targets: spec.targets, clear: spec.clear });
					})();
		if (expectError) expect(r.error, label).not.toBeNull();
		else expect(r.error, `${label}: ${r.error?.message}`).toBeNull();
	}

	for (const chapter of chapters) {
		for (const step of chapter.steps) {
			it(`${chapter.number} ${step.title}`, () => {
				const base = applyPatch(structuredClone(DEFAULT_SETTINGS), step.patch);
				check(step.title, base, step.patch);
				for (const task of step.tasks ?? []) {
					if (task.patch) check(task.text, applyPatch(base, task.patch), task.patch);
				}
			});
		}
	}
});

describe('autograd tool matches real PyTorch gradients', async () => {
	const { buildSpec } = await import('../lab/codegen');
	const { DEFAULT_SETTINGS } = await import('../lab/types');
	const { NODE_ORDER } = await import('../torch/autograd');
	type Leaf = 'x' | 'w' | 'b' | 'y';
	// Recorded with PyTorch 2.14 (loss.backward() on pred = w * x + b, loss = (pred - y) ** 2).
	const cases: { values: Record<Leaf, number>; track: Record<Leaf, boolean>; loss: number; grads: Record<Leaf, number | null> }[] = [
		{ values: { x: 2, w: 3, b: 1, y: 10 }, track: { x: false, w: true, b: true, y: false }, loss: 9, grads: { x: null, w: -12, b: -6, y: null } },
		{ values: { x: 5, w: -1.5, b: 0.25, y: 3 }, track: { x: true, w: true, b: true, y: true }, loss: 105.0625, grads: { x: 30.75, w: -102.5, b: -20.5, y: 20.5 } },
		{ values: { x: 0.1, w: 2, b: -3, y: 7.5 }, track: { x: true, w: false, b: false, y: true }, loss: 106.09000396728516, grads: { x: -41.20000076293945, w: null, b: null, y: 20.600000381469727 } }
	];
	for (const c of cases) {
		it(JSON.stringify(c.values), () => {
			const spec = buildSpec({ ...structuredClone(DEFAULT_SETTINGS), tool: 'autograd', autograd: { values: c.values, requiresGrad: c.track, phase: 'backward', lr: 0.05 } });
			const r = run({ code: spec.code, extra: spec.extra, targets: spec.targets, clear: spec.clear, namespace: 'autograd' });
			expect(r.error).toBeNull();
			const fwd = (r.targets.__fwd as ArrayInfo).values!;
			const grad = (r.targets.__grad as ArrayInfo).values!;
			expect(Number(fwd[NODE_ORDER.indexOf('loss')])).toBeCloseTo(c.loss, 3);
			for (const leaf of ['x', 'w', 'b', 'y'] as Leaf[]) {
				const g = grad[NODE_ORDER.indexOf(leaf)];
				if (c.grads[leaf] === null) expect(g).toBe('nan');
				else expect(Number(g)).toBeCloseTo(c.grads[leaf]!, 3);
			}
		});
	}
	it('a gradient step with lr = 0.05 lowers the loss 9 → 2.25 (as in PyTorch)', () => {
		const spec = buildSpec({ ...structuredClone(DEFAULT_SETTINGS), tool: 'autograd' });
		const r = run({ code: spec.code, extra: spec.extra, targets: spec.targets, clear: spec.clear, namespace: 'autograd' });
		const step = (r.targets.__step as ArrayInfo).values!;
		expect(step.slice(0, 4)).toEqual(['2.0', '3.6', '1.3', '10.0']);
		expect(Number(step[4])).toBeCloseTo(2.25, 4);
	});
	it('with nothing tracked there is no backward pass', () => {
		const spec = buildSpec({
			...structuredClone(DEFAULT_SETTINGS),
			tool: 'autograd',
			autograd: { ...DEFAULT_SETTINGS.autograd, requiresGrad: { x: false, w: false, b: false, y: false } }
		});
		expect(spec.code).not.toContain('grad_loss');
		const r = run({ code: spec.code, extra: spec.extra, targets: spec.targets, clear: spec.clear, namespace: 'autograd' });
		expect(r.error).toBeNull();
		expect((r.targets.__grad as ArrayInfo).values!.every((v) => v === 'nan')).toBe(true);
	});
});

describe('pandas (real pandas 3 in Pyodide)', async () => {
	const { buildSpec } = await import('../lab/codegen');
	const { DEFAULT_SETTINGS } = await import('../lab/types');
	type Pandas = typeof DEFAULT_SETTINGS.pandas;
	const runPandas = (pandas: Partial<Pandas>, text = '1 2 3\n4 5 6') => {
		const spec = buildSpec({
			...structuredClone(DEFAULT_SETTINGS),
			tool: 'pandas',
			source: { mode: 'literal', text, dtype: '', expr: '' },
			pandas: { ...DEFAULT_SETTINGS.pandas, ...pandas }
		});
		expect(spec.inputError).toBeUndefined();
		return run({ code: spec.code, extra: spec.extra, targets: spec.targets, clear: spec.clear, namespace: 'pandas' });
	};

	it('runs the pandas version ArrayLab states', async () => {
		const { PANDAS_VERSION } = await import('./config');
		expect((run({ code: 'import pandas as pd\npd.__version__' }).result as { repr: string }).repr).toBe(`'${PANDAS_VERSION}'`);
	});

	it('describes a DataFrame: labels, per-column dtypes, values', () => {
		const r = runPandas({ view: 'frame' });
		expect(r.error).toBeNull();
		const df = r.targets.df as FrameInfo;
		expect(df).toMatchObject({
			kind: 'frame',
			shape: [2, 3],
			index: ['r0', 'r1'],
			columns: ['A', 'B', 'C'],
			dtypes: ['int32', 'int32', 'int32'],
			values: ['1', '2', '3', '4', '5', '6'],
			indexType: 'Index'
		});
		expect((r.targets.values as ArrayInfo).shape).toEqual([2, 3]);
		// pandas 3 copies the ndarray it is built from.
		expect((r.targets.__shared as ArrayInfo).values).toEqual(['False']);
		expect(r.result?.kind).toBe('frame');
	});

	it('gives each column its own dtype; a missing value changes it', () => {
		const dtypes = (missing: Pandas['missing']) => (runPandas({ view: 'dtypes', missing }).targets.df as FrameInfo).dtypes;
		expect(dtypes('none')).toEqual(['str', 'int64', 'float64', 'bool']);
		expect(dtypes('age')).toEqual(['str', 'float64', 'float64', 'bool']);
		expect(dtypes('passed')).toEqual(['str', 'int64', 'float64', 'object']);
		const r = runPandas({ view: 'dtypes', missing: 'age' });
		expect((r.targets.df as FrameInfo).values[2 * 4 + 1]).toBe('NaN');
		expect((r.targets.values as ArrayInfo).dtype).toBe('object');
		expect((r.targets.numbers as ArrayInfo).dtype).toBe('float64');
	});

	it('reduces along an axis and skips NaN (NumPy does not)', () => {
		const r = runPandas({ view: 'axis', fn: 'sum', axis: 0 }, '1 nan\n3 4');
		const res = r.targets.result as FrameInfo;
		expect(res.kind).toBe('series');
		expect(res.index).toEqual(['A', 'B']);
		expect(res.values).toEqual(['4.0', '4.0']);
		expect((r.targets.__np as ArrayInfo).values).toEqual(['4.0', 'nan']);
	});

	it('loc slices by label and includes the end; iloc slices by position and excludes it', () => {
		const loc = runPandas({ view: 'select', accessor: 'loc', select: "'r0':'r1', 'A':'B'" });
		expect((loc.targets.result as FrameInfo).shape).toEqual([2, 2]);
		expect((loc.targets.__src as ArrayInfo).values).toEqual(['0', '1', '3', '4']);
		const iloc = runPandas({ view: 'select', accessor: 'iloc', select: '0:1, 0:2' });
		expect((iloc.targets.result as FrameInfo).shape).toEqual([1, 2]);
		const col = runPandas({ view: 'select', accessor: '', select: "'B'" });
		expect((col.targets.__src as ArrayInfo).values).toEqual(['1', '4']);
		const bad = runPandas({ view: 'select', accessor: 'loc', select: '0' });
		expect(bad.error?.type).toBe('KeyError');
	});

	it('aligns Series by label; missing labels give NaN', () => {
		const r = runPandas({ view: 'align' });
		const res = r.targets.result as FrameInfo;
		expect(res.index).toEqual(['a', 'b', 'c', 'd']);
		expect(res.values).toEqual(['NaN', '12.0', '23.0', 'NaN']);
		expect((r.targets.positional as ArrayInfo).values).toEqual(['11', '22', '33']);
		const filled = runPandas({ view: 'align', fill: true });
		expect((filled.targets.result as FrameInfo).values).toEqual(['1.0', '12.0', '23.0', '30.0']);
	});
});

describe('view vs copy follows NumPy', async () => {
	const { buildSpec } = await import('../lab/codegen');
	const { DEFAULT_SETTINGS } = await import('../lab/types');
	const runViews = (suffix: string, write: boolean) => {
		const spec = buildSpec({ ...structuredClone(DEFAULT_SETTINGS), tool: 'views', views: { suffix, write } });
		return run({ code: spec.code, extra: spec.extra, targets: spec.targets, clear: spec.clear, namespace: 'views' });
	};
	const flag = (r: RunResult, name: string) => (r.targets[name] as ArrayInfo).values?.[0];

	it('b = a is the same array; writing into b writes into a', () => {
		const r = runViews('', true);
		expect(flag(r, '__same')).toBe('True');
		expect((r.targets.a as ArrayInfo).values).toEqual(['99', '99', '99', '99', '99', '99']);
		expect((r.targets.__a0 as ArrayInfo).values).toEqual(['1', '2', '3', '4', '5', '6']);
	});
	it('a column slice is a view with a stride of one row', () => {
		const r = runViews('[:, 1]', true);
		expect(flag(r, '__shared')).toBe('True');
		expect(flag(r, '__same')).toBe('False');
		expect((r.targets.b as ArrayInfo).strides).toEqual([12]);
		expect((r.targets.__src as ArrayInfo).values).toEqual(['1', '4']);
		expect((r.targets.a as ArrayInfo).values).toEqual(['1', '99', '3', '4', '99', '6']);
		expect((r.targets.__b0 as ArrayInfo).values).toEqual(['2', '5']);
	});
	for (const suffix of ['[[0, 1]]', '[a > 2]', '.flatten()', '.T.ravel()', '.copy()']) {
		it(`a${suffix} is a copy; a is unchanged after the write`, () => {
			const r = runViews(suffix, true);
			expect(r.error).toBeNull();
			expect(flag(r, '__shared')).toBe('False');
			expect((r.targets.a as ArrayInfo).values).toEqual(['1', '2', '3', '4', '5', '6']);
		});
	}
	it('the mask provenance uses the values from before the write', () => {
		const r = runViews('[a > 2]', true);
		expect((r.targets.__src as ArrayInfo).values).toEqual(['2', '3', '4', '5']);
	});
	it('a single element is a scalar and cannot be written into', () => {
		const r = runViews('[0, 1]', true);
		expect(r.error?.type).toBe('TypeError');
	});
});

describe('combining arrays follows NumPy', async () => {
	const { buildSpec } = await import('../lab/codegen');
	const { DEFAULT_SETTINGS } = await import('../lab/types');
	const { concatenatePlan, stackPlan } = await import('../array/combine');
	type Combine = typeof DEFAULT_SETTINGS.combine;
	const runCombine = (combine: Partial<Combine>, text = '1 2 3\n4 5 6') => {
		const spec = buildSpec({
			...structuredClone(DEFAULT_SETTINGS),
			tool: 'combine',
			source: { mode: 'literal', text, dtype: '', expr: '' },
			combine: { ...DEFAULT_SETTINGS.combine, ...combine }
		});
		return run({ code: spec.code, extra: spec.extra, targets: spec.targets, clear: spec.clear, namespace: 'combine' });
	};
	const cases: [Partial<Combine>, string][] = [
		[{ op: 'concatenate', b: '7 8 9\n10 11 12', axis: 0 }, 'concatenate'],
		[{ op: 'concatenate', b: '7 8 9\n10 11 12', axis: 1 }, 'concatenate'],
		[{ op: 'concatenate', b: '[[7, 8, 9]]', axis: 0 }, 'concatenate'],
		[{ op: 'concatenate', b: '[[7, 8, 9]]', axis: 1 }, 'concatenate'],
		[{ op: 'concatenate', b: '7 8 9', axis: 0 }, 'concatenate'],
		[{ op: 'stack', b: '7 8 9\n10 11 12', axis: 0 }, 'stack'],
		[{ op: 'stack', b: '7 8 9\n10 11 12', axis: 2 }, 'stack'],
		[{ op: 'stack', b: '7 8 9\n10 11 12', axis: -1 }, 'stack'],
		[{ op: 'stack', b: '[[7, 8, 9]]', axis: 0 }, 'stack']
	];
	for (const [combine, op] of cases) {
		it(`the shape table predicts NumPy: ${op} b=${JSON.stringify(combine.b)} axis=${combine.axis}`, () => {
			const r = runCombine(combine);
			const a = r.targets.a as ArrayInfo;
			const b = r.targets.b as ArrayInfo;
			const plan = op === 'stack' ? stackPlan(a.shape, b.shape, combine.axis!) : concatenatePlan(a.shape, b.shape, combine.axis!);
			if (plan.shape) {
				expect(r.error).toBeNull();
				expect((r.targets.result as ArrayInfo).shape).toEqual(plan.shape);
			} else {
				expect(r.error?.type).toBe('ValueError');
			}
		});
	}
	it('marks where each result element came from', () => {
		const r = runCombine({ op: 'concatenate', b: '7 8 9\n10 11 12', axis: 1 });
		expect((r.targets.__src as ArrayInfo).values).toEqual(['0', '1', '2', '6', '7', '8', '3', '4', '5', '9', '10', '11']);
	});
	it('split pieces are views, labeled by piece', () => {
		const r = runCombine({ op: 'split', axis: 1, parts: 3 }, '1 2 3 4 5 6\n7 8 9 10 11 12');
		expect(r.error).toBeNull();
		expect((r.targets.__views as ArrayInfo).values).toEqual(['True', 'True', 'True']);
		expect((r.targets.__part as ArrayInfo).values).toEqual(['0', '0', '1', '1', '2', '2', '0', '0', '1', '1', '2', '2']);
		expect((r.targets.__p2 as ArrayInfo).values).toEqual(['5', '6', '11', '12']);
	});
});
