import { alignShapes } from './broadcast';
import { formatShape, reshapeSuggestions } from './normalize';

/** Minimal error shape shared with the runtime protocol. */
export type PythonError = { type: string; message: string; line: number | null };

export type Explanation = {
	title: string;
	details: string[];
	/** Monospace block, e.g. a shape alignment table. */
	diagram?: string;
	hint?: string;
};

function parseTuple(text: string): number[] {
	return text
		.replace(/[()]/g, '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
		.map(Number);
}

/**
 * Translate a Python/NumPy error into an educational explanation.
 * The original error is always shown alongside; this never replaces it.
 */
export function explainError(err: PythonError): Explanation {
	const { type, message } = err;
	const at = err.line ? ` (line ${err.line})` : '';

	let m = message.match(/operands could not be broadcast together with shapes ((?:\([\d,]*\)\s*)+)/);
	if (m) {
		const shapes = [...m[1].matchAll(/\(([\d,]*)\)/g)].map((x) => parseTuple(x[1]));
		const names = shapes.map((_, i) => String.fromCharCode(65 + i));
		const al = alignShapes(shapes);
		const width = al.columns.length;
		const cell = (v: string) => v.padStart(4);
		const rows = shapes.map(
			(s, i) =>
				`${names[i]} ${formatShape(s).padEnd(12)}` +
				al.columns.map((_, pos) => cell(String(s[s.length - width + pos] ?? ''))).join('')
		);
		const verdict =
			' '.repeat(14) +
			al.columns.map((c) => cell(c.status === 'conflict' ? '✕' : '✓')).join('');
		const bad = al.columns.find((c) => c.status === 'conflict');
		const [A, B] = shapes;
		let hint = 'Change one of the arrays so every mismatched dimension becomes 1 or equal.';
		if (A && B && B.length === 1 && A.length === 2 && B[0] === A[0]) {
			hint = `B matches A's first dimension. Make it a column: b.reshape(${B[0]}, 1) or b[:, np.newaxis] (shape (${B[0]}, 1)).`;
		} else if (A && B && B.length === 1 && A.length >= 1) {
			hint = `Try giving B shape ${formatShape([A[A.length - 1]])} so it matches A's last dimension.`;
		}
		return {
			title: 'These arrays cannot be broadcast together.',
			details: [
				'NumPy compares shapes from the right. Each pair of dimensions must be equal, or one of them must be 1.',
				bad
					? `${bad.dims.filter((d) => d !== null).join(' vs ')}: different sizes and neither is 1.`
					: ''
			].filter(Boolean),
			diagram: [...rows, verdict].join('\n'),
			hint
		};
	}

	m = message.match(/cannot reshape array of size (\d+) into shape (\([^)]*\))/);
	if (m) {
		const size = Number(m[1]);
		const target = parseTuple(m[2]);
		const known = target.filter((d) => d !== -1).reduce((a, b) => a * b, 1);
		return {
			title: `${size} elements cannot be arranged as ${m[2]}.`,
			details: [
				'reshape never adds or drops elements: the product of the new shape must equal the size.',
				target.includes(-1)
					? `With -1, NumPy infers that dimension as ${size} ÷ ${known}, which is not a whole number.`
					: `${target.join(' × ')} = ${known}, but the array has ${size} elements.`
			],
			hint: `Shapes that work for ${size} elements include ${reshapeSuggestions(size).join(', ')}.`
		};
	}

	if (/inhomogeneous shape/.test(message)) {
		return {
			title: 'The rows have different lengths.',
			details: [
				'An ndarray is rectangular: every row needs the same number of values (and every layer the same number of rows).',
				message.match(/detected shape was ([^.]*)/)?.[0] ?? ''
			].filter(Boolean),
			hint: 'Add or remove values so all rows match.'
		};
	}

	m = message.match(/index (-?\d+) is out of bounds for axis (\d+) with size (\d+)/);
	if (m) {
		const n = Number(m[3]);
		return {
			title: `Index ${m[1]} does not exist along axis ${m[2]}.`,
			details: [
				`Axis ${m[2]} has length ${n}, so valid positions are 0 to ${n - 1} (or -${n} to -1 counting from the end).`,
				'Indexing starts at 0, not 1.'
			],
			hint: `Try an index between 0 and ${n - 1}.`
		};
	}

	m = message.match(/too many indices for array: array is (\d+)-dimensional, but (\d+) were indexed/);
	if (m) {
		return {
			title: `Too many indices: the array has ${m[1]} ${Number(m[1]) === 1 ? 'axis' : 'axes'}, you gave ${m[2]}.`,
			details: ['Each comma-separated index selects along one axis, so you can give at most ndim of them.']
		};
	}

	m = message.match(/axis (-?\d+) is out of bounds for array of dimension (\d+)/);
	if (m) {
		const nd = Number(m[2]);
		return {
			title: `Axis ${m[1]} does not exist for a ${nd}-D array.`,
			details: [
				nd === 0
					? 'A 0-d array has no axes at all.'
					: `A ${nd}-D array has axes 0 to ${nd - 1} (or -${nd} to -1 counting from the end).`
			]
		};
	}

	m = message.match(/boolean index did not match indexed array along (?:axis|dimension) (\d+); size of (?:axis|dimension) is (\d+) but size of corresponding boolean (?:axis|dimension) is (\d+)/);
	if (m) {
		return {
			title: 'The boolean mask has the wrong shape.',
			details: [
				`Along axis ${m[1]} the array has ${m[2]} elements but the mask has ${m[3]}.`,
				'A mask needs one True/False per element it selects from — usually the same shape as the array, e.g. a > 2.'
			]
		};
	}

	m = message.match(/Python integer (-?\d+) out of bounds for (\w+)/);
	if (m) {
		return {
			title: `${m[1]} does not fit in ${m[2]}.`,
			details: [
				`Every dtype has a fixed range. np.iinfo(np.${m[2]}) shows the smallest and largest values ${m[2]} can store.`
			],
			hint: 'Choose a wider dtype (e.g. int32 or int64) or a float dtype.'
		};
	}

	m = message.match(/Cannot cast ufunc '(\w+)' output from dtype\('(\w+)'\) to dtype\('(\w+)'\)/);
	if (m) {
		return {
			title: `The ${m[2]} result cannot be stored back into a ${m[3]} array.`,
			details: [
				`In-place operations (like +=) write into the existing array, which keeps its dtype ${m[3]}. NumPy refuses to silently drop information.`
			],
			hint: `Use a = a ${m[1] === 'add' ? '+' : '…'} … (creates a new array) or convert first with a.astype(np.${m[2]}).`
		};
	}

	// ---- pandas ----
	m = message.match(/Shape of passed values is \((\d+), (\d+)\), indices imply \((\d+), (\d+)\)/);
	if (m) {
		return {
			title: 'The number of labels does not match the array.',
			details: [
				`The array has ${m[1]} rows and ${m[2]} columns, but the labels describe ${m[3]} rows and ${m[4]} columns.`,
				'A DataFrame needs exactly one row label per row and one column label per column.'
			],
			hint: 'Add or remove labels — or leave them empty to get the default positions 0, 1, 2 …'
		};
	}

	m = message.match(/Must pass 2-d input\. shape=(\([^)]*\))/);
	if (m) {
		return {
			title: `A DataFrame cannot hold a ${parseTuple(m[1]).length}-D array.`,
			details: [`The array has shape ${m[1]}. A DataFrame is a 2-D table: pass a 1-D array (one column) or a 2-D array.`],
			hint: 'Reshape the array to 2-D first, e.g. a.reshape(-1, a.shape[-1]).'
		};
	}

	if (type === 'KeyError') {
		return {
			title: `There is no key or label ${message}${at}.`,
			details: [
				'A dict raises KeyError for a missing key. pandas raises it when .loc[…] or df[…] cannot find a label: the label must exist exactly (text labels are case-sensitive, and 0 is not the same as \'0\').',
				'To select rows or columns by position (0, 1, 2 …) use .iloc[…] instead.'
			]
		};
	}

	if (/single positional indexer is out-of-bounds/.test(message)) {
		return {
			title: 'That position does not exist.',
			details: ['.iloc counts positions from 0, so the last row is at position (number of rows − 1).']
		};
	}

	if (/iLocation based boolean indexing cannot use an indexable as a mask/.test(message)) {
		return {
			title: '.iloc does not take a boolean Series.',
			details: [
				'.iloc works with positions only, and a Series carries labels.',
				'Use .loc with the mask (df.loc[df[\'A\'] > 2]), or turn it into a plain array: df.iloc[(df[\'A\'] > 2).to_numpy()].'
			]
		};
	}

	if (type === 'ModuleNotFoundError' && /torch/.test(message)) {
		return {
			title: 'PyTorch is not available in this browser runtime.',
			details: [
				'ArrayLab runs real Python in your browser with Pyodide, which ships NumPy but not PyTorch.',
				'Rather than simulating PyTorch, ArrayLab only teaches it once a real browser-compatible build is available.'
			]
		};
	}

	if (type === 'ModuleNotFoundError') {
		return {
			title: 'That module is not available here.',
			details: ['This lab runs Python with NumPy and pandas (plus the other packages Pyodide ships). This one is not available.']
		};
	}

	if (type === 'SyntaxError' || type === 'IndentationError') {
		return {
			title: `Python could not read the code${at}.`,
			details: [
				'This is a syntax problem — the code never ran.',
				'Look for a missing comma, bracket, parenthesis or colon, or inconsistent indentation.'
			]
		};
	}

	m = message.match(/name '(\w+)' is not defined/);
	if (m) {
		return {
			title: `“${m[1]}” has not been defined${at}.`,
			details: [
				m[1] === 'torch'
					? 'PyTorch is not available in this browser runtime.'
					: `Create ${m[1]} first (e.g. ${m[1]} = np.array([1, 2, 3])), or check the spelling. Names are case-sensitive.`
			]
		};
	}

	if (type === 'ZeroDivisionError') {
		return {
			title: 'Division by zero with plain Python numbers.',
			details: [
				'Python ints/floats raise an error. NumPy arrays instead produce inf or nan with a warning.'
			]
		};
	}

	return {
		title: `Python raised ${/^[AEIOU]/.test(type) ? 'an' : 'a'} ${type}${at}.`,
		details: ['Read the original message below; the last line usually says what went wrong.']
	};
}
