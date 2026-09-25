/**
 * Runs the real extraction layer inside Pyodide + NumPy (the same versions the
 * browser uses) to make sure the JSON contract matches the TypeScript types.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadPyodide } from 'pyodide';
import type { RunRequest, RunResult } from './protocol';
import type { ArrayInfo } from '../array/types';

let run: (req: Partial<RunRequest> & { code: string }) => RunResult;

beforeAll(async () => {
	const py = await loadPyodide();
	await py.loadPackage('numpy');
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
		['import torch', /PyTorch is not available/]
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
		...DTYPES.map((t): [string, Partial<Settings>] => [`dtype ${t}`, { tool: 'dtype', dtype: { target: t } }])
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
		'Incompatible shapes'
	];

	function applyPatch(s: Settings, p: Patch): Settings {
		const n = structuredClone(s);
		if (p.tool) n.tool = p.tool;
		for (const k of ['source', 'axis', 'index', 'reshape', 'broadcast', 'vectorize', 'dtype'] as const) {
			if (p[k]) Object.assign(n[k], p[k]);
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

	for (const chapter of chapters.filter((c) => c.phase === 'numpy')) {
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
