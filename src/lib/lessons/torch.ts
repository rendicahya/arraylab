import type { Chapter } from './types';

/**
 * PyTorch chapters are planned as phase 2. The browser runtime (Pyodide) does not
 * ship PyTorch, so these chapters describe the plan instead of simulating it.
 */
export const torchChapters: Chapter[] = [
	{
		slug: 'numpy-to-pytorch',
		number: '08',
		title: 'NumPy → PyTorch',
		summary: 'ndarray vs Tensor: converting, similarities and differences.',
		topics: ['ndarray vs Tensor', 'Converting between them', 'Similarities', 'Differences'],
		phase: 'torch',
		steps: []
	},
	{
		slug: 'pytorch-tensor',
		number: '09',
		title: 'PyTorch Tensor',
		summary: 'Tensor creation, shape, dtype, numel and device.',
		topics: ['Tensor creation', 'Shape', 'dtype', 'numel', 'device'],
		phase: 'torch',
		steps: []
	},
	{
		slug: 'autograd',
		number: '10',
		title: 'Autograd',
		summary: 'requires_grad, the computational graph, backward and gradients.',
		topics: ['requires_grad', 'Forward computation', 'Computational graph', 'backward', 'Gradients'],
		phase: 'torch',
		steps: []
	}
];
