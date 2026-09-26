export type ToolId =
	| 'array'
	| 'axis'
	| 'index'
	| 'reshape'
	| 'broadcast'
	| 'vectorize'
	| 'dtype'
	| 'torch'
	| 'autograd'
	| 'pandas'
	| 'code';

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

/** What the PyTorch tool shows for array `a`. */
export type TorchView = 'tensor' | 'convert' | 'ops' | 'create' | 'device';
/** Tensor property rows the current lesson step points at. */
export type TorchFocus = 'shape' | 'dtype' | 'numel' | 'device' | null;
export type TorchState = { view: TorchView; op: string; focus: TorchFocus };

/** Leaves of the autograd example graph: pred = w * x + b, loss = (pred - y) ** 2. */
export type AutogradLeaf = 'x' | 'w' | 'b' | 'y';
export type AutogradState = {
	values: Record<AutogradLeaf, number>;
	requiresGrad: Record<AutogradLeaf, boolean>;
	phase: 'forward' | 'backward';
	/** Learning rate for the "take a gradient step" action. */
	lr: number;
};

/** What the pandas tool shows. */
export type PandasView = 'frame' | 'dtypes' | 'axis' | 'select' | 'align';
/** Column of the example table that gets a missing value (dtypes view). */
export type PandasMissing = 'none' | 'name' | 'age' | 'score' | 'passed';
export type PandasReduce = 'sum' | 'mean' | 'max' | 'min';
/** `df[…]`, `df.loc[…]` or `df.iloc[…]`. */
export type PandasAccessor = '' | 'loc' | 'iloc';
export type PandasOp = '+' | '-' | '*';
export type PandasState = {
	view: PandasView;
	/** Row labels typed as "r0 r1" or "10 20"; empty = default positions (RangeIndex). */
	index: string;
	/** Column labels, e.g. "A B C"; empty = default positions. */
	columns: string;
	missing: PandasMissing;
	fn: PandasReduce;
	axis: 0 | 1;
	accessor: PandasAccessor;
	/** What goes inside the brackets, e.g. `'r0', 'B'`. */
	select: string;
	/** Two Series typed as "a:1 b:2 c:3". */
	left: string;
	right: string;
	op: PandasOp;
	/** Use s1.add(s2, fill_value=0) instead of s1 + s2. */
	fill: boolean;
};

export type LabSettings = {
	tool: ToolId;
	source: SourceState;
	axis: AxisState;
	index: IndexState;
	reshape: ReshapeState;
	broadcast: BroadcastState;
	vectorize: VectorizeState;
	dtype: DtypeState;
	torch: TorchState;
	autograd: AutogradState;
	pandas: PandasState;
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
	torch?: Partial<TorchState>;
	autograd?: {
		values?: Partial<Record<AutogradLeaf, number>>;
		requiresGrad?: Partial<Record<AutogradLeaf, boolean>>;
		phase?: AutogradState['phase'];
		lr?: number;
	};
	pandas?: Partial<PandasState>;
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
	dtype: { target: 'float32' },
	torch: { view: 'tensor', op: 'sum0', focus: null },
	autograd: {
		values: { x: 2, w: 3, b: 1, y: 10 },
		requiresGrad: { x: false, w: true, b: true, y: false },
		phase: 'forward',
		lr: 0.05
	},
	pandas: {
		view: 'frame',
		index: 'r0 r1',
		columns: 'A B C',
		missing: 'none',
		fn: 'sum',
		axis: 0,
		accessor: 'loc',
		select: "'r0', 'B'",
		left: 'a:1 b:2 c:3',
		right: 'b:10 c:20 d:30',
		op: '+',
		fill: false
	}
};

export const TOOLS: { id: ToolId; label: string; description: string }[] = [
	{ id: 'array', label: 'Array', description: 'See the array, its shape and its axes' },
	{ id: 'axis', label: 'Axis', description: 'Reduce along an axis: sum, mean, max, …' },
	{ id: 'index', label: 'Index', description: 'Select elements, rows, columns and slices' },
	{ id: 'reshape', label: 'Reshape', description: 'reshape, transpose, flatten, ravel' },
	{ id: 'broadcast', label: 'Broadcast', description: 'Combine arrays of different shapes' },
	{ id: 'vectorize', label: 'Vectorize', description: 'Loops vs whole-array operations' },
	{ id: 'dtype', label: 'dtype', description: 'Convert between data types' },
	{ id: 'torch', label: '→ PyTorch', description: 'The same array as a PyTorch tensor (PyTorch code is shown, not run)' },
	{ id: 'autograd', label: 'Autograd', description: 'A computational graph: forward values and backward gradients' },
	{ id: 'pandas', label: 'pandas', description: 'The array as a labeled pandas DataFrame' },
	{ id: 'code', label: 'Your code', description: 'Visualize variables from the code editor' }
];
