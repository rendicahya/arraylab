import { literal, type Chapter } from './types';

export const dtype: Chapter = {
	slug: 'dtype',
	number: '05',
	title: 'dtype',
	summary: 'Every element has the same type. See what conversions do to values and memory.',
	topics: ['Integer', 'Floating point', 'Boolean', 'dtype conversion', 'itemsize · nbytes'],
	phase: 'numpy',
	steps: [
		{
			title: 'Integer dtypes',
			body: [
				'NumPy picked an **integer** dtype for whole numbers. The number in the name is the bit width: `int32` uses 32 bits = 4 bytes per element.',
				'In this browser NumPy runs on 32-bit WebAssembly, so the default integer is `int32`. On a typical 64-bit desktop NumPy 2 would choose `int64` for the same code. ArrayLab shows what NumPy really does here instead of pretending.'
			],
			patch: { tool: 'dtype', ...literal('1 2 3\n4 5 6'), dtype: { target: 'int64' } },
			tasks: [
				{ text: 'Squeeze into int8 (1 byte each)', patch: { dtype: { target: 'int8' } } },
				{ text: 'Ask for int64 when creating the array', patch: literal('1 2 3\n4 5 6', 'int64') }
			],
			remember: 'The dtype is shared by all elements and decides how much memory each one uses.'
		},
		{
			title: 'Floating point',
			body: [
				'Any decimal point makes NumPy choose a **float** dtype — for the whole array.',
				'Converting floats to integers **truncates toward zero**. Converting to a smaller float rounds to the nearest representable value.'
			],
			patch: { tool: 'dtype', ...literal('1.5 2.75 -0.5 3.999'), dtype: { target: 'int32' } },
			tasks: [
				{ text: 'float16: fewer bits, less precision', patch: { ...literal('0.1 1.1 1000.1 3.14159265'), dtype: { target: 'float16' } } },
				{ text: 'Mix ints and floats — what dtype wins?', patch: { ...literal('1 2 3.5'), dtype: { target: 'float64' } } }
			]
		},
		{
			title: 'Boolean',
			body: [
				'`bool` stores True/False in 1 byte each. Converting numbers to bool gives **False for 0 and True for everything else**.',
				'Comparisons such as `a > 2` also produce bool arrays — the masks used in boolean indexing.'
			],
			patch: { tool: 'dtype', ...literal('0 1 2 -3 0 0.5'), dtype: { target: 'bool' } },
			tasks: [
				{ text: 'Type True/False directly', patch: { ...literal('True False True'), dtype: { target: 'int8' } } }
			]
		},
		{
			title: 'Conversion and overflow',
			body: [
				'`astype` converts to another dtype and returns a new array. If a value does not fit, integers **wrap around** silently: 300 as `uint8` becomes 44 (300 − 256), −1 becomes 255.',
				'Changed values are drawn dashed and marked ≠.'
			],
			patch: { tool: 'dtype', ...literal('100 200 300 -1'), dtype: { target: 'uint8' } },
			tasks: [
				{ text: 'int16 has room for these values', patch: { dtype: { target: 'int16' } } },
				{
					text: 'Creating (not converting) an out-of-range value raises an error',
					patch: { tool: 'code', code: 'import numpy as np\n\nnp.array([300], dtype=np.uint8)' }
				}
			]
		},
		{
			title: 'itemsize and nbytes',
			body: [
				'`itemsize` is bytes per element, `nbytes` the total: `nbytes = size × itemsize`.',
				'The byte strips below each array show this directly. Same values, different dtype → different memory.'
			],
			patch: { tool: 'dtype', ...literal('1 2 3 4 5 6'), dtype: { target: 'float64' } },
			tasks: [
				{ text: 'complex128: 16 bytes each', patch: { dtype: { target: 'complex128' } } },
				{ text: 'uint8: 1 byte each', patch: { dtype: { target: 'uint8' } } }
			],
			remember: 'Choosing a dtype is a trade-off between range, precision and memory.'
		}
	]
};
