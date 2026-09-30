/**
 * Explains the parts of an index expression (`a[0, 1:, ::2]`) axis by axis.
 * This only *describes* the syntax; the actual selection always comes from NumPy.
 */

export type IndexPart = { text: string; meaning: string };
export type IndexLang = 'en' | 'id';

/** Split on commas that are not inside brackets/parentheses. */
export function splitTopLevel(expr: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let current = '';
	for (const ch of expr) {
		if ('[('.includes(ch)) depth++;
		if ('])'.includes(ch)) depth--;
		if (ch === ',' && depth === 0) {
			out.push(current.trim());
			current = '';
		} else current += ch;
	}
	if (current.trim() || out.length) out.push(current.trim());
	return out.filter((p, i, all) => p !== '' || i < all.length - 1);
}

export function describeIndex(expr: string, ndim: number, lang: IndexLang = 'en'): IndexPart[] {
	const id = lang === 'id';
	const parts = splitTopLevel(expr.trim());
	if (parts.length === 0) return [];
	const consumes = (p: string) => (p === 'None' || p === 'np.newaxis' ? 0 : p === '...' ? -1 : 1);
	const explicit = parts.reduce((n, p) => n + Math.max(0, consumes(p)), 0);
	const out: IndexPart[] = [];
	let axis = 0;
	for (const p of parts) {
		if (p === '...') {
			const covered = Math.max(0, ndim - explicit);
			out.push({
				text: '...',
				meaning: covered
					? id
						? `Ellipsis: berarti “:” pada ${covered} axis (${range(axis, covered, id)}).`
						: `Ellipsis: stands for “:” on ${covered} axis${covered === 1 ? '' : 'es'} (${range(axis, covered, id)}).`
					: id
						? 'Ellipsis: tidak mencakup axis apa pun di sini.'
						: 'Ellipsis: covers no axes here.'
			});
			axis += covered;
		} else if (p === 'None' || p === 'np.newaxis') {
			out.push({
				text: p,
				meaning: id ? 'menyisipkan axis baru dengan panjang 1 (tidak ada data yang ditambahkan).' : 'inserts a new axis of length 1 (no data is added).'
			});
		} else if (/^-?\d+$/.test(p)) {
			const n = Number(p);
			out.push({
				text: p,
				meaning: id
					? `axis ${axis}: memilih posisi ${n}${n < 0 ? ` (${-n} dari akhir)` : ''} — axis ini menghilang dari hasilnya.`
					: `axis ${axis}: picks position ${n}${n < 0 ? ` (${-n} from the end)` : ''} — this axis disappears from the result.`
			});
			axis++;
		} else if (/^(-?\d*)(:(-?\d*))(:(-?\d*))?$/.test(p)) {
			out.push({
				text: p,
				meaning: id ? `axis ${axis}: ${describeSlice(p, id)} — axis ini dipertahankan.` : `axis ${axis}: ${describeSlice(p, id)} — the axis is kept.`
			});
			axis++;
		} else if (/\ba\b/.test(p) || /[<>=]/.test(p)) {
			out.push({
				text: p,
				meaning: id
					? 'Boolean mask: mempertahankan elemen di mana kondisinya True. Hasilnya 1-D, dalam urutan baca, dan berupa copy.'
					: 'Boolean mask: keeps the elements where the condition is True. The result is 1-D, in reading order, and a copy.'
			});
			axis = ndim;
		} else if (p.startsWith('[')) {
			out.push({
				text: p,
				meaning: id
					? `axis ${axis}: indexing dengan array integer (“fancy”) — memilih tepat posisi-posisi ini, dalam urutan ini, pengulangan diperbolehkan. Selalu berupa copy.`
					: `axis ${axis}: integer-array (“fancy”) indexing — picks exactly these positions, in this order, repeats allowed. Always a copy.`
			});
			axis++;
		} else {
			out.push({ text: p, meaning: id ? `axis ${axis}: dievaluasi oleh NumPy.` : `axis ${axis}: evaluated by NumPy.` });
			axis++;
		}
	}
	if (parts.filter((p) => p.startsWith('[')).length >= 2) {
		out.push({
			text: '(paired)',
			meaning: id
				? 'beberapa array integer dipasangkan elemen demi elemen: entri ke-1 membentuk satu indeks, entri ke-2 indeks berikutnya, …'
				: 'several integer arrays are paired element by element: the 1st entries form one index, the 2nd entries the next, …'
		});
	}
	if (axis < ndim && !parts.includes('...')) {
		out.push({
			text: '(implicit)',
			meaning: id
				? `sisa ${range(axis, ndim - axis, id)} dipertahankan utuh, seolah-olah kamu menulis “:”.`
				: `the remaining ${range(axis, ndim - axis, false)} ${ndim - axis === 1 ? 'is' : 'are'} kept whole, as if you wrote “:”.`
		});
	}
	return out;
}

function range(start: number, count: number, id: boolean): string {
	if (count === 1) return `axis ${start}`;
	const label = id ? 'axis' : 'axes';
	return `${label} ${Array.from({ length: count }, (_, i) => start + i).join(', ')}`;
}

function describeSlice(p: string, id: boolean): string {
	const [start = '', stop = '', step = ''] = p.split(':');
	if (!start && !stop && !step) return id ? '“:” mempertahankan setiap posisi' : '“:” keeps every position';
	const bits: string[] = [];
	if (id) {
		if (step && Number(step) < 0) bits.push(`berjalan mundur${step !== '-1' ? ` dengan langkah ${-Number(step)}` : ''}`);
		bits.push(`dari ${start || (step && Number(step) < 0 ? 'akhir' : 'awal')}`);
		bits.push(stop ? `sampai (tidak termasuk) ${stop}` : `sampai ${step && Number(step) < 0 ? 'awal' : 'akhir'}`);
		if (step && Number(step) > 1) bits.push(`setiap posisi ke-${Number(step)}`);
		return `slice ${bits.join(', ')}`;
	}
	if (step && Number(step) < 0) bits.push(`walks backwards${step !== '-1' ? ` in steps of ${-Number(step)}` : ''}`);
	bits.push(`from ${start || (step && Number(step) < 0 ? 'the end' : 'the start')}`);
	bits.push(stop ? `up to (not including) ${stop}` : `to the ${step && Number(step) < 0 ? 'start' : 'end'}`);
	if (step && Number(step) > 1) bits.push(`every ${ordinalStep(Number(step))} position`);
	return `slice ${bits.join(', ')}`;
}

function ordinalStep(n: number): string {
	return n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}
