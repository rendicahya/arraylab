import { literal, type Chapter } from './types';

const GRID = '1 2 3\n4 5 6';

export const views: Chapter = {
	slug: 'views',
	number: '08',
	title: 'View vs copy',
	summary: 'Which operations share memory with the original array — and what happens when you write into them.',
	topics: ['b = a', 'Slices are views', 'Fancy & boolean indexing copy', 'reshape, T, ravel', 'When to copy'],
	phase: 'numpy',
	steps: [
		{
			title: 'b = a is not a copy',
			body: [
				'`b = a` copies nothing. It gives the **same** array a second name: `b is a` is True.',
				'Tick **write into b**: `b[...] = 99` writes into every element of `b`. Then look at `a`.'
			],
			patch: { tool: 'views', ...literal(GRID), views: { suffix: '', write: false } },
			tasks: [
				{ text: 'Write into b', patch: { views: { write: true } } },
				{ text: 'Make a real copy: b = a.copy()', patch: { views: { suffix: '.copy()', write: true } } }
			],
			remember: 'Assignment never copies: b = a is one array with two names.'
		},
		{
			title: 'Slices are views',
			body: [
				'A basic slice like `a[:, 1]` makes a **view**: a new array object that looks into `a`’s memory. No numbers are copied.',
				'The memory row shows how: `b` takes every 3rd element of `a`’s memory. That step is `b.strides`.'
			],
			patch: { tool: 'views', ...literal(GRID), views: { suffix: '[:, 1]', write: false } },
			tasks: [
				{ text: 'Write into b', patch: { views: { write: true } } },
				{ text: 'A row: a[0]', patch: { views: { suffix: '[0]' } } },
				{ text: 'Every other column: a[:, ::2]', patch: { views: { suffix: '[:, ::2]' } } },
				{ text: 'Reversed: a[::-1] (a negative step)', patch: { views: { suffix: '[::-1]' } } }
			],
			remember: 'Basic slicing (integers and start:stop:step) gives a view: writing into it changes a.'
		},
		{
			title: 'Fancy & boolean indexing copy',
			body: [
				'Indexing with a **list** of positions or a **boolean mask** always gives a **copy**. The chosen elements have no regular step in memory, so NumPy gathers them into new memory.',
				'Here `b[...] = 99` changes only `b`.'
			],
			patch: { tool: 'views', ...literal(GRID), views: { suffix: '[[0, 1]]', write: true } },
			tasks: [
				{ text: 'A boolean mask: a[a > 2]', patch: { views: { suffix: '[a > 2]' } } },
				{ text: 'The same rows as a slice: a[0:2]', patch: { views: { suffix: '[0:2]' } } },
				{
					text: 'But a[mask] = … does write into a',
					patch: {
						tool: 'code',
						code: 'import numpy as np\n\na = np.array([[1, 2, 3],\n              [4, 5, 6]])\n\nb = a[a > 2]    # selecting: a copy\nb[...] = 0      # changes only b\nprint(a)\n\n# assigning through the index writes into a itself\na[a > 2] = 0\na'
					}
				}
			],
			remember: 'Selecting with a list or a mask copies. Assigning with a[mask] = … writes into a.'
		},
		{
			title: 'reshape, T, ravel',
			body: [
				'`a.T`, `a.reshape(…)` and `a.ravel()` return **views** whenever they can: they only change the shape and the strides.',
				'`a.flatten()` always copies. And `a.T.ravel()` has to copy: reading the transpose row by row is not the order of the memory.'
			],
			patch: { tool: 'views', ...literal(GRID), views: { suffix: '.T', write: true } },
			tasks: [
				{ text: 'a.reshape(3, 2)', patch: { views: { suffix: '.reshape(3, 2)' } } },
				{ text: 'a.ravel(): a view', patch: { views: { suffix: '.ravel()' } } },
				{ text: 'a.flatten(): always a copy', patch: { views: { suffix: '.flatten()' } } },
				{ text: 'a.T.ravel(): must copy', patch: { views: { suffix: '.T.ravel()' } } }
			],
			remember: 'Shape changes are views when possible. np.shares_memory(a, b) tells you for sure.'
		},
		{
			title: 'When to copy',
			body: [
				'Views are fast and save memory, but a change through one name shows up under the other. Call `.copy()` when you need an independent array.',
				'PyTorch works the same way: slicing a tensor gives a view, and `torch.from_numpy` shares memory with the array (chapter 10).'
			],
			patch: { tool: 'views', ...literal(GRID), views: { suffix: '[:, 1].copy()', write: true } },
			tasks: [
				{ text: 'Without .copy()', patch: { views: { suffix: '[:, 1]' } } },
				{
					text: 'A function that changes its input',
					patch: {
						tool: 'code',
						code: "import numpy as np\n\ndef center(x):\n    x -= x.mean()     # in place: writes into the caller's array\n    return x\n\na = np.array([1.0, 2.0, 3.0])\ncenter(a[:2])         # a slice is a view…\n\n# …so a changed. center(a[:2].copy()) would leave it alone.\na"
					}
				}
			],
			remember: 'Need an independent array? Use .copy().'
		}
	]
};
