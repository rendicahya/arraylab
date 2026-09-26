/**
 * Share links: the lab state (only what differs from the defaults) and the
 * editor code, as base64url JSON in the URL hash (#s=…). Nothing is sent to a
 * server. A link is untrusted input: every field is checked against the known
 * settings, and expressions that are not plain numbers/slices are reported so
 * the lab can ask before running them.
 */
import { DEFAULT_SCRATCH, DEFAULT_SETTINGS, TOOLS, type LabSettings } from './types';
import { DTYPES, MAX_PARTS, REDUCE_FNS, VECTOR_OPS, isSimpleIndex } from './codegen';
import { PANDAS_OPS, PANDAS_REDUCE, isSimpleSelection } from '../pandas/codegen';

const VERSION = 1;
const MAX_LINK_CHARS = 8000;

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Shared = { v: number; s?: Json; c?: string };

export type SharedState = {
	settings: LabSettings;
	/** Editor code, when the link carries some. It never runs by itself. */
	code?: string;
	/** Expressions the lab would run that are not plain numbers, slices or labels. */
	unsafe: string[];
};

// ---- encoding ---------------------------------------------------------------------

/** Fields of `value` that differ from `base` (objects compared recursively). */
function diff(value: unknown, base: unknown): Json | undefined {
	if (isObject(value) && isObject(base)) {
		const out: Record<string, Json> = {};
		for (const key of Object.keys(value)) {
			const d = diff(value[key], base[key]);
			if (d !== undefined) out[key] = d;
		}
		return Object.keys(out).length ? out : undefined;
	}
	return JSON.stringify(value) === JSON.stringify(base) ? undefined : (value as Json);
}

