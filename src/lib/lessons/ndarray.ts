import { expr, literal, type Chapter } from './types';

export const ndarray: Chapter = {
	slug: 'ndarray',
	number: '01',
	title: 'Meet the ndarray',
	summary: 'Type numbers, get a NumPy array, and read its shape, ndim and size.',
	topics: ['Creating arrays', '1-D arrays', '2-D arrays', 'Higher dimensions', 'shape · ndim · size'],
	phase: 'numpy',
	steps: [
		{
			title: 'Type some numbers',
			body: [
				'An **ndarray** (n-dimensional array) is NumPy’s container for numbers: a rectangular grid where every element has the same type.',
				'Type numbers in the `a =` box. ArrayLab writes the matching `np.array([...])` call (see “Code that ran” below) and real NumPy builds the array.'
			],
			patch: { tool: 'array', ...literal('1 2 3\n4 5 6') },
			tasks: [
				{ text: 'Add a third row: 7 8 9', patch: literal('1 2 3\n4 5 6\n7 8 9') },
				{ text: 'Make one row shorter — what does NumPy say?', patch: literal('1 2 3\n4 5') },
				{ text: 'Use a decimal number somewhere', patch: literal('1 2 3\n4 5.5 6') }
			],
			remember: 'An ndarray is rectangular and holds one type of element.'
		},
		{
			title: '1-D arrays',
			body: [
				'Numbers on a single line make a **1-D array**: a row of values with one axis.',
				'Each element is found with **one index**, starting at 0. Hover a cell to see it.'
			],
			patch: { tool: 'array', ...literal('3 1 4 1 5 9') },
			tasks: [
				{ text: 'A single number becomes a 0-d array (shape ())', patch: literal('42') },
				{ text: 'A longer 1-D array', patch: expr('np.arange(10)') }
			],
			remember: '1-D: shape has one entry, e.g. (6,). The trailing comma means “a tuple with one element”.'
		},
		{
			title: '2-D arrays',
			body: [
				'Several lines make a **2-D array**. Now every element needs **two indices**: `a[i, j]`.',
				'For a 2-D array, axis 0 steps between rows (down) and axis 1 steps between columns (across). The numbers around the grid are those indices.'
			],
			patch: { tool: 'array', ...literal('1 2 3\n4 5 6') },
			tasks: [
				{ text: 'Try a tall array: 4 rows × 2 columns', patch: literal('1 2\n3 4\n5 6\n7 8') },
				{ text: 'A single column (shape (3, 1))', patch: literal('1\n2\n3') }
			],
			remember: 'The shape (rows, columns) of a 2-D array lists the length of axis 0, then axis 1.'
		},
		{
			title: 'Higher dimensions',
			body: [
				'Separate two grids with a **blank line** and the array becomes **3-D**: a stack of 2-D blocks.',
				'Now there are three indices. Axis 0 picks the block, axis 1 the row inside it, axis 2 the column. Words like “rows” only make sense for the last two axes — count axes from the outside in.'
			],
			patch: { tool: 'array', ...literal('1 2 3\n4 5 6\n\n7 8 9\n10 11 12') },
			tasks: [
				{ text: 'Create a (2, 3, 4) array with np.arange', patch: expr('np.arange(24).reshape(2, 3, 4)') },
				{ text: 'A 4-D array (2, 2, 2, 3)', patch: expr('np.arange(24).reshape(2, 2, 2, 3)') }
			],
			remember: 'ndim can be any number. Each extra axis adds one more index.'
		},
		{
			title: 'shape, ndim and size',
			body: [
				'Three properties describe the structure — see them in the Inspector on the right:',
				'`shape` is a tuple with the **length of each axis**. `ndim` is **how many axes** there are (the length of the shape). `size` is the **total number of elements** (the product of the shape).',
				'Shape and size are different things: (2, 3, 4) and (4, 6) both have size 24.'
			],
			patch: { tool: 'array', ...expr('np.arange(24).reshape(2, 3, 4)') },
			tasks: [
				{ text: 'Same size, different shape: (4, 6)', patch: expr('np.arange(24).reshape(4, 6)') },
				{
					text: 'Ask Python directly in the editor',
					patch: {
						tool: 'code',
						code: 'import numpy as np\n\na = np.arange(24).reshape(2, 3, 4)\n\nprint("shape:", a.shape)\nprint("ndim: ", a.ndim)\nprint("size: ", a.size)\na.shape'
					}
				}
			],
			remember: 'shape = dimensions · ndim = len(shape) · size = product of shape.'
		}
	]
};
