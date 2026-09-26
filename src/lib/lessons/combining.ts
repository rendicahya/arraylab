import { literal, type Chapter } from './types';

const GRID = '1 2 3\n4 5 6';
const SAME = '7 8 9\n10 11 12';

export const combining: Chapter = {
	slug: 'combining',
	number: '09',
	title: 'Combining arrays',
	summary: 'Join arrays with concatenate and stack, add an axis with np.newaxis, and cut them apart with split.',
	topics: ['concatenate', 'Shapes that fit', 'stack & np.newaxis', 'split'],
	phase: 'numpy',
	steps: [
		{
			title: 'concatenate',
			body: [
				'`np.concatenate([a, b], axis=0)` puts `b` **below** `a`. The arrays are joined along an axis they already have, so ndim stays the same.',
				'Along axis 0 the sizes add up (2 + 2 = 4). Hover a result cell to see where it came from.'
			],
			patch: { tool: 'combine', ...literal(GRID), combine: { op: 'concatenate', b: SAME, axis: 0 } },
			tasks: [
				{ text: 'Side by side: axis=1', patch: { combine: { axis: 1 } } },
				{ text: 'Add just one row', patch: { combine: { b: '[[7, 8, 9]]', axis: 0 } } },
				{ text: 'Add one column', patch: { combine: { b: '7\n8', axis: 1 } } }
			],
			remember: 'concatenate keeps ndim: sizes add up along the axis, every other axis must match.'
		},
		{
			title: 'Shapes that fit',
			body: [
				'Only the joined axis may differ. A row of 3 fits **below** `a` (axis 0), but not **beside** it (axis 1).',
				'A 1-D `b` does not fit a 2-D `a` at all: first give it the missing axis with `np.newaxis`.'
			],
			patch: { tool: 'combine', ...literal(GRID), combine: { op: 'concatenate', b: '[[7, 8, 9]]', axis: 0 } },
			tasks: [
				{ text: 'The same row beside a: axis=1', patch: { combine: { axis: 1 } } },
				{ text: 'A 1-D b: shape (3,)', patch: { combine: { b: '7 8 9', axis: 0 } } },
				{
					text: 'Fix it with np.newaxis',
					patch: {
						tool: 'code',
						code: 'import numpy as np\n\na = np.array([[1, 2, 3],\n              [4, 5, 6]])\nb = np.array([7, 8, 9])\n\nprint(b.shape, b[np.newaxis].shape)\nnp.concatenate([a, b[np.newaxis]], axis=0)'
					}
				}
			],
			remember: 'concatenate never pads or broadcasts: shapes that do not fit are an error.'
		},
		{
			title: 'stack & np.newaxis',
			body: [
				'`np.stack([a, b])` puts `a` and `b` on a **new** axis: two (2, 3) arrays become one (2, 2, 3) array.',
				'It is concatenate after giving each array that axis first (`a[np.newaxis]` has shape (1, 2, 3)). `axis` says where the new axis goes.'
			],
			patch: { tool: 'combine', ...literal(GRID), combine: { op: 'stack', b: SAME, axis: 0 } },
			tasks: [
				{ text: 'New axis at the end: axis=2', patch: { combine: { axis: 2 } } },
				{ text: 'In the middle: axis=1', patch: { combine: { axis: 1 } } },
				{ text: 'Different shapes cannot be stacked', patch: { combine: { b: '[[7, 8, 9]]', axis: 0 } } },
				{
					text: 'stack = newaxis + concatenate',
					patch: {
						tool: 'code',
						code: 'import numpy as np\n\na = np.array([[1, 2, 3], [4, 5, 6]])\nb = np.array([[7, 8, 9], [10, 11, 12]])\n\nstacked = np.stack([a, b])\njoined = np.concatenate([a[np.newaxis], b[np.newaxis]])\nprint(stacked.shape, joined.shape)\n\nnp.array_equal(stacked, joined)'
					}
				}
			],
			remember: 'stack adds an axis (ndim + 1); concatenate keeps ndim.'
		},
		{
			title: 'split',
			body: [
				'`np.split(a, 3, axis=1)` cuts `a` into 3 equal pieces along axis 1 and returns a **list** of arrays.',
				'The pieces are **views** of `a` (chapter 08). Joining them again with `np.concatenate` makes a new array.'
			],
			patch: { tool: 'combine', ...literal('1 2 3 4 5 6\n7 8 9 10 11 12'), combine: { op: 'split', parts: 3, axis: 1 } },
			tasks: [
				{ text: 'Two pieces', patch: { combine: { parts: 2 } } },
				{ text: 'Split the rows: axis=0', patch: { combine: { parts: 2, axis: 0 } } },
				{ text: '4 pieces do not fit into 6 columns', patch: { combine: { parts: 4, axis: 1 } } }
			],
			remember: 'split returns views; the pieces must be equal (np.array_split allows uneven ones).'
		}
	]
};
