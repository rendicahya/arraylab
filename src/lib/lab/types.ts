export type ToolId = 'array' | 'axis' | 'index' | 'reshape' | 'broadcast' | 'vectorize' | 'dtype' | 'code';

export type SourceState = {
	mode: 'literal' | 'expr';
	/** Typed numbers, e.g. "1 2 3\n4 5 6". Executed live because only literals are accepted. */
	text: string;
	/** Optional dtype for typed numbers; '' lets NumPy infer it. */
	dtype: string;
	/** A NumPy expression such as np.arange(12).reshape(3, 4). Applied explicitly. */
	expr: string;
};

export type ReduceFn = 'sum' | 'mean' | 'max' | 'min' | 'prod' | 'argmax';

export type AxisState = { fn: ReduceFn; axis: number | null; keepdims: boolean };
export type IndexState = { expr: string };
export type ShapeOp = 'reshape' | 'transpose' | 'flatten' | 'ravel';
export type ReshapeState = { op: ShapeOp; shape: string; axes: string };
export type BroadcastOp = '+' | '-' | '*' | '/' | '**' | '>';
export type BroadcastState = { b: string; op: BroadcastOp };
export type VectorizeState = { op: VectorOpId };
export type DtypeState = { target: string };

export type VectorOpId = 'double' | 'add10' | 'square' | 'sqrt' | 'abs' | 'gt2';

export type LabSettings = {
	tool: ToolId;
	source: SourceState;
	axis: AxisState;
	index: IndexState;
	reshape: ReshapeState;
	broadcast: BroadcastState;
	vectorize: VectorizeState;
	dtype: DtypeState;
};

/** Partial update applied by lesson steps and "try this" actions. */
export type LabPatch = {
	tool?: ToolId;
	source?: Partial<SourceState>;
	axis?: Partial<AxisState>;
	index?: Partial<IndexState>;
	reshape?: Partial<ReshapeState>;
	broadcast?: Partial<BroadcastState>;
	vectorize?: Partial<VectorizeState>;
	dtype?: Partial<DtypeState>;
	/** Code placed in the editor (the learner still runs it explicitly). */
	code?: string;
};

export const DEFAULT_SETTINGS: LabSettings = {
	tool: 'array',
	source: { mode: 'literal', text: '1 2 3\n4 5 6', dtype: '', expr: 'np.arange(12).reshape(3, 4)' },
	axis: { fn: 'sum', axis: 0, keepdims: false },
	index: { expr: '0, 1' },
	reshape: { op: 'reshape', shape: '3, 2', axes: '' },
	broadcast: { b: '10 20 30', op: '+' },
	vectorize: { op: 'double' },
	dtype: { target: 'float32' }
};

export const TOOLS: { id: ToolId; label: string; description: string }[] = [
	{ id: 'array', label: 'Array', description: 'See the array, its shape and its axes' },
	{ id: 'axis', label: 'Axis', description: 'Reduce along an axis: sum, mean, max, …' },
	{ id: 'index', label: 'Index', description: 'Select elements, rows, columns and slices' },
	{ id: 'reshape', label: 'Reshape', description: 'reshape, transpose, flatten, ravel' },
	{ id: 'broadcast', label: 'Broadcast', description: 'Combine arrays of different shapes' },
	{ id: 'vectorize', label: 'Vectorize', description: 'Loops vs whole-array operations' },
	{ id: 'dtype', label: 'dtype', description: 'Convert between data types' },
	{ id: 'code', label: 'Your code', description: 'Visualize variables from the code editor' }
];
