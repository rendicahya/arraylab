/**
 * Shape rules of np.concatenate and np.stack, as a table the UI can draw.
 * NumPy decides the actual result; this spells out the rule it applies.
 */

export type CombineColumn = {
	/** Axis of the result. */
	axis: number;
	a: number | null;
	b: number | null;
	out: number | null;
	/** add: sizes are summed (concatenate axis); match: must be equal; new: stack's new axis. */
	status: 'add' | 'match' | 'conflict' | 'new';
};

export type CombinePlan = {
	columns: CombineColumn[];
	/** Result shape, or null when NumPy will refuse. */
	shape: number[] | null;
	problem: string | null;
};

/** Normalize a possibly negative axis for `n` axes; null when out of range. */
export function normalizeAxis(axis: number, n: number): number | null {
	const k = axis < 0 ? axis + n : axis;
	return k >= 0 && k < n ? k : null;
}

export function concatenatePlan(a: readonly number[], b: readonly number[], axis: number): CombinePlan {
	if (a.length !== b.length) {
		return {
			columns: [],
			shape: null,
			problem: `a has ${a.length} axes and b has ${b.length}: concatenate needs the same number of axes.`
		};
	}
	const k = normalizeAxis(axis, a.length);
	if (k === null) return { columns: [], shape: null, problem: `axis ${axis} does not exist for ${a.length}-D arrays.` };
	const columns: CombineColumn[] = a.map((n, i) => {
		if (i === k) return { axis: i, a: n, b: b[i], out: n + b[i], status: 'add' };
		return { axis: i, a: n, b: b[i], out: n === b[i] ? n : null, status: n === b[i] ? 'match' : 'conflict' };
	});
	const bad = columns.find((c) => c.status === 'conflict');
	return {
		columns,
		shape: bad ? null : columns.map((c) => c.out!),
		problem: bad ? `Along axis ${bad.axis} a has ${bad.a} and b has ${bad.b}. Only axis ${k} (the one being joined) may differ.` : null
	};
}

export function stackPlan(a: readonly number[], b: readonly number[], axis: number): CombinePlan {
	const k = normalizeAxis(axis, a.length + 1);
	if (k === null) return { columns: [], shape: null, problem: `axis ${axis} does not exist for the ${a.length + 1}-D result.` };
	const sameShape = a.length === b.length && a.every((n, i) => n === b[i]);
	const columns: CombineColumn[] = [];
	let src = 0;
	for (let i = 0; i <= a.length; i++) {
		if (i === k) {
			columns.push({ axis: i, a: null, b: null, out: 2, status: 'new' });
			continue;
		}
		const x = a[src] ?? null;
		const y = b[src] ?? null;
		columns.push({ axis: i, a: x, b: y, out: x === y ? x : null, status: x === y ? 'match' : 'conflict' });
		src++;
	}
	return {
		columns,
		shape: sameShape ? columns.map((c) => c.out!) : null,
		problem: sameShape ? null : 'stack needs arrays of exactly the same shape: each one becomes one slice of the new axis.'
	};
}
