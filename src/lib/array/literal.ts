/**
 * Turns typed numbers into NumPy code:
 *
 *   "1 2 3\n4 5 6"   →   np.array([[1, 2, 3],
 *                                  [4, 5, 6]])
 *
 * Rules: values separated by spaces or commas; a new line starts a new row;
 * a blank line starts a new 2-D layer (making the array 3-D). A single value
 * becomes a 0-d array. Brackets are ignored, so pasted Python lists also work.
 * Only literals are accepted, so this input is safe to execute as the user types.
 */

export type Nested = string | Nested[];

export type LiteralParse =
	| {
			ok: true;
			/** Python expression, e.g. `np.array([[1, 2], [3, 4]])` formatted over lines. */
			nested: Nested;
			/** Shape implied by the layout, or null when rows/layers have different lengths. */
			shape: number[] | null;
			ragged: string | null;
	  }
	| { ok: false; message: string };

const NUMBER = /^[+-]?(?:\d+(?:_\d+)*\.?\d*(?:_\d+)*|\.\d+)(?:[eE][+-]?\d+)?$/;
const COMPLEX = /^[+-]?(?:(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[+-])?(?:\d+\.?\d*|\.\d+)?(?:[eE][+-]?\d+)?j$/;

/** Map one typed token to a Python literal, or null when it isn't a value we accept. */
export function toPythonToken(raw: string): string | null {
	const t = raw.trim();
	const lower = t.toLowerCase();
	if (lower === 'true') return 'True';
	if (lower === 'false') return 'False';
	if (lower === 'nan' || lower === 'np.nan') return 'np.nan';
	if (lower === 'inf' || lower === '+inf' || lower === 'np.inf') return 'np.inf';
	if (lower === '-inf' || lower === '-np.inf') return '-np.inf';
	if (NUMBER.test(t)) return t.startsWith('+') ? t.slice(1) : t;
	if (COMPLEX.test(t) && t !== 'j') return t;
	return null;
}

export function parseLiteral(text: string): LiteralParse {
	if (text.includes('[')) return parseBracketed(text);
	const cleaned = text.replace(/[()]/g, ' ').replace(/\r/g, '');
	const layers = cleaned
		.split(/\n[ \t,]*\n/)
		.map((block) =>
			block
				.split('\n')
				.map((line) => line.split(/[\s,;]+/).filter(Boolean))
				.filter((tokens) => tokens.length > 0)
		)
		.filter((rows) => rows.length > 0);

	if (layers.length === 0) return { ok: false, message: 'Type some numbers, e.g. 1 2 3' };

	const converted: string[][][] = [];
	for (let l = 0; l < layers.length; l++) {
		const rows: string[][] = [];
		for (let r = 0; r < layers[l].length; r++) {
			const row: string[] = [];
			for (const token of layers[l][r]) {
				const py = toPythonToken(token);
				if (py === null) {
					return {
						ok: false,
						message: `“${token}” is not a number. Use values like 3, -1.5, 2e3, True, nan or 1+2j.`
					};
				}
				row.push(py);
			}
			rows.push(row);
		}
		converted.push(rows);
	}

	if (converted.length === 1) {
		const rows = converted[0];
		if (rows.length === 1) {
			const row = rows[0];
			if (row.length === 1) return { ok: true, nested: row[0], shape: [], ragged: null };
			return { ok: true, nested: row, shape: [row.length], ragged: null };
		}
		const ragged = raggedRows(rows);
		return {
			ok: true,
			nested: rows,
			shape: ragged ? null : [rows.length, rows[0].length],
			ragged
		};
	}

	const layerRagged = converted.map(raggedRows).find(Boolean) ?? null;
	const sameRows = converted.every((layer) => layer.length === converted[0].length);
	const sameCols = converted.every((layer) => layer[0].length === converted[0][0].length);
	const ragged =
		layerRagged ??
		(sameRows && sameCols
			? null
			: `Layer 2 is ${dims(converted[1])} but layer 1 is ${dims(converted[0])}; every layer needs the same number of rows and columns.`);
	return {
		ok: true,
		nested: converted,
		shape: ragged ? null : [converted.length, converted[0].length, converted[0][0].length],
		ragged
	};
}

/** Parse pasted Python/NumPy list syntax such as `[[1, 2], [3, 4]]`. */
function parseBracketed(text: string): LiteralParse {
	const tokens = text.replace(/np\.array\(|array\(|\)/g, ' ').match(/\[|\]|[^\s,[\]]+/g) ?? [];
	let pos = 0;
	const parseNode = (): Nested => {
		const tok = tokens[pos++];
		if (tok === undefined) throw new Error('Missing closing bracket “]”.');
		if (tok === ']') throw new Error('Unexpected “]”.');
		if (tok !== '[') {
			const py = toPythonToken(tok);
			if (py === null) throw new Error(`“${tok}” is not a number.`);
			return py;
		}
		const items: Nested[] = [];
		while (tokens[pos] !== ']') {
			if (pos >= tokens.length) throw new Error('Missing closing bracket “]”.');
			items.push(parseNode());
		}
		pos++;
		if (items.length === 0) throw new Error('Empty brackets [] are not supported here.');
		return items;
	};
	try {
		const nested = parseNode();
		if (pos !== tokens.length) throw new Error('Unexpected text after the closing bracket.');
		const shape = shapeOf(nested);
		return {
			ok: true,
			nested,
			shape,
			ragged: shape ? null : 'The nested lists have different lengths; an ndarray must be rectangular.'
		};
	} catch (e) {
		return { ok: false, message: (e as Error).message };
	}
}

function shapeOf(n: Nested): number[] | null {
	if (typeof n === 'string') return [];
	const inner = n.map(shapeOf);
	const first = inner[0];
	if (!first || inner.some((s) => !s || s.join() !== first.join())) return null;
	return [n.length, ...first];
}

function dims(rows: string[][]): string {
	return `${rows.length} × ${rows[0].length}`;
}

function raggedRows(rows: string[][]): string | null {
	const expected = rows[0].length;
	const bad = rows.findIndex((row) => row.length !== expected);
	if (bad === -1) return null;
	return `Row ${bad + 1} has ${rows[bad].length} value${rows[bad].length === 1 ? '' : 's'} but row 1 has ${expected}. Every row must have the same length.`;
}

/**
 * Format nested values the way NumPy prints arrays: brackets aligned under each
 * other, columns right-aligned, a blank line between 2-D layers.
 */
export function formatNested(nested: Nested, prefixWidth: number): string {
	if (typeof nested === 'string') return nested;
	const leaves = flattenLeaves(nested);
	const width = Math.max(...leaves.map((l) => l.length));
	const depth = depthOf(nested);
	const pad = (s: string) => s.padStart(width);

	const render = (node: Nested, level: number, indent: number): string => {
		if (typeof node === 'string') return pad(node);
		const children = node as Nested[];
		if (level === depth - 1) return `[${children.map((c) => pad(c as string)).join(', ')}]`;
		const sep = ',\n' + '\n'.repeat(Math.max(0, depth - level - 2)) + ' '.repeat(indent + 1);
		return `[${children.map((c) => render(c, level + 1, indent + 1)).join(sep)}]`;
	};
	return render(nested, 0, prefixWidth);
}

function flattenLeaves(n: Nested): string[] {
	return typeof n === 'string' ? [n] : n.flatMap(flattenLeaves);
}

function depthOf(n: Nested): number {
	return typeof n === 'string' ? 0 : 1 + depthOf(n[0]);
}

/** Python assignment creating the array, e.g. `a = np.array([...], dtype=np.float32)`. */
export function literalToCode(name: string, nested: Nested, dtype?: string): string {
	const prefix = `${name} = np.array(`;
	const dtypeArg = dtype ? `, dtype=np.${dtype}` : '';
	return `${prefix}${formatNested(nested, prefix.length)}${dtypeArg})`;
}
