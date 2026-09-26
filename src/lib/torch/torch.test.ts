import { describe, expect, it } from 'vitest';
import { CREATE_PRESETS, TORCH_OPS, createPresetFor, tensorSource, torchDtypeOf, torchOpResult, torchSize } from './translate';
import { backwardSteps, trackedNodes } from './autograd';
import type { ArrayInfo } from '../array/types';

const info = (dtype: string, dtypeKind: string): ArrayInfo =>
	({ kind: 'array', backend: 'numpy', shape: [2], ndim: 1, size: 2, dtype, dtypeKind }) as ArrayInfo;

describe('NumPy → PyTorch translation (recorded from real PyTorch)', () => {
	it('torch.tensor(list) picks PyTorch defaults, not NumPy ones', () => {
		const src = { mode: 'literal' as const, text: '1 2\n3 4', dtype: '', expr: '' };
		const t = tensorSource(src, info('int32', 'i'));
		expect(t.code).toBe('t = torch.tensor([[1, 2],\n                  [3, 4]])');
		expect(t.dtype).toBe('torch.int64');
		expect(tensorSource({ ...src, text: '0.5 1' }, info('float64', 'f')).dtype).toBe('torch.float32');
		expect(tensorSource({ ...src, text: 'True False' }, info('bool', 'b')).dtype).toBe('torch.bool');
	});

	it('keeps an explicit dtype and translates nan/inf', () => {
		const t = tensorSource({ mode: 'literal', text: '1 nan -inf', dtype: 'float64', expr: '' }, info('float64', 'f'));
		expect(t.code).toMatch(/^t = torch\.tensor\(\[ +1, +torch\.nan, -torch\.inf\], dtype=torch\.float64\)$/);
		expect(t.dtype).toBe('torch.float64');
	});

	it('from_numpy keeps the ndarray dtype', () => {
		const t = tensorSource({ mode: 'expr', text: '', dtype: '', expr: 'np.arange(6)' }, info('int32', 'i'));
		expect(t).toEqual({ code: 't = torch.from_numpy(a)', dtype: 'torch.int32', how: 'from_numpy' });
		expect(torchDtypeOf('complex128')).toBe('torch.complex128');
	});

	it('knows what PyTorch returned for each operation', () => {
		expect(TORCH_OPS.length).toBeGreaterThan(10);
		expect(torchOpResult('mean', 'torch.int64')).toHaveProperty('error');
		expect(torchOpResult('mean', 'torch.float32')).toEqual({ dtype: 'torch.float32' });
		expect(torchOpResult('sum', 'torch.int32')).toEqual({ dtype: 'torch.int64' });
		expect(torchOpResult('half', 'torch.int64')).toEqual({ dtype: 'torch.float32' });
		expect(torchSize([2, 3])).toBe('torch.Size([2, 3])');
	});

	it('maps creation presets both ways', () => {
		const zeros = CREATE_PRESETS.find((p) => p.id === 'zeros')!;
		expect(zeros).toMatchObject({ torch: 'torch.zeros(2, 3)', dtype: 'torch.float32', numpyDtype: 'float64' });
		expect(createPresetFor('np.zeros((2,3))')?.id).toBe('zeros');
		expect(createPresetFor('np.zeros((4, 3))')).toBeUndefined();
	});
});

describe('autograd graph', () => {
	it('tracks every node downstream of a leaf that requires grad', () => {
		const t = trackedNodes({ x: false, w: false, b: true, y: false });
		expect([...t].sort()).toEqual(['b', 'diff', 'loss', 'pred']);
	});

	it('runs the chain rule only into tracked nodes', () => {
		const steps = backwardSteps({ x: false, w: true, b: true, y: false }).map((e) => `${e.from}->${e.to}`);
		expect(steps).toEqual(['loss->diff', 'diff->pred', 'pred->m', 'pred->b', 'm->w']);
		expect(backwardSteps({ x: false, w: false, b: false, y: false })).toEqual([]);
	});
});
