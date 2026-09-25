/**
 * Explains the parts of an index expression (`a[0, 1:, ::2]`) axis by axis.
 * This only *describes* the syntax; the actual selection always comes from NumPy.
 */

export type IndexPart = { text: string; meaning: string };

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

export function describeIndex(expr: string, ndim: number): IndexPart[] {
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
					? `Ellipsis: stands for “:” on ${covered} axis${covered === 1 ? '' : 'es'} (${range(axis, covered)}).`
					: 'Ellipsis: covers no axes here.'
			});
			axis += covered;
		} else if (p === 'None' || p === 'np.newaxis') {
			out.push({ text: p, meaning: 'inserts a new axis of length 1 (no data is added).' });
		} else if (/^-?\d+$/.test(p)) {
			const n = Number(p);
			out.push({
				text: p,
				meaning: `axis ${axis}: picks position ${n}${n < 0 ? ` (${-n} from the end)` : ''} — this axis disappears from the result.`
			});
			axis++;
		} else if (/^(-?\d*)(:(-?\d*))(:(-?\d*))?$/.test(p)) {
			out.push({ text: p, meaning: `axis ${axis}: ${describeSlice(p)} — the axis is kept.` });
			axis++;
		} else if (/\ba\b/.test(p) || /[<>=]/.test(p)) {
			out.push({
				text: p,
				meaning:
					'Boolean mask: keeps the elements where the condition is True. The result is 1-D, in reading order, and a copy.'
			});
			axis = ndim;
		} else if (p.startsWith('[')) {
			out.push({
				text: p,
				meaning: `axis ${axis}: integer-array (“fancy”) indexing — picks exactly these positions, in this order, repeats allowed. Always a copy.`
			});
			axis++;
		} else {
			out.push({ text: p, meaning: `axis ${axis}: evaluated by NumPy.` });
			axis++;
		}
	}
	if (parts.filter((p) => p.startsWith('[')).length >= 2) {
		out.push({
			text: '(paired)',
			meaning:
				'several integer arrays are paired element by element: the 1st entries form one index, the 2nd entries the next, …'
		});
	}
	if (axis < ndim && !parts.includes('...')) {
		out.push({
			text: '(implicit)',
			meaning: `the remaining ${range(axis, ndim - axis)} ${ndim - axis === 1 ? 'is' : 'are'} kept whole, as if you wrote “:”.`
		});
	}
	return out;
}

function range(start: number, count: number): string {
	if (count === 1) return `axis ${start}`;
	return `axes ${Array.from({ length: count }, (_, i) => start + i).join(', ')}`;
}

function describeSlice(p: string): string {
	const [start = '', stop = '', step = ''] = p.split(':');
	if (!start && !stop && !step) return '“:” keeps every position';
	const bits: string[] = [];
	if (step && Number(step) < 0) bits.push(`walks backwards${step !== '-1' ? ` in steps of ${-Number(step)}` : ''}`);
	bits.push(`from ${start || (step && Number(step) < 0 ? 'the end' : 'the start')}`);
	bits.push(stop ? `up to (not including) ${stop}` : `to the ${step && Number(step) < 0 ? 'start' : 'end'}`);
	if (step && Number(step) > 1) bits.push(`every ${ordinalStep(Number(step))} position`);
	return `slice ${bits.join(', ')}`;
}

function ordinalStep(n: number): string {
	return n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}
