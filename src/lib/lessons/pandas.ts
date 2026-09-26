import { literal, type Chapter } from './types';

/**
 * pandas builds on the ndarray. pandas runs for real in the browser (Pyodide
 * ships pandas 3), so every table, dtype and error here comes from pandas itself.
 */
export const pandas: Chapter = {
	slug: 'numpy-to-pandas',
	number: '11',
	title: 'NumPy → pandas',
	summary: 'A DataFrame is an array with labels: dtype per column, axis, loc vs iloc, alignment.',
	topics: ['DataFrame = array + labels', 'dtype per column', 'axis in pandas', 'loc vs iloc', 'Alignment vs broadcasting'],
	phase: 'pandas',
	steps: [
		{
			title: 'DataFrame = array + labels',
			body: [
				'A pandas **DataFrame** is a 2-D array with **labels**: `df.index` names the rows, `df.columns` names the columns. The values are an ndarray you already know — `df.to_numpy()` gives it back.',
				'Edit the labels, or the numbers above. pandas runs here for real (it downloads once, ≈ 5 MB).'
			],
			patch: { tool: 'pandas', ...literal('1 2 3\n4 5 6'), pandas: { view: 'frame', index: 'r0 r1', columns: 'A B C' } },
			tasks: [
				{ text: 'Label students and subjects', patch: { pandas: { index: 'Ana Budi', columns: 'math physics art' } } },
				{ text: 'No labels: pandas numbers them 0, 1, 2 …', patch: { pandas: { index: '', columns: '' } } },
				{ text: 'A 1-D array becomes one column', patch: { ...literal('10 20 30'), pandas: { index: 'x y z', columns: 'value' } } },
				{
					text: 'Copy-on-Write: change a column you took out',
					patch: {
						tool: 'code',
						code: "import numpy as np\nimport pandas as pd\n\ndf = pd.DataFrame(np.array([[1, 2], [3, 4]]), columns=['A', 'B'])\n\ncol = df['A']     # pandas 3: acts like a copy (Copy-on-Write)\ncol.iloc[0] = 100\nprint(col.tolist())\n\n# df is unchanged. To change df itself: df.loc[0, 'A'] = 100\ndf"
					}
				}
			],
			remember: 'DataFrame = 2-D values + row labels (index) + column labels (columns).'
		},
		{
			title: 'dtype per column',
			body: [
				'An ndarray has **one** dtype. A DataFrame has **one dtype per column** — text, integers, floats and booleans side by side. Each column is stored as its own 1-D array.',
				'Missing values change dtypes: put `None` into a column and watch its dtype and the arrays below.'
			],
			patch: { tool: 'pandas', pandas: { view: 'dtypes', missing: 'none' } },
			tasks: [
				{ text: 'A missing age: int64 → float64', patch: { pandas: { missing: 'age' } } },
				{ text: 'A missing bool: bool → object', patch: { pandas: { missing: 'passed' } } },
				{ text: 'A missing name: str stays str', patch: { pandas: { missing: 'name' } } }
			],
			remember: 'Integers cannot hold NaN, so one missing value turns an int column into float64.'
		},
		{
			title: 'axis in pandas',
			body: [
				'`df.sum(axis=0)` collapses axis 0 — the same rule as `np.sum(a, axis=0)`. For a DataFrame that means one value **per column**; `axis=1` gives one value **per row**.',
				'Two differences from NumPy: the result is a **Series that keeps the labels**, and missing values (`NaN`) are **skipped**.'
			],
			patch: { tool: 'pandas', ...literal('1 2 3\n4 5 6'), pandas: { view: 'axis', fn: 'sum', axis: 0, index: 'r0 r1', columns: 'A B C' } },
			tasks: [
				{ text: 'axis=1: one value per row', patch: { pandas: { axis: 1 } } },
				{ text: 'mean', patch: { pandas: { fn: 'mean' } } },
				{ text: 'Add a NaN — pandas skips it, NumPy does not', patch: { ...literal('1 nan 3\n4 5 6'), pandas: { fn: 'sum', axis: 0 } } }
			],
			remember: 'Same axis rule as NumPy; the result keeps labels and NaN is skipped (skipna=True).'
		},
		{
			title: 'loc vs iloc',
			body: [
				'`df.loc[…]` selects by **label**; `df.iloc[…]` selects by **position**, exactly like NumPy indexing. Rows first, then columns. Click a value to select it.',
				'Watch the slices: a **label** slice includes its end, a **position** slice excludes it. And plain `df[\'B\']` picks a **column** — in NumPy, `a[1]` picks a row.'
			],
			patch: {
				tool: 'pandas',
				...literal('1 2 3\n4 5 6\n7 8 9'),
				pandas: { view: 'select', index: 'r0 r1 r2', columns: 'A B C', accessor: 'loc', select: "'r1', 'B'" }
			},
			tasks: [
				{ text: 'The same value by position', patch: { pandas: { index: 'r0 r1 r2', accessor: 'iloc', select: '1, 1' } } },
				{ text: "Label slice 'r0':'r1' includes r1", patch: { pandas: { index: 'r0 r1 r2', accessor: 'loc', select: "'r0':'r1', 'A':'B'" } } },
				{ text: 'Position slice 0:1 stops before 1', patch: { pandas: { index: 'r0 r1 r2', accessor: 'iloc', select: '0:1, 0:2' } } },
				{ text: "df['B'] is a column", patch: { pandas: { index: 'r0 r1 r2', accessor: '', select: "'B'" } } },
				{ text: 'Rows labeled 10, 20, 30: loc[10] vs iloc[0]', patch: { pandas: { index: '10 20 30', accessor: 'loc', select: '10' } } },
				{ text: 'A label that does not exist', patch: { pandas: { index: 'r0 r1 r2', accessor: 'loc', select: "'r9'" } } }
			],
			remember: '.loc: labels, end included. .iloc: positions, end excluded — like NumPy.'
		},
		{
			title: 'Alignment vs broadcasting',
			body: [
				'NumPy combines arrays **by position** (and broadcasts shapes). pandas first **aligns by label**: `s1 + s2` adds the values whose labels match, wherever they are.',
				'A label that exists on only one side gets `NaN` — pandas will not silently pair it with something else.'
			],
			patch: { tool: 'pandas', pandas: { view: 'align', left: 'a:1 b:2 c:3', right: 'b:10 c:20 d:30', op: '+', fill: false } },
			tasks: [
				{ text: 'Same labels, shuffled order', patch: { pandas: { left: 'a:1 b:2 c:3', right: 'c:30 a:10 b:20', fill: false } } },
				{ text: 'Say what “missing” means: fill_value=0', patch: { pandas: { left: 'a:1 b:2 c:3', right: 'b:10 c:20 d:30', fill: true } } },
				{ text: 'Different lengths: NumPy gives up, pandas aligns', patch: { pandas: { left: 'a:1 b:2', right: 'a:10 b:20 c:30', fill: false } } }
			],
			remember: 'NumPy pairs by position, pandas by label. Unmatched labels give NaN.'
		}
	]
};
