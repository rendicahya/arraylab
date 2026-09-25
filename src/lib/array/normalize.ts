/** Pure helpers for C-order (row-major) index arithmetic and shape formatting. */

export function product(shape: readonly number[]): number {
	return shape.reduce((acc, n) => acc * n, 1);
}

/** Element strides (not byte strides) of a C-contiguous array. */
export function elementStrides(shape: readonly number[]): number[] {
	const strides = new Array<number>(shape.length);
	let acc = 1;
	for (let i = shape.length - 1; i >= 0; i--) {
		strides[i] = acc;
		acc *= shape[i];
	}
	return strides;
}

export function flatIndex(index: readonly number[], shape: readonly number[]): number {
	const strides = elementStrides(shape);
	return index.reduce((acc, i, axis) => acc + i * strides[axis], 0);
}

export function unravel(flat: number, shape: readonly number[]): number[] {
	return elementStrides(shape).map((s, axis) => Math.floor(flat / s) % shape[axis]);
}

/** Python-style tuple formatting: `()`, `(3,)`, `(2, 3)`. */
export function formatShape(shape: readonly number[]): string {
	if (shape.length === 0) return '()';
	if (shape.length === 1) return `(${shape[0]},)`;
	return `(${shape.join(', ')})`;
}

/** `a[1, 2]` style label for an element. */
export function formatIndex(name: string, index: readonly number[]): string {
	return index.length === 0 ? `${name}[()]` : `${name}[${index.join(', ')}]`;
}

export function formatCount(n: number): string {
	return n.toLocaleString('en-US');
}

export function formatBytes(n: number): string {
	if (n < 1024) return `${formatCount(n)} byte${n === 1 ? '' : 's'}`;
	if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KiB (${formatCount(n)} bytes)`;
	return `${(n / 1024 ** 2).toFixed(1)} MiB (${formatCount(n)} bytes)`;
}

/**
 * Structural names for each axis, used alongside (never instead of) the axis number.
 * The last axis runs along a row, the second-to-last down a column; anything further
 * out selects a 2-D block. Deliberately avoids "axis 0 means rows".
 */
export function axisRoles(ndim: number): string[] {
	return Array.from({ length: ndim }, (_, axis) => {
		const fromEnd = ndim - axis;
		if (fromEnd === 1) return ndim === 1 ? 'elements' : 'columns';
		if (fromEnd === 2) return 'rows';
		if (fromEnd === 3) return 'blocks';
		return 'groups of blocks';
	});
}

/** Iterate every multi-index of `shape` in C order. */
export function* indices(shape: readonly number[]): Generator<number[]> {
	const total = product(shape);
	for (let flat = 0; flat < total; flat++) yield unravel(flat, shape);
}

/** Divisor-based reshape suggestions for an array of `size` elements. */
export function reshapeSuggestions(size: number, max = 6): string[] {
	const out: string[] = [formatShape([size])];
	for (let r = 2; r < size && out.length < max; r++) {
		if (size % r === 0) out.push(formatShape([r, size / r]));
	}
	return out;
}

export function ordinal(n: number): string {
	const suffixes = ['th', 'st', 'nd', 'rd'];
	const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (suffixes[n % 10] ?? 'th');
	return `${n}${suffix}`;
}
