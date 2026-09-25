import { literal, type Chapter } from './types';

export const broadcasting: Chapter = {
	slug: 'broadcasting',
	number: '06',
	title: 'Broadcasting',
	summary: 'Combine arrays of different shapes: align from the right, stretch the 1s.',
	topics: ['Scalar broadcasting', 'Vector broadcasting', 'Shape alignment', 'Compatible shapes', 'Incompatible shapes'],
	phase: 'numpy',
	steps: [
		{
			title: 'Scalar broadcasting',
			body: [
				'`a + 10` adds 10 to every element. The scalar has shape `()` — NumPy treats it as if it were stretched to the shape of `a`.',
				'Hover a result cell to see which two values were combined.'
			],
			patch: { tool: 'broadcast', ...literal('1 2 3\n4 5 6'), broadcast: { b: '10', op: '+' } },
			tasks: [
				{ text: 'Multiply instead', patch: { broadcast: { op: '*' } } },
				{ text: 'Compare: a > 3', patch: { broadcast: { b: '3', op: '>' } } }
			]
		},
		{
			title: 'Vector broadcasting',
			body: [
				'A 1-D array of length 3 can be added to a `(2, 3)` array: it is reused for **every row**.',
				'Dashed cells are the stretched copies. They are only conceptual — NumPy never copies the data, it simply reads the same values again.'
			],
			patch: { tool: 'broadcast', ...literal('1 2 3\n4 5 6'), broadcast: { b: '10 20 30', op: '+' } },
			tasks: [{ text: 'Scale each column differently', patch: { broadcast: { b: '1 10 100', op: '*' } } }]
		},
		{
			title: 'Shape alignment',
			body: [
				'The rule: write the shapes **right-aligned**. Compare column by column: sizes must be **equal**, or one of them must be **1**. A missing dimension counts as 1.',
				'A column `(2, 1)` against `(2, 3)`: the 1 is stretched to 3, so each row gets its own value.'
			],
			patch: { tool: 'broadcast', ...literal('1 2 3\n4 5 6'), broadcast: { b: '100\n200', op: '+' } },
			tasks: [{ text: 'Back to a row vector (3,)', patch: { broadcast: { b: '10 20 30' } } }],
			remember: 'Align from the right. Equal or 1 — otherwise it fails.'
		},
		{
			title: 'Compatible shapes',
			body: [
				'Both operands can stretch. A column `(3, 1)` plus a row `(4,)` gives a `(3, 4)` table — every combination of the two.',
				'This “outer” pattern appears everywhere: distance tables, multiplication tables, pairwise comparisons.'
			],
			patch: { tool: 'broadcast', ...literal('1\n2\n3'), broadcast: { b: '10 20 30 40', op: '*' } },
			tasks: [{ text: 'Addition table', patch: { broadcast: { op: '+' } } }]
		},
		{
			title: 'Incompatible shapes',
			body: [
				'`(2, 3)` and `(2,)` fail: aligned from the right, 3 meets 2 and neither is 1.',
				'Read NumPy’s error together with the alignment table. To use `b` per row, make it a column: shape `(2, 1)`.'
			],
			patch: { tool: 'broadcast', ...literal('1 2 3\n4 5 6'), broadcast: { b: '1 2', op: '+' } },
			tasks: [
				{ text: 'Fix it: make b a column (one value per line)', patch: { broadcast: { b: '1\n2' } } },
				{ text: 'Fix it in code with np.newaxis', patch: { tool: 'code', code: 'import numpy as np\n\na = np.array([[1, 2, 3], [4, 5, 6]])\nb = np.array([1, 2])\n\na + b[:, np.newaxis]   # b becomes shape (2, 1)' } }
			]
		}
	]
};
