/**
 * Builds the Python that each tool runs. `code` is exactly what the learner sees
 * in the code panel; `extra` is hidden helper code that computes provenance maps
 * (which source element ended up where) by applying the *same* NumPy operation
 * to an array of element ids. Highlighting therefore follows NumPy's real behavior.
 */
import { literalToCode, parseLiteral } from '../array/literal';
import type { LabSettings, ReduceFn, ToolId, VectorOpId } from './types';

export type RunSpec = {
	tool: ToolId;
	/** Nothing to execute (the "Your code" view shows results of the editor instead). */
	skip?: boolean;
	code: string;
	extra?: string;
	targets: string[];
	clear: string[];
	/** Problem found before running (e.g. an invalid token); nothing is executed. */
	inputError?: string;
	/** Advisory from the literal parser, e.g. "Row 2 has 2 values…". */
	inputHint?: string;
};

const HEADER = 'import numpy as np\n\n';
const HELPERS = ['__src', '__view', '__ia', '__ib', '__changed', '__range', '__ids'];

export const REDUCE_FNS: { id: ReduceFn; label: string }[] = [
	{ id: 'sum', label: 'sum' },
	{ id: 'mean', label: 'mean' },
	{ id: 'max', label: 'max' },
	{ id: 'min', label: 'min' },
	{ id: 'prod', label: 'prod' },
	{ id: 'argmax', label: 'argmax' }
];

export const VECTOR_OPS: {
	id: VectorOpId;
	label: string;
	loop: string;
	vector: string;
	ufunc: string;
}[] = [
	{ id: 'double', label: '× 2', loop: 'x * 2', vector: 'a * 2', ufunc: 'np.multiply(a, 2)' },
	{ id: 'add10', label: '+ 10', loop: 'x + 10', vector: 'a + 10', ufunc: 'np.add(a, 10)' },
	{ id: 'square', label: 'square', loop: 'x ** 2', vector: 'a ** 2', ufunc: 'np.power(a, 2)' },
	{ id: 'sqrt', label: '√x', loop: 'np.sqrt(x)', vector: 'np.sqrt(a)', ufunc: 'np.sqrt(a)' },
	{ id: 'abs', label: '|x|', loop: 'abs(x)', vector: 'np.abs(a)', ufunc: 'np.absolute(a)' },
	{ id: 'gt2', label: 'x > 2', loop: 'x > 2', vector: 'a > 2', ufunc: 'np.greater(a, 2)' }
];

export const DTYPES = [
	'bool',
	'int8',
	'uint8',
	'int16',
	'int32',
	'int64',
	'float16',
	'float32',
	'float64',
	'complex128'
] as const;

export const SHAPE_PATTERN = /^\s*-?\d+\s*(,\s*-?\d+\s*)*,?\s*$/;
export const AXES_PATTERN = /^\s*(\d+\s*(,\s*\d+\s*)*)?$/;

/**
 * Index expressions that are safe to run as the learner types: numbers, slices,
 * commas, `...`, `None`, `np.newaxis`, lists and comparisons/masks on `a`.
 * Anything else still works, but only when applied explicitly.
 */
export function isSimpleIndex(expr: string): boolean {
	const rest = expr.replace(/\b(?:np\.newaxis|None|True|False|a)\b/g, ' ');
	return /^[\d\s:,.\-+[\]()<>=!&|~%*]*$/.test(rest);
}

export function sourceCode(s: LabSettings['source']): { code: string; error?: string; hint?: string } {
	if (s.mode === 'expr') {
		const expr = s.expr.trim() || 'np.arange(6)';
		return { code: `a = ${expr}` };
	}
	const parsed = parseLiteral(s.text);
	if (!parsed.ok) return { code: '', error: parsed.message };
	return {
		code: literalToCode('a', parsed.nested, s.dtype || undefined),
		hint: parsed.ragged ?? undefined
	};
}

function reduceCall(fn: ReduceFn, axis: number | null, keepdims: boolean): string {
	const args = ['a'];
	if (axis !== null) args.push(`axis=${axis}`);
	if (keepdims) args.push('keepdims=True');
	return `np.${fn}(${args.join(', ')})`;
}

export function shapeOpExpr(target: string, r: LabSettings['reshape']): string {
	switch (r.op) {
		case 'reshape':
			return `${target}.reshape(${r.shape.trim().replace(/,\s*$/, '')})`;
		case 'transpose':
			return r.axes.trim() ? `${target}.transpose(${r.axes.trim()})` : `${target}.T`;
		case 'flatten':
			return `${target}.flatten()`;
		case 'ravel':
			return `${target}.ravel()`;
	}
}

