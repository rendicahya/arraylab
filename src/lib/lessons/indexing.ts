import { expr, literal, type Chapter } from './types';

const GRID = '1 2 3 4\n5 6 7 8\n9 10 11 12';

export const indexing: Chapter = {
	slug: 'indexing',
	number: '04',
	title: 'Indexing & Slicing',
	summary: 'Pick single elements, rows, columns, ranges and masks — and see exactly what you selected.',
	topics: ['Scalar indexing', 'Row selection', 'Column selection', 'Slicing', 'Boolean indexing'],
	phase: 'numpy',
	steps: [
		{
			title: 'Scalar indexing',
			body: [
				'`a[i, j]` gives one element: row `i`, column `j`, both counted from 0.',
				'Click any cell to index it. Negative numbers count from the end: `a[-1, -1]` is the last element.'
			],
			patch: { tool: 'index', ...literal(GRID), index: { expr: '1, 2' } },
			tasks: [
				{ text: 'The last element', patch: { index: { expr: '-1, -1' } } },
				{ text: 'An index that does not exist', patch: { index: { expr: '3, 0' } } }
			],
			remember: 'One integer per axis → a single element (a scalar, not an array).'
		},
		{
			title: 'Row selection',
			body: [
				'Give fewer indices than axes and the rest are taken whole. `a[1]` is the same as `a[1, :]`: the entire row 1.',
				'The integer removes axis 0 from the result, so a row of a 2-D array is 1-D.'
			],
			patch: { tool: 'index', ...literal(GRID), index: { expr: '1' } },
			tasks: [
				{ text: 'Write it explicitly: a[1, :]', patch: { index: { expr: '1, :' } } },
				{ text: 'Keep it 2-D with a slice: a[1:2]', patch: { index: { expr: '1:2' } } }
			]
		},
		{
			title: 'Column selection',
			body: [
				'`:` means “everything along this axis”. `a[:, 2]` keeps all rows and picks column 2.',
				'The result is 1-D with shape `(3,)`, not a column of shape `(3, 1)`. Selecting is not the same as keeping the layout.'
			],
			patch: { tool: 'index', ...literal(GRID), index: { expr: ':, 2' } },
			tasks: [
				{ text: 'Keep the column shape: a[:, 2:3]', patch: { index: { expr: ':, 2:3' } } },
				{ text: 'Or add an axis: a[:, 2, None]', patch: { index: { expr: ':, 2, None' } } }
			]
		},
		{
			title: 'Slicing',
			body: [
				'A slice `start:stop:step` keeps a range. `stop` is **not included**; omitted parts mean “from the beginning”, “to the end”, “step 1”.',
				'Basic slices return a **view**: the result shares memory with `a`.'
			],
			patch: { tool: 'index', ...literal(GRID), index: { expr: '0:2, 1:3' } },
			tasks: [
				{ text: 'Every other column: a[:, ::2]', patch: { index: { expr: ':, ::2' } } },
				{ text: 'Reverse the rows: a[::-1]', patch: { index: { expr: '::-1' } } },
				{ text: 'Slicing a 3-D array', patch: { ...expr('np.arange(24).reshape(2, 3, 4)'), index: { expr: ':, 1:, ::2' } } }
			],
			remember: 'Integers remove an axis; slices keep it.'
		},
		{
			title: 'Boolean indexing',
			body: [
				'A condition like `a > 5` produces a **mask**: an array of True/False with the same shape as `a`.',
				'`a[a > 5]` keeps the elements where the mask is True. The result is always **1-D** (in reading order) and a **copy**.'
			],
			patch: { tool: 'index', ...literal(GRID), index: { expr: 'a > 5' } },
			tasks: [
				{ text: 'Even numbers: a[a % 2 == 0]', patch: { index: { expr: 'a % 2 == 0' } } },
				{ text: 'Combine conditions: (a > 2) & (a < 9)', patch: { index: { expr: '(a > 2) & (a < 9)' } } },
				{ text: 'Integer-array (“fancy”) indexing', patch: { index: { expr: '[2, 0], [1, 3]' } } }
			]
		}
	]
};
