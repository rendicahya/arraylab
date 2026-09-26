/**
 * Why `a<suffix>` gives a view or a copy. NumPy decides (np.shares_memory is the
 * source of truth); this only names the rule behind the answer it gave.
 */

export type ViewKind = 'same' | 'view' | 'copy' | 'scalar';

/** Explanation for a copy, based on how b was made from a. */
export function copyReason(suffix: string): string {
	const s = suffix.trim();
	if (/\.copy\(\)/.test(s)) return '`.copy()` always makes new memory — that is its job.';
	if (/\.flatten\(\)/.test(s)) return '`flatten()` always copies. `ravel()` returns a view when it can.';
	if (/\.astype\(/.test(s)) return 'A new dtype needs new memory: `astype` copies (even to the same dtype, unless `copy=False`).';
	if (/^\.T\.(ravel|reshape)|^\.transpose\([^)]*\)\.(ravel|reshape)/.test(s)) {
		return '`a.T` is a view whose elements are not in memory order. Reading it row by row cannot be described by strides, so `ravel`/`reshape` has to copy.';
	}
	if (/^\[/.test(s) && /\ba\b|[<>=]=?|True|False/.test(s)) {
		return 'A **boolean mask** always copies: the selected elements have no regular step in memory.';
	}
	if (/^\[\s*\[|,\s*\[/.test(s)) {
		return 'Indexing with a **list** (fancy indexing) always copies, even when the positions look regular.';
	}
	return 'NumPy had to copy: the result could not be described as a window (start + strides) into `a`’s memory.';
}

/** "12 bytes = 3 elements" for each axis of a view. */
export function strideSteps(strides: readonly number[], itemsize: number): string[] {
	return strides.map((st) => {
		const n = itemsize ? st / itemsize : 0;
		const el = Math.abs(n) === 1 ? 'element' : 'elements';
		if (st === 0) return '0 bytes: the same element repeats';
		return `${st > 0 ? '+' : '−'}${Math.abs(st)} bytes = ${Math.abs(n)} ${el} ${st > 0 ? 'forward' : 'backward'}`;
	});
}