export function buildSpec(settings: LabSettings): RunSpec {
	const tool = settings.tool;
	const clear = ['result', 'b', 'loop_result', 'vec_result', ...HELPERS];
	if (tool === 'code') return { tool, skip: true, code: '', targets: [], clear: [] };
	const src = sourceCode(settings.source);
	if (src.error) return { tool, code: '', targets: [], clear, inputError: src.error };
	const lines = [src.code];
	let extra: string | undefined;
	let targets = ['a', 'result'];
	let inputError: string | undefined;
	const ids = '__ids = np.arange(a.size).reshape(a.shape)\n';

	switch (settings.tool) {
		case 'array':
			lines.push('', 'a');
			targets = ['a'];
			break;

		case 'axis': {
			const { fn, axis, keepdims } = settings.axis;
			lines.push('', `result = ${reduceCall(fn, axis, keepdims)}`, 'result');
			break;
		}

		case 'index': {
			const expr = settings.index.expr.trim() || ':';
			lines.push('', `result = a[${expr}]`, 'result');
			extra = `${ids}__src = __ids[${expr}]\n__view = np.shares_memory(result, a)`;
			targets = ['a', 'result', '__src', '__view'];
			break;
		}

		case 'reshape': {
			const r = settings.reshape;
			if (r.op === 'reshape' && !SHAPE_PATTERN.test(r.shape)) {
				inputError = 'Enter the new shape as whole numbers separated by commas, e.g. 3, 2 or -1, 2.';
			}
			if (r.op === 'transpose' && !AXES_PATTERN.test(r.axes)) {
				inputError = 'Enter axes as numbers separated by commas, e.g. 1, 0 — or leave empty.';
			}
			lines.push('', `result = ${shapeOpExpr('a', r)}`, 'result');
			extra = `${ids}__src = ${shapeOpExpr('__ids', r)}\n__view = np.shares_memory(result, a)`;
			targets = ['a', 'result', '__src', '__view'];
			break;
		}

		case 'broadcast': {
			const parsed = parseLiteral(settings.broadcast.b);
			if (!parsed.ok) {
				inputError = `B: ${parsed.message}`;
				break;
			}
			lines.push(literalToCode('b', parsed.nested), '', `result = a ${settings.broadcast.op} b`, 'result');
			extra = [
				'__ia = np.broadcast_to(np.arange(a.size).reshape(a.shape), result.shape)',
				'__ib = np.broadcast_to(np.arange(b.size).reshape(b.shape), result.shape)'
			].join('\n');
			targets = ['a', 'b', 'result', '__ia', '__ib'];
			break;
		}

		case 'vectorize': {
			const op = VECTOR_OPS.find((o) => o.id === settings.vectorize.op) ?? VECTOR_OPS[0];
			lines.push(
				'',
				'# Python loop: one element at a time',
				'out = []',
				'for x in a.ravel():',
				`    out.append(${op.loop})`,
				'loop_result = np.array(out).reshape(a.shape)',
				'',
				'# Vectorized: one expression for the whole array',
				`vec_result = ${op.vector}`,
				'',
				'np.array_equal(loop_result, vec_result)'
			);
			targets = ['a', 'loop_result', 'vec_result'];
			break;
		}

		case 'dtype': {
			const t = settings.dtype.target;
			lines.push('', `result = a.astype(np.${t})`, 'result');
			extra = [
				'with np.errstate(all="ignore"):',
				'    __changed = np.asarray(result != a)',
				'    if a.dtype.kind in "fc" and result.dtype.kind in "fc":',
				'        __changed = __changed & ~(np.isnan(a) & np.isnan(result))',
				'__k = result.dtype.kind',
				'if __k in "iu":',
				'    __range = np.array([np.iinfo(result.dtype).min, np.iinfo(result.dtype).max], dtype=result.dtype)',
				'elif __k == "f":',
				'    __range = np.array([np.finfo(result.dtype).min, np.finfo(result.dtype).max], dtype=result.dtype)',
				'elif __k == "b":',
				'    __range = np.array([False, True])'
			].join('\n');
			targets = ['a', 'result', '__changed', '__range'];
			break;
		}
	}

	const code = HEADER + lines.join('\n');
	if (inputError) return { tool, code, targets: [], clear, inputError };
	return { tool, code, extra, targets, clear, inputHint: src.hint };
}

/** Benchmark code for the vectorization tool (runs in its own namespace). */
export function benchmarkCode(opId: VectorOpId, n = 100_000): string {
	const op = VECTOR_OPS.find((o) => o.id === opId) ?? VECTOR_OPS[0];
	return `import time
import numpy as np

a = np.arange(${n.toLocaleString('en-US').replace(/,/g, '_')}, dtype=np.float64)

t0 = time.perf_counter()
out = []
for x in a:
    out.append(${op.loop})
loop_ms = (time.perf_counter() - t0) * 1000

t0 = time.perf_counter()
vec_result = ${op.vector}
vec_ms = (time.perf_counter() - t0) * 1000

np.array([loop_ms, vec_ms])`;
}
