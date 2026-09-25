/** Read helpers over ArrayInfo previews (values may be truncated). */
import type { ArrayInfo } from './types';
import { flatIndex, unravel } from './normalize';

/** Formatted value of the element at C-order `flat`, or undefined if outside the preview. */
export function valueAt(info: ArrayInfo, flat: number): string | undefined {
	const index = unravel(flat, info.shape);
	const preview = info.previewShape ?? info.shape;
	if (index.some((i, axis) => i >= preview[axis])) return undefined;
	return info.values?.[flatIndex(index, preview)];
}

/** Integer values of an id/provenance array, keyed by C-order flat position in that array. */
export function idMap(info: ArrayInfo | null): Map<number, number> {
	const out = new Map<number, number>();
	if (!info?.values) return out;
	const preview = info.previewShape ?? info.shape;
	info.values.forEach((v, i) => {
		out.set(flatIndex(unravel(i, preview), info.shape), Number(v));
	});
	return out;
}

/** Boolean values keyed by C-order flat position. */
export function boolMap(info: ArrayInfo | null): Map<number, boolean> {
	const out = new Map<number, boolean>();
	if (!info?.values) return out;
	const preview = info.previewShape ?? info.shape;
	info.values.forEach((v, i) => out.set(flatIndex(unravel(i, preview), info.shape), v === 'True'));
	return out;
}

/** Map each element of an array with `shape` to its output element when reducing `axis`. */
export function reductionGroup(flat: number, shape: number[], axis: number | null): number {
	if (axis === null) return 0;
	const index = unravel(flat, shape);
	const outShape = shape.filter((_, i) => i !== axis);
	return flatIndex(
		index.filter((_, i) => i !== axis),
		outShape
	);
}

/** Build a synthetic ArrayInfo whose element at each position is looked up from `source` via `ids`. */
export function gatherInfo(source: ArrayInfo, ids: ArrayInfo, name: string): ArrayInfo {
	const map = idMap(ids);
	const preview = ids.previewShape ?? ids.shape;
	const values: string[] = [];
	for (let i = 0; i < (ids.values?.length ?? 0); i++) {
		const flat = flatIndex(unravel(i, preview), ids.shape);
		values.push(valueAt(source, map.get(flat) ?? 0) ?? '…');
	}
	return { ...source, name, shape: ids.shape, ndim: ids.ndim, size: ids.size, previewShape: preview, truncated: ids.truncated, values };
}

export function describeDtype(dtype: string): string {
	if (dtype === 'bool') return 'True/False values';
	const m = dtype.match(/^(u?int|float|complex)(\d+)$/);
	if (!m) return dtype;
	const bits = Number(m[2]);
	const kind = m[1] === 'uint' ? 'unsigned integer' : m[1] === 'int' ? 'signed integer' : m[1] === 'float' ? 'floating-point number' : 'complex number';
	return `${bits}-bit ${kind} (${bits / 8} byte${bits === 8 ? "" : "s"} each)`;
}
