/**
 * Broadcasting shape alignment, used to *draw* NumPy's rule. Whether the
 * operation succeeds and what it produces always comes from NumPy itself.
 */

export type DimCheck = {
	/** Dimension of each operand at this position, or null when it is missing (padded). */
	dims: (number | null)[];
	result: number | null;
	status: 'equal' | 'stretch' | 'missing' | 'conflict';
};

export type Alignment = {
	columns: DimCheck[];
	compatible: boolean;
	resultShape: number[] | null;
};

/** Align shapes from the right and apply NumPy's rule to each column. */
export function alignShapes(shapes: number[][]): Alignment {
	const width = Math.max(0, ...shapes.map((s) => s.length));
	const columns: DimCheck[] = [];
	for (let pos = 0; pos < width; pos++) {
		const dims = shapes.map((s) => {
			const i = s.length - width + pos;
			return i >= 0 ? s[i] : null;
		});
		const present = dims.filter((d): d is number => d !== null);
		const nonOne = [...new Set(present.filter((d) => d !== 1))];
		let status: DimCheck['status'];
		let result: number | null;
		if (nonOne.length > 1) {
			status = 'conflict';
			result = null;
		} else {
			result = nonOne[0] ?? 1;
			if (dims.some((d) => d === null)) status = 'missing';
			else if (present.every((d) => d === result)) status = 'equal';
			else status = 'stretch';
		}
		columns.push({ dims, result, status });
	}
	const compatible = columns.every((c) => c.status !== 'conflict');
	return {
		columns,
		compatible,
		resultShape: compatible ? columns.map((c) => c.result as number) : null
	};
}

/** Human-readable reason for one column of the alignment table. */
export function explainColumn(col: DimCheck, names: string[]): string {
	const parts = col.dims.map((d, i) => `${names[i]}: ${d ?? '—'}`).join(', ');
	switch (col.status) {
		case 'equal':
			return `${parts} → equal, keep ${col.result}`;
		case 'stretch': {
			const stretched = col.dims
				.map((d, i) => (d === 1 && col.result !== 1 ? names[i] : null))
				.filter(Boolean);
			return `${parts} → ${stretched.join(' and ')} has size 1, stretched to ${col.result}`;
		}
		case 'missing': {
			const missing = col.dims.map((d, i) => (d === null ? names[i] : null)).filter(Boolean);
			return `${parts} → ${missing.join(' and ')} has no dimension here; treated as 1, then stretched to ${col.result}`;
		}
		case 'conflict':
			return `${parts} → sizes differ and neither is 1: incompatible`;
	}
}
