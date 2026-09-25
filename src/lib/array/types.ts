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

export type ValueInfo = ArrayInfo | OtherValue;

export function isArrayInfo(v: ValueInfo | null | undefined): v is ArrayInfo {
	return !!v && (v.kind === 'array' || v.kind === 'scalar');
}
