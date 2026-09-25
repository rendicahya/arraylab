import { expr, literal, type Chapter } from './types';

export const axis: Chapter = {
	slug: 'axis',
	number: '03',
	title: 'Axis',
	summary: 'What axis=0 and axis=1 really mean — and how reductions collapse an axis.',
	topics: ['Axis 0', 'Axis 1', 'Higher-dimensional axes', 'Reduction', 'sum · mean · max · min'],
	phase: 'numpy',
	steps: [
		{
			title: 'Axis 0',
			body: [
				'`np.sum(a, axis=0)` adds up values **along axis 0**: it walks down the first index while the other indices stay fixed.',
				'For a 2-D array that means each column is summed. The arrows show the direction of collapse; cells with the same label end up in the same result element. Hover a result to see its sum.'
			],
			patch: { tool: 'axis', ...literal('1 2 3\n4 5 6'), axis: { fn: 'sum', axis: 0, keepdims: false } },
			tasks: [{ text: 'Add a row and watch the sums grow', patch: literal('1 2 3\n4 5 6\n7 8 9') }],
			remember: 'axis=0 collapses the first axis; it disappears from the shape: (2, 3) → (3,).'
		},
		{
			title: 'Axis 1',
			body: [
				'`axis=1` walks along the **second index**. In 2-D that means across each row, so you get one value per row.',
				'The shape loses axis 1: `(2, 3)` → `(2,)`.'
			],
			patch: { tool: 'axis', ...literal('1 2 3\n4 5 6'), axis: { fn: 'sum', axis: 1, keepdims: false } },
			tasks: [
				{ text: 'axis=None: everything at once', patch: { axis: { axis: null } } },
				{ text: 'Negative axes count from the end: axis=-1 is the last axis', patch: { tool: 'code', code: 'import numpy as np\n\na = np.array([[1, 2, 3], [4, 5, 6]])\nnp.sum(a, axis=-1)   # same as axis=1 here' } }
			],
			remember: 'The axis you pass is the one that disappears.'
		},
		{
			title: 'sum, mean, max, min',
			body: [
				'Every **reduction** follows the same axis rule — only the way values are combined changes.',
				'`mean` returns floats. `argmax` returns *where* the maximum is, not the maximum itself.'
			],
			patch: { tool: 'axis', ...literal('3 7 2\n9 1 5'), axis: { fn: 'mean', axis: 0, keepdims: false } },
			tasks: [
				{ text: 'max along axis 1', patch: { axis: { fn: 'max', axis: 1 } } },
				{ text: 'min along axis 0', patch: { axis: { fn: 'min', axis: 0 } } },
				{ text: 'argmax along axis 1', patch: { axis: { fn: 'argmax', axis: 1 } } }
			]
		},
		{
			title: 'keepdims',
			body: [
				'With `keepdims=True` the reduced axis stays in the shape with length 1: `(2, 3)` → `(1, 3)`.',
				'This keeps the result aligned with `a`, so operations like `a - a.mean(axis=0, keepdims=True)` broadcast correctly.'
			],
			patch: { tool: 'axis', ...literal('1 2 3\n4 5 6'), axis: { fn: 'mean', axis: 0, keepdims: true } },
			tasks: [
				{ text: 'Try axis=1 with keepdims', patch: { axis: { axis: 1 } } },
				{
					text: 'Center each column in code',
					patch: { tool: 'code', code: 'import numpy as np\n\na = np.array([[1., 2., 3.], [4., 5., 6.]])\ncentered = a - a.mean(axis=0, keepdims=True)\ncentered' }
				}
			]
		},
		{
			title: 'Higher-dimensional axes',
			body: [
				'In 3-D, axis 0 goes **across blocks**, axis 1 down the rows of each block, axis 2 along each row.',
				'Try each axis. Each time, only the chosen index varies inside a group — and that axis vanishes from the result shape. This is why “axis 0 = rows” is a misleading rule.'
			],
			patch: { tool: 'axis', ...expr('np.arange(24).reshape(2, 3, 4)'), axis: { fn: 'sum', axis: 0, keepdims: false } },
			tasks: [
				{ text: 'axis=1', patch: { axis: { axis: 1 } } },
				{ text: 'axis=2', patch: { axis: { axis: 2 } } },
				{ text: 'axis=None', patch: { axis: { axis: null } } }
			],
			remember: 'Reducing axis k removes entry k from the shape: (2, 3, 4) with axis=1 → (2, 4).'
		}
	]
};
