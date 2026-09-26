/**
 * NumPy → PyTorch translation for the PyTorch chapters.
 *
 * PyTorch cannot run in the browser, so ArrayLab runs the NumPy side for real and
 * shows the equivalent PyTorch code next to it. Every statement about what PyTorch
 * returns (dtypes, errors, grad_fn names) is looked up in `reference.json`, which is
 * recorded from a real PyTorch installation by `scripts/torch_reference.py`.
 */
import reference from './reference.json';
import { parseLiteral, formatNested, type Nested } from '../array/literal';
import type { ArrayInfo } from '../array/types';
import type { SourceState } from '../lab/types';

export const TORCH_REFERENCE = reference;
export const TORCH_VERSION = reference.torch;

/** Notebooks with the same examples, runnable with real PyTorch in Google Colab. */
const COLAB_BASE = 'https://colab.research.google.com/github/rendicahya/arraylab/blob/main/notebooks/';
export function colabUrl(notebook: string): string {
	return COLAB_BASE + notebook;
}

type OpEntry = { dtype: string } | { error: string };
type OpReference = { numpy: string; torch: string; byDtype: Record<string, OpEntry> };

export type TorchOp = { id: string; label: string; numpy: string; torch: string; note?: string };

/** Operations with a NumPy and a PyTorch spelling. The code comes from the reference. */
export const TORCH_OPS: TorchOp[] = (
	[
		['sum0', 'sum along 0', 'NumPy says `axis`, PyTorch says `dim` (PyTorch also accepts `axis` as an alias).'],
		['sum', 'sum', 'Summing integers gives **int64** in PyTorch, whatever the integer size.'],
		['mean', 'mean', 'PyTorch refuses to average integer tensors: convert first with `t.float().mean()`.'],
		['max', 'max', undefined],
		['double', '× 2', undefined],
		['half', '÷ 2', 'True division of integers gives **float32** in PyTorch (NumPy gives float64).'],
		['sqrt', 'sqrt', 'Math functions on integers give **float32** in PyTorch (NumPy gives float64).'],
		['row0', 'first row', undefined],
		['flat', 'reshape(-1)', undefined],
		['unsqueeze', 'new axis 0', 'NumPy `np.expand_dims(a, 0)` = PyTorch `t.unsqueeze(0)`.'],
		['float32', 'to float32', 'NumPy `astype` = PyTorch `.to(dtype)` (or shortcuts like `t.float()`).'],
		['copy', 'copy', 'NumPy `copy()` = PyTorch `clone()`.'],
		['concat', 'concatenate', 'NumPy `np.concatenate` = PyTorch `torch.cat`.']
	] as const
).map(([id, label, note]) => {
	const ref = (reference.ops as Record<string, OpReference>)[id];
	return { id, label, numpy: ref.numpy, torch: ref.torch, note };
});

export function torchOp(id: string): TorchOp {
	return TORCH_OPS.find((o) => o.id === id) ?? TORCH_OPS[0];
}

/** What real PyTorch returned for `op` on a tensor of `torchDtype` (recorded). */
export function torchOpResult(opId: string, torchDtype: string): OpEntry | null {
	const ref = (reference.ops as Record<string, OpReference>)[opId];
	return ref?.byDtype[torchDtype] ?? null;
}

export type CreatePreset = {
	id: string;
	torch: string;
	numpy: string;
	dtype: string;
	numpyDtype: string;
	random: boolean;
};

export const CREATE_PRESETS: CreatePreset[] = Object.entries(reference.create).map(([id, c]) => ({
	id,
	torch: c.torch,
	numpy: c.numpy,
	dtype: c.dtype,
	numpyDtype: c.numpyDtype,
	random: id.startsWith('rand')
}));

export function createPresetFor(expr: string): CreatePreset | undefined {
	const e = expr.replace(/\s+/g, '');
	return CREATE_PRESETS.find((p) => p.numpy.replace(/\s+/g, '') === e);
}

/** `torch.int32` for a NumPy dtype name, as `torch.from_numpy` maps it. */
export function torchDtypeOf(numpyDtype: string): string | null {
	return (reference.fromNumpy as Record<string, string>)[numpyDtype] ?? null;
}

export function elementSize(torchDtype: string): number | null {
	return (reference.elementSize as Record<string, number>)[torchDtype] ?? null;
}

/** `torch.Size([2, 3])` */
export function torchSize(shape: number[]): string {
	return `torch.Size([${shape.join(', ')}])`;
}

/**
 * How the PyTorch tool creates tensor `t` from the lab's source, and the dtype
 * PyTorch gives it.
 * - Typed numbers become `torch.tensor([...])`: PyTorch picks its own dtype from the
 *   Python values (int64 for integers, float32 for floats), unlike NumPy.
 * - A NumPy expression becomes `torch.from_numpy(a)`, which keeps a's dtype.
 */
export function tensorSource(
	source: SourceState,
	a: ArrayInfo | null
): { code: string; dtype: string | null; how: 'tensor' | 'from_numpy' } {
	if (source.mode === 'literal') {
		const parsed = parseLiteral(source.text);
		if (parsed.ok) {
			const prefix = 't = torch.tensor(';
			const nested = toTorchLeaves(parsed.nested);
			const dtypeArg = source.dtype ? `, dtype=torch.${source.dtype}` : '';
			const code = `${prefix}${formatNested(nested, prefix.length)}${dtypeArg})`;
			const dtype = source.dtype ? torchDtypeOf(source.dtype) : a ? inferredFromList(a) : null;
			return { code, dtype, how: 'tensor' };
		}
	}
	return {
		code: 't = torch.from_numpy(a)',
		dtype: a ? torchDtypeOf(a.dtype) : null,
		how: 'from_numpy'
	};
}

/** Constants in typed numbers (np.nan, np.inf) have PyTorch twins. */
function toTorchLeaves(n: Nested): Nested {
	return typeof n === 'string' ? n.replace(/^(-?)np\./, '$1torch.') : n.map(toTorchLeaves);
}

/** dtype of `torch.tensor(python_list)` given the kind of values NumPy found. */
function inferredFromList(a: ArrayInfo): string | null {
	const fromList = reference.tensorFromList;
	switch (a.dtypeKind) {
		case 'b':
			return fromList.bool;
		case 'i':
		case 'u':
			return fromList.int;
		case 'f':
			return fromList.float;
		case 'c':
			return fromList.complex;
		default:
			return null;
	}
}
