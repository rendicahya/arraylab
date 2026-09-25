import { expr, literal, type Chapter } from './types';

export const shape: Chapter = {
	slug: 'shape',
	number: '02',
	title: 'Shape',
	summary: 'Rearrange the same elements: reshape, flatten, ravel and transpose.',
	topics: ['Understanding shape', 'reshape', 'flatten', 'ravel', 'transpose'],
	phase: 'numpy',
	steps: [
		{
			title: 'Understanding shape',
			body: [
				'The shape lists axis lengths from the **outermost** to the **innermost**. For `(3, 4)`: 3 rows, each holding 4 values.',
				'NumPy stores the elements in one line of memory, in **reading order** (row by row). The shape tells NumPy how to fold that line into a grid.'
			],
			patch: { tool: 'reshape', ...literal('0 1 2 3\n4 5 6 7\n8 9 10 11'), reshape: { op: 'ravel', shape: '4, 3', axes: '' } },
			tasks: [{ text: 'Unfold it into reading order with ravel', patch: { reshape: { op: 'ravel' } } }],
			remember: 'Shape = how a line of elements is folded. The small labels count reading order.'
		},
		{
			title: 'reshape',
			body: [
				'`reshape` folds the **same elements in the same order** into a new shape. Follow the small labels: they stay 0, 1, 2, … in reading order.',
				'The new shape must hold exactly the same number of elements. Use `-1` for one dimension to let NumPy work it out.'
			],
			patch: { tool: 'reshape', ...literal('0 1 2 3 4 5 6 7 8 9 10 11'), reshape: { op: 'reshape', shape: '3, 4', axes: '' } },
			tasks: [
				{ text: 'reshape(2, 6)', patch: { reshape: { op: 'reshape', shape: '2, 6' } } },
				{ text: 'reshape(3, -1) — let NumPy infer', patch: { reshape: { op: 'reshape', shape: '3, -1' } } },
				{ text: 'Go 3-D: reshape(2, 2, 3)', patch: { reshape: { op: 'reshape', shape: '2, 2, 3' } } },
				{ text: 'An impossible shape: (5, 3)', patch: { reshape: { op: 'reshape', shape: '5, 3' } } }
			],
			remember: 'reshape changes the shape, never the element order or the count.'
		},
		{
			title: 'flatten and ravel',
			body: [
				'Both turn any array into **1-D**, in reading order.',
				'`flatten()` always makes a **copy**. `ravel()` returns a **view** when it can — the result shares memory with `a`, so no data is copied. Watch the “view / copy” tag.'
			],
			patch: { tool: 'reshape', ...literal('1 2 3\n4 5 6'), reshape: { op: 'flatten', shape: '6', axes: '' } },
			tasks: [
				{ text: 'Switch to ravel', patch: { reshape: { op: 'ravel' } } },
				{
					text: 'Prove the difference in code',
					patch: {
						tool: 'code',
						code: 'import numpy as np\n\na = np.array([[1, 2, 3], [4, 5, 6]])\nf = a.flatten()   # copy\nr = a.ravel()     # view\n\nr[0] = 100\nprint(a)          # a changed through the view\nf'
					}
				}
			],
			remember: 'A view shares memory with the original; a copy does not.'
		},
		{
			title: 'transpose',
			body: [
				'`a.T` swaps the axes: element `a[i, j]` moves to `result[j, i]`, and shape `(2, 3)` becomes `(3, 2)`.',
				'Unlike reshape, the **reading order changes**. Press “Play reading order” and watch where each element comes from. NumPy doesn’t move any data — it returns a view with swapped strides, which is why the result is not C-contiguous.'
			],
			patch: { tool: 'reshape', ...literal('1 2 3\n4 5 6'), reshape: { op: 'transpose', shape: '3, 2', axes: '' } },
			tasks: [
				{ text: 'Compare with reshape(3, 2) — same shape, different arrangement', patch: { reshape: { op: 'reshape', shape: '3, 2' } } },
				{ text: 'Transpose a 3-D array', patch: { ...expr('np.arange(24).reshape(2, 3, 4)'), reshape: { op: 'transpose', axes: '' } } },
				{ text: 'Choose the axis order: transpose(1, 0, 2)', patch: { ...expr('np.arange(24).reshape(2, 3, 4)'), reshape: { op: 'transpose', axes: '1, 0, 2' } } }
			],
			remember: 'reshape keeps reading order; transpose reorders axes.'
		}
	]
};
