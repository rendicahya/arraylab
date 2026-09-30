/**
 * Why `a<suffix>` gives a view or a copy. NumPy decides (np.shares_memory is the
 * source of truth); this only names the rule behind the answer it gave.
 */

export type ViewKind = 'same' | 'view' | 'copy' | 'scalar';
export type ViewsLang = 'en' | 'id';

/** Explanation for a copy, based on how b was made from a. */
export function copyReason(suffix: string, lang: ViewsLang = 'en'): string {
	const id = lang === 'id';
	const s = suffix.trim();
	if (/\.copy\(\)/.test(s)) return id ? '`.copy()` selalu membuat memori baru — itulah tugasnya.' : '`.copy()` always makes new memory — that is its job.';
	if (/\.flatten\(\)/.test(s))
		return id ? '`flatten()` selalu menyalin. `ravel()` mengembalikan view jika memungkinkan.' : '`flatten()` always copies. `ravel()` returns a view when it can.';
	if (/\.astype\(/.test(s))
		return id
			? 'dtype baru membutuhkan memori baru: `astype` menyalin (bahkan ke dtype yang sama, kecuali `copy=False`).'
			: 'A new dtype needs new memory: `astype` copies (even to the same dtype, unless `copy=False`).';
	if (/^\.T\.(ravel|reshape)|^\.transpose\([^)]*\)\.(ravel|reshape)/.test(s)) {
		return id
			? '`a.T` adalah view yang elemen-elemennya tidak berurutan di memori. Membacanya baris demi baris tidak bisa dijelaskan dengan strides, sehingga `ravel`/`reshape` harus menyalin.'
			: '`a.T` is a view whose elements are not in memory order. Reading it row by row cannot be described by strides, so `ravel`/`reshape` has to copy.';
	}
	if (/^\[/.test(s) && /\ba\b|[<>=]=?|True|False/.test(s)) {
		return id
			? '**Boolean mask** selalu menyalin: elemen-elemen yang dipilih tidak memiliki step yang teratur di memori.'
			: 'A **boolean mask** always copies: the selected elements have no regular step in memory.';
	}
	if (/^\[\s*\[|,\s*\[/.test(s)) {
		return id
			? 'Indexing dengan sebuah **list** (fancy indexing) selalu menyalin, bahkan ketika posisinya terlihat teratur.'
			: 'Indexing with a **list** (fancy indexing) always copies, even when the positions look regular.';
	}
	return id
		? 'NumPy harus menyalin: hasilnya tidak bisa dijelaskan sebagai sebuah jendela (start + strides) ke dalam memori `a`.'
		: 'NumPy had to copy: the result could not be described as a window (start + strides) into `a`’s memory.';
}

/** "12 bytes = 3 elements" for each axis of a view. */
export function strideSteps(strides: readonly number[], itemsize: number, lang: ViewsLang = 'en'): string[] {
	const id = lang === 'id';
	return strides.map((st) => {
		const n = itemsize ? st / itemsize : 0;
		const el = id ? 'elemen' : Math.abs(n) === 1 ? 'element' : 'elements';
		if (st === 0) return id ? '0 byte: elemen yang sama berulang' : '0 bytes: the same element repeats';
		if (id) return `${st > 0 ? '+' : '−'}${Math.abs(st)} byte = ${Math.abs(n)} ${el} ${st > 0 ? 'maju' : 'mundur'}`;
		return `${st > 0 ? '+' : '−'}${Math.abs(st)} bytes = ${Math.abs(n)} ${el} ${st > 0 ? 'forward' : 'backward'}`;
	});
}