function toBase64Url(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): string {
	const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
	const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
	return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** The `s=…` value for a link to this state. */
export function encodeShare(settings: LabSettings, code?: string): string {
	const payload: Shared = { v: VERSION };
	const s = diff(settings, DEFAULT_SETTINGS);
	if (s !== undefined) payload.s = s;
	if (code !== undefined && code !== DEFAULT_SCRATCH) payload.c = code;
	return toBase64Url(JSON.stringify(payload));
}

// ---- decoding ---------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Settings that may be null (axis=None, no highlighted row); `sanitize` checks their values. */
const NULLABLE = new Set(['axis.axis', 'torch.focus']);

/** Copies `incoming` onto a clone of `base`, keeping only known keys with the same type. */
function merge<T>(base: T, incoming: unknown, path = ''): T {
	if (!isObject(base) || !isObject(incoming)) return base;
	const out = { ...base } as Record<string, unknown>;
	for (const [key, def] of Object.entries(base)) {
		if (!(key in incoming)) continue;
		const v = incoming[key];
		const at = path ? `${path}.${key}` : key;
		if (isObject(def)) out[key] = merge(def, v, at);
		else if (NULLABLE.has(at) && (v === null || typeof v === 'string' || typeof v === 'number')) out[key] = v;
		else if (typeof v === typeof def && (typeof v !== 'number' || Number.isFinite(v))) out[key] = v;
	}
	return out as T;
}

function oneOf<T>(value: T, allowed: readonly T[], fallback: T): T {
	return allowed.includes(value) ? value : fallback;
}

function int(value: number | null, min: number, max: number, fallback: number): number {
	return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

/** Only values the UI itself can produce survive. */
function sanitize(s: LabSettings): LabSettings {
	const d = DEFAULT_SETTINGS;
	s.tool = oneOf(s.tool, TOOLS.map((t) => t.id), d.tool);
	s.source.mode = oneOf(s.source.mode, ['literal', 'expr'] as const, d.source.mode);
	s.source.dtype = oneOf(s.source.dtype, ['', ...DTYPES], '');
	s.axis.fn = oneOf(s.axis.fn, REDUCE_FNS.map((f) => f.id), d.axis.fn);
	s.axis.axis = s.axis.axis === null ? null : int(s.axis.axis, -8, 8, 0);
	s.reshape.op = oneOf(s.reshape.op, ['reshape', 'transpose', 'flatten', 'ravel'] as const, d.reshape.op);
	s.broadcast.op = oneOf(s.broadcast.op, ['+', '-', '*', '/', '**', '>'] as const, d.broadcast.op);
	s.vectorize.op = oneOf(s.vectorize.op, VECTOR_OPS.map((o) => o.id), d.vectorize.op);
	s.dtype.target = oneOf(s.dtype.target, [...DTYPES], d.dtype.target);
	s.combine.op = oneOf(s.combine.op, ['concatenate', 'stack', 'split'] as const, d.combine.op);
	s.combine.axis = int(s.combine.axis, -8, 8, 0);
	s.combine.parts = int(s.combine.parts, 1, MAX_PARTS, d.combine.parts);
	s.torch.view = oneOf(s.torch.view, ['tensor', 'convert', 'ops', 'create', 'device'] as const, d.torch.view);
	s.torch.focus = oneOf(s.torch.focus, ['shape', 'dtype', 'numel', 'device', null] as const, null);
	s.autograd.phase = oneOf(s.autograd.phase, ['forward', 'backward'] as const, d.autograd.phase);
	const p = s.pandas;
	p.view = oneOf(p.view, ['frame', 'dtypes', 'axis', 'select', 'align'] as const, d.pandas.view);
	p.missing = oneOf(p.missing, ['none', 'name', 'age', 'score', 'passed'] as const, d.pandas.missing);
	p.fn = oneOf(p.fn, PANDAS_REDUCE, d.pandas.fn);
	p.axis = oneOf(p.axis, [0, 1] as const, d.pandas.axis);
	p.accessor = oneOf(p.accessor, ['', 'loc', 'iloc'] as const, d.pandas.accessor);
	p.op = oneOf(p.op, PANDAS_OPS.map((o) => o.op), d.pandas.op);
	return s;
}

/** Array creation calls that only take numbers, e.g. np.arange(12).reshape(3, 4). */
const SAFE_EXPR =
	/^(?:np\.(?:arange|zeros|ones|eye|linspace)\([\d\s.,()\-_]*\)(?:\.reshape\([\d\s,\-]*\))?|np\.random\.default_rng\(\d*\)\.(?:integers|random|normal)\((?:[\d\s.,()\-_]|size=)*\))$/;

/** `[…]`, `.T`, `.copy()`, `.ravel()`, `.flatten()`, `.reshape(3, 2)`, `.transpose(1, 0)` — chained. */
export function isSimpleSuffix(suffix: string): boolean {
	let rest = suffix.trim();
	while (rest) {
		const m = rest.match(/^(?:\.T|\.(?:copy|ravel|flatten)\(\)|\.(?:reshape|transpose)\([\d\s,\-]*\))/);
		if (m) {
			rest = rest.slice(m[0].length);
			continue;
		}
		if (!rest.startsWith('[')) return false;
		let depth = 0;
		let end = -1;
		for (let i = 0; i < rest.length; i++) {
			if (rest[i] === '[') depth++;
			else if (rest[i] === ']' && --depth === 0) {
				end = i;
				break;
			}
		}
		if (end < 0 || !isSimpleIndex(rest.slice(1, end))) return false;
		rest = rest.slice(end + 1);
	}
	return true;
}

/** Expressions in `s` that would run without being plain numbers, slices or labels. */
export function unsafeExpressions(s: LabSettings): string[] {
	const out: string[] = [];
	if (s.source.mode === 'expr' && !SAFE_EXPR.test(s.source.expr.trim())) out.push(`a = ${s.source.expr}`);
	if (!isSimpleIndex(s.index.expr)) out.push(`a[${s.index.expr}]`);
	if (!isSimpleSuffix(s.views.suffix)) out.push(`b = a${s.views.suffix}`);
	if (!isSimpleSelection(s.pandas.select)) out.push(`df${s.pandas.accessor ? '.' + s.pandas.accessor : ''}[${s.pandas.select}]`);
	return out;
}

/** Reads `#s=…`; null when the hash holds no (readable) link. */
export function decodeShare(hash: string): SharedState | null {
	const m = hash.match(/(?:^#|&)s=([A-Za-z0-9_-]+)/);
	if (!m || m[1].length > MAX_LINK_CHARS) return null;
	let payload: unknown;
	try {
		payload = JSON.parse(fromBase64Url(m[1]));
	} catch {
		return null;
	}
	if (!isObject(payload) || payload.v !== VERSION) return null;
	const settings = sanitize(merge(structuredClone(DEFAULT_SETTINGS), payload.s));
	const code = typeof payload.c === 'string' ? payload.c : undefined;
	return { settings, code, unsafe: unsafeExpressions(settings) };
}
