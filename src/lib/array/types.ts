/**
 * Normalized, backend-agnostic description of an array or tensor.
 * The visualization layer only depends on these types, never on Python objects.
 */
export type Backend = 'numpy' | 'torch';

export type ArrayInfo = {
	kind: 'array' | 'scalar';
	name?: string;
	backend: Backend;
	shape: number[];
	ndim: number;
	size: number;
	dtype: string;
	/** NumPy dtype kind code: b (bool), i (int), u (uint), f (float), c (complex), ... */
	dtypeKind: string;
	itemsize: number;
	nbytes: number;
	strides: number[];
	cContiguous: boolean;
	ownsData: boolean;
	writeable: boolean;
	/** Flattened (C order) formatted values of the preview region. */
	values?: string[];
	/** Shape of the preview region: equal to `shape` unless truncated. */
	previewShape?: number[];
	truncated?: boolean;
	/** Python type of a scalar result, e.g. `numpy.int64` or `int`. */
	pythonType?: string;
	/** repr() of the value when it was the last expression of a snippet. */
	repr?: string;
};

export type TensorInfo = ArrayInfo & {
	backend: 'torch';
	device?: string;
	requiresGrad?: boolean;
	gradFn?: string | null;
};

export type OtherValue = {
	kind: 'other';
	name?: string;
	pythonType: string;
	repr: string;
};

/**
 * A pandas DataFrame or Series: a 2-D block of values plus row labels (index)
 * and column labels. A Series is described as one column.
 */
export type FrameInfo = {
	kind: 'frame' | 'series';
	name?: string;
	backend: 'pandas';
	/** (rows, columns) for a DataFrame, (rows,) for a Series. */
	shape: number[];
	ndim: number;
	size: number;
	/** Row labels of the preview, formatted. */
	index: string[];
	/** dtype kind of the row labels: i for integers, O for strings/objects. */
	indexKind: string;
	/** e.g. RangeIndex (default positions) or Index. */
	indexType: string;
	/** Column labels of the preview; a Series has one entry (its name, or ''). */
	columns: string[];
	columnsKind: string;
	columnsType: string;
	/** dtype of each preview column. */
	dtypes: string[];
	/** Row-major formatted values of the preview (rows × columns). */
	values: string[];
	previewShape: [number, number];
	truncated: boolean;
	/** Bytes of the values (df.memory_usage(index=False).sum()). */
	nbytes: number;
	pythonType: string;
	repr?: string;
};

export type ValueInfo = ArrayInfo | FrameInfo | OtherValue;

export function isFrameInfo(v: ValueInfo | null | undefined): v is FrameInfo {
	return !!v && (v.kind === 'frame' || v.kind === 'series');
}

export function isArrayInfo(v: ValueInfo | null | undefined): v is ArrayInfo {
	return !!v && (v.kind === 'array' || v.kind === 'scalar');
}
