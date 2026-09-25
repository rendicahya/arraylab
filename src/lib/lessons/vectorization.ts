import { literal, type Chapter } from './types';

export const vectorization: Chapter = {
	slug: 'vectorization',
	number: '07',
	title: 'Vectorization',
	summary: 'Replace Python loops with whole-array operations — same result, far less work.',
	topics: ['Python loops', 'Element-wise operations', 'NumPy ufuncs', 'Vectorized thinking'],
	phase: 'numpy',
	steps: [
		{
			title: 'Python loops',
			body: [
				'The loop version touches one element at a time: take `x`, compute, append. Press “Animate” to watch it.',
				'The vectorized version, `a * 2`, describes the whole operation in one expression. Both give the same array.'
			],
			patch: { tool: 'vectorize', ...literal('1 2 3 4 5'), vectorize: { op: 'double' } },
			tasks: [{ text: 'Add 10 instead', patch: { vectorize: { op: 'add10' } } }]
		},
		{
			title: 'Element-wise operations',
			body: [
				'Arithmetic between an array and a number (or two arrays of the same shape) is applied **element by element**, whatever the shape.',
				'Here the array is 2-D, and `a ** 2` still just squares each element.'
			],
			patch: { tool: 'vectorize', ...literal('1 -2 3\n-4 5 -6'), vectorize: { op: 'square' } },
			tasks: [
				{ text: 'Absolute value', patch: { vectorize: { op: 'abs' } } },
				{ text: 'Comparison: a > 2 gives booleans', patch: { vectorize: { op: 'gt2' } } }
			]
		},
		{
			title: 'NumPy ufuncs',
			body: [
				'Operators like `+`, `*` and `>` call **universal functions** (ufuncs) such as `np.add`, `np.multiply`, `np.greater`. Functions like `np.sqrt` and `np.exp` are ufuncs too.',
				'A ufunc loops over the elements in compiled code, so a single call handles the whole array.'
			],
			patch: { tool: 'vectorize', ...literal('1 4 9 16 25'), vectorize: { op: 'sqrt' } },
			tasks: [
				{
					text: 'Operators are ufuncs in disguise',
					patch: { tool: 'code', code: 'import numpy as np\n\na = np.array([1, 2, 3])\nprint(np.add(a, 10))\nprint(a + 10)\nnp.array_equal(np.multiply(a, 2), a * 2)' }
				}
			]
		},
		{
			title: 'Vectorized thinking',
			body: [
				'Press **Measure speed**: the same operation on 100,000 elements, loop vs vectorized, timed live in your browser.',
				'Vectorized thinking means describing *what* happens to the whole array (`(a - a.mean()) / a.std()`) instead of *how* to visit each element.'
			],
			patch: { tool: 'vectorize', ...literal('1 2 3 4 5 6'), vectorize: { op: 'double' } },
			tasks: [
				{
					text: 'Standardize an array without a loop',
					patch: { tool: 'code', code: 'import numpy as np\n\na = np.array([2., 4., 4., 4., 5., 5., 7., 9.])\nz = (a - a.mean()) / a.std()\nz' }
				}
			],
			remember: 'If you are writing a for-loop over array elements, there is usually a NumPy expression for it.'
		}
	]
};
