import { expr, literal, type Chapter } from './types';

/**
 * PyTorch chapters. PyTorch does not run in the browser (Pyodide has no PyTorch),
 * so these chapters run the NumPy side for real, show the PyTorch code next to it,
 * and state PyTorch's results from a recording made with real PyTorch
 * (src/lib/torch/reference.json). The Colab notebook runs the PyTorch side.
 */
const DEFAULT_AUTOGRAD = {
	values: { x: 2, w: 3, b: 1, y: 10 },
	requiresGrad: { x: false, w: true, b: true, y: false },
	lr: 0.05
};

export const torchChapters: Chapter[] = [
	{
		slug: 'numpy-to-pytorch',
		number: '10',
		title: 'NumPy → PyTorch',
		summary: 'ndarray vs Tensor: converting, similarities and differences.',
		topics: ['ndarray vs Tensor', 'Converting between them', 'Similarities', 'Differences'],
		phase: 'torch',
		steps: [
			{
				title: 'ndarray vs Tensor',
				body: [
					'A PyTorch **Tensor** is an n-dimensional array, just like a NumPy **ndarray**: the same grid, the same shape, the same axes. Everything from chapters 01–07 carries over.',
					'The table puts each NumPy property next to its PyTorch spelling. The NumPy column is computed live. PyTorch cannot run in the browser, so its column shows what real PyTorch returns for the same data (recorded).'
				],
				patch: { tool: 'torch', ...literal('1 2 3\n4 5 6'), torch: { view: 'tensor', focus: null } },
				tasks: [
					{ text: 'Type floats — compare the dtypes', patch: literal('0.5 1.5 2.5\n3.5 4.5 5.5') },
					{ text: 'A 3-D array', patch: literal('1 2 3\n4 5 6\n\n7 8 9\n10 11 12') }
				],
				remember: 'A tensor is an n-dimensional array with two extra powers: a device and gradient tracking.'
			},
			{
				title: 'Converting between them',
				body: [
					'`torch.from_numpy(a)` wraps the **same memory** as `a` — nothing is copied. `torch.tensor(a)` makes a **copy**. `t.numpy()` goes back to NumPy, again without copying.',
					'Sharing memory is fast, but a change on one side shows up on the other — exactly like NumPy views in chapter 08.'
				],
				patch: { tool: 'torch', ...literal('1 2 3\n4 5 6'), torch: { view: 'convert', focus: null } },
				tasks: [
					{ text: 'Start from a NumPy function', patch: expr('np.arange(6).reshape(2, 3)') },
					{ text: 'Floats', patch: literal('0.5 1.5 2.5\n3.5 4.5 5.5') }
				],
				remember: '`from_numpy` and `.numpy()` share memory; `torch.tensor` copies.'
			},
			{
				title: 'Similarities',
				body: [
					'Most NumPy operations have a PyTorch twin with the same meaning: indexing, reshaping, arithmetic, reductions. Pick an operation: NumPy computes it live, and the PyTorch spelling is shown next to it.',
					'A reduction still collapses one axis. PyTorch calls the axis a **dim**: `a.sum(axis=0)` is `t.sum(dim=0)`.'
				],
				patch: { tool: 'torch', ...literal('1 2 3\n4 5 6'), torch: { view: 'ops', op: 'sum0' } },
				tasks: [
					{ text: 'Indexing: the first row', patch: { torch: { op: 'row0' } } },
					{ text: 'reshape(-1)', patch: { torch: { op: 'flat' } } },
					{ text: 'Arithmetic: × 2', patch: { torch: { op: 'double' } } }
				]
			},
			{
				title: 'Differences',
				body: [
					'Some results differ. PyTorch refuses `t.mean()` on an integer tensor, summing integers gives int64, and dividing integers gives float32 rather than float64.',
					'Some names differ: `astype` → `.to()`, `copy` → `clone`, `np.concatenate` → `torch.cat`, `np.expand_dims` → `unsqueeze`. And in PyTorch `t.size()` is the **shape**; `t.numel()` counts elements.'
				],
				patch: { tool: 'torch', ...literal('1 2 3\n4 5 6'), torch: { view: 'ops', op: 'mean' } },
				tasks: [
					{ text: 'With floats, mean works', patch: literal('1. 2. 3.\n4. 5. 6.') },
					{ text: 'Division: ÷ 2', patch: { ...literal('1 2 3\n4 5 6'), torch: { op: 'half' } } },
					{ text: '`copy` → `clone`', patch: { torch: { op: 'copy' } } },
					{ text: '`np.concatenate` → `torch.cat`', patch: { torch: { op: 'concat' } } }
				],
				remember: 'Same ideas, a few new names — and PyTorch prefers float32.'
			}
		]
	},
	{
		slug: 'pytorch-tensor',
		number: '11',
		title: 'PyTorch Tensor',
		summary: 'Tensor creation, shape, dtype, numel and device.',
		topics: ['Tensor creation', 'Shape', 'dtype', 'numel', 'device'],
		phase: 'torch',
		steps: [
			{
				title: 'Tensor creation',
				body: [
					'PyTorch has the creation functions you know from NumPy: `zeros`, `ones`, `full`, `arange`, `linspace`, `eye` and random ones. Pick one: NumPy builds the array here, and the PyTorch call is shown next to it.',
					'Watch the dtype: PyTorch makes **float32** where NumPy makes float64.'
				],
				patch: { tool: 'torch', ...expr('np.zeros((2, 3))'), torch: { view: 'create', focus: null } },
				tasks: [
					{ text: '`torch.arange(12).reshape(3, 4)`', patch: expr('np.arange(12).reshape(3, 4)') },
					{ text: '`torch.eye(3)`', patch: expr('np.eye(3)') },
					{ text: 'Random: `torch.rand(2, 3)`', patch: expr('np.random.default_rng(0).random((2, 3))') }
				]
			},
			{
				title: 'Shape',
				body: [
					'`t.shape` is a `torch.Size`, which is a tuple: `t.shape[0]` and `rows, cols = t.shape` work. `t.size()` returns the same thing, and `t.size(1)` the length of one dim.',
					'dim 0 is the outermost axis, exactly like axis 0 in NumPy.'
				],
				patch: { tool: 'torch', ...literal('1 2 3\n4 5 6\n\n7 8 9\n10 11 12'), torch: { view: 'tensor', focus: 'shape' } },
				tasks: [
					{ text: 'A 2-D tensor', patch: literal('1 2 3\n4 5 6') },
					{ text: 'A column', patch: literal('1\n2\n3') }
				]
			},
			{
				title: 'dtype',
				body: [
					'Every tensor has one dtype, such as `torch.float32` or `torch.int64`. `t.element_size()` is the number of bytes per element (NumPy: `itemsize`).',
					'Convert with `t.to(torch.float64)` or the shortcuts `t.float()` (float32), `t.double()` (float64), `t.long()` (int64) and `t.int()` (int32).'
				],
				patch: { tool: 'torch', ...literal('0.5 1.5 2.5\n3.5 4.5 5.5'), torch: { view: 'tensor', focus: 'dtype' } },
				tasks: [
					{ text: 'Ask for float64 explicitly', patch: literal('0.5 1.5 2.5\n3.5 4.5 5.5', 'float64') },
					{ text: 'Small integers: int8', patch: literal('1 2 3\n4 5 6', 'int8') },
					{ text: 'Booleans', patch: literal('True False True\nFalse True False') }
				]
			},
			{
				title: 'numel',
				body: [
					'`t.numel()` counts the elements: the product of the shape. It is NumPy’s `size`.',
					'Careful: `len(t)` is only the length of dim 0, and `t.size()` is the shape.'
				],
				patch: { tool: 'torch', ...expr('np.arange(24).reshape(2, 3, 4)'), torch: { view: 'tensor', focus: 'numel' } },
				tasks: [
					{ text: 'Shape (4, 6): same numel', patch: expr('np.arange(24).reshape(4, 6)') },
					{ text: 'Shape (24,)', patch: expr('np.arange(24)') }
				],
				remember: 'numel = product of the shape; reshape keeps numel.'
			},
			{
				title: 'device',
				body: [
					'A tensor also knows **where** its numbers are stored: `t.device`. New tensors live on the CPU. `t.to("cuda")` copies the data into a GPU’s own memory, where operations can run much faster.',
					'ArrayLab runs on your CPU, inside the browser, and has no GPU — the diagram is a conceptual picture. Run the notebook in Colab with a GPU runtime to try it for real.'
				],
				patch: { tool: 'torch', torch: { view: 'device', focus: 'device' } },
				remember: 'All tensors in one operation must be on the same device.'
			}
		]
	},
	{
		slug: 'autograd',
		number: '12',
		title: 'Autograd',
		summary: 'requires_grad, the computational graph, backward and gradients.',
		topics: ['requires_grad', 'Forward computation', 'Computational graph', 'backward', 'Gradients'],
		phase: 'torch',
		steps: [
			{
				title: 'requires_grad',
				body: [
					'Training a model means asking: how should each weight change to make the loss smaller? **Autograd** answers that automatically.',
					'You mark the tensors you want gradients for with `requires_grad=True`. Here the weight `w` and bias `b` are tracked; the input `x` and target `y` are just data.'
				],
				patch: { tool: 'autograd', autograd: { ...DEFAULT_AUTOGRAD, phase: 'forward' } },
				tasks: [
					{ text: 'Track `x` too', patch: { autograd: { requiresGrad: { x: true } } } },
					{ text: 'Track nothing', patch: { autograd: { requiresGrad: { x: false, w: false, b: false, y: false } } } }
				]
			},
			{
				title: 'Forward computation',
				body: [
					'The forward pass computes the loss one operation at a time: `m = w * x`, `pred = m + b`, `diff = pred - y`, `loss = diff ** 2`.',
					'Press **Animate forward**, then change a leaf value: everything downstream updates.'
				],
				patch: { tool: 'autograd', autograd: { ...DEFAULT_AUTOGRAD, phase: 'forward' } },
				tasks: [
					{ text: 'Make the prediction exact: b = 4', patch: { autograd: { values: { b: 4 } } } },
					{ text: 'A different input: x = 5', patch: { autograd: { values: { x: 5 } } } }
				]
			},
			{
				title: 'Computational graph',
				body: [
					'While computing, PyTorch records how each tracked result was made — its `grad_fn`: `MulBackward0`, `AddBackward0`, `SubBackward0`, `PowBackward0`. Together these records are the **computational graph**.',
					'Leaves have no `grad_fn`. Parts that depend on no tracked leaf (dashed) are not recorded at all.'
				],
				patch: { tool: 'autograd', autograd: { ...DEFAULT_AUTOGRAD, phase: 'forward' } },
				tasks: [
					{ text: 'Track only `b`', patch: { autograd: { requiresGrad: { w: false, b: true } } } },
					{ text: 'Track nothing: no graph', patch: { autograd: { requiresGrad: { w: false, b: false } } } }
				]
			},
			{
				title: 'backward',
				body: [
					'`loss.backward()` walks the graph backwards. Each node multiplies the gradient it receives by its **local derivative** and passes the product on — the chain rule.',
					'Press **Animate backward** and follow the list below the graph: every factor is written out.'
				],
				patch: { tool: 'autograd', autograd: { ...DEFAULT_AUTOGRAD, phase: 'backward' } },
				tasks: [
					{ text: 'Change x to 5', patch: { autograd: { values: { x: 5 } } } },
					{ text: 'Track `x` as well', patch: { autograd: { requiresGrad: { x: true } } } }
				]
			},
			{
				title: 'Gradients',
				body: [
					'After `backward()`, each tracked leaf has a `.grad`: how fast the loss changes when that leaf grows. A negative `w.grad` means increasing `w` lowers the loss.',
					'Gradient descent steps against the gradient: `w ← w − lr · w.grad`. Press **Take a step** a few times and watch the loss shrink.'
				],
				patch: { tool: 'autograd', autograd: { ...DEFAULT_AUTOGRAD, phase: 'backward' } },
				tasks: [
					{
						text: 'Too large a step: lr = 0.25 (then take a few steps)',
						patch: { autograd: { values: DEFAULT_AUTOGRAD.values, lr: 0.25 } }
					},
					{ text: 'Back to lr = 0.05', patch: { autograd: { values: DEFAULT_AUTOGRAD.values, lr: 0.05 } } }
				],
				remember: '`backward()` fills `.grad`; an optimizer uses `.grad` to update the weights.'
			}
		]
	}
];
