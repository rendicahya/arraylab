/**
 * The Autograd tool's computational graph:
 *
 *     m    = w * x          MulBackward0
 *     pred = m + b          AddBackward0
 *     diff = pred - y       SubBackward0
 *     loss = diff ** 2      PowBackward0
 *
 * NumPy (float32, like PyTorch's default) computes the forward values and, with the
 * chain rule written out step by step, the same gradients `loss.backward()` would put
 * in `.grad`. The grad_fn names are recorded from real PyTorch (reference.json).
 */
import reference from './reference.json';
import type { AutogradLeaf, AutogradState } from '../lab/types';

export const LEAVES: AutogradLeaf[] = ['x', 'w', 'b', 'y'];
export const LEAF_ROLE: Record<AutogradLeaf, string> = {
	x: 'input',
	w: 'weight',
	b: 'bias',
	y: 'target'
};

export type NodeId = AutogradLeaf | 'm' | 'pred' | 'diff' | 'loss';

export type OpNode = {
	id: Exclude<NodeId, AutogradLeaf>;
	op: 'mul' | 'add' | 'sub' | 'pow';
	expr: string;
	inputs: NodeId[];
	gradFn: string;
};

const gradFnNames = reference.autograd.gradFn;

export const OP_NODES: OpNode[] = [
	{ id: 'm', op: 'mul', expr: 'w * x', inputs: ['w', 'x'], gradFn: gradFnNames.mul },
	{ id: 'pred', op: 'add', expr: 'm + b', inputs: ['m', 'b'], gradFn: gradFnNames.add },
	{ id: 'diff', op: 'sub', expr: 'pred - y', inputs: ['pred', 'y'], gradFn: gradFnNames.sub },
	{ id: 'loss', op: 'pow', expr: 'diff ** 2', inputs: ['diff'], gradFn: gradFnNames.pow }
];

/** Order of the values in `__fwd` / `__grad`. */
export const NODE_ORDER: NodeId[] = ['x', 'w', 'b', 'y', 'm', 'pred', 'diff', 'loss'];

/**
 * One chain-rule step: the gradient flowing from `from` into `to`.
 * `local` is ∂from/∂to written in terms of forward values.
 */
export type BackwardEdge = { from: NodeId; to: NodeId; local: string; code: string };

export const BACKWARD_EDGES: BackwardEdge[] = [
	{ from: 'loss', to: 'diff', local: '2 · diff', code: 'grad_loss * 2 * diff' },
	{ from: 'diff', to: 'pred', local: '1', code: 'grad_diff * 1' },
	{ from: 'diff', to: 'y', local: '−1', code: 'grad_diff * -1' },
	{ from: 'pred', to: 'm', local: '1', code: 'grad_pred * 1' },
	{ from: 'pred', to: 'b', local: '1', code: 'grad_pred * 1' },
	{ from: 'm', to: 'w', local: 'x', code: 'grad_m * x' },
	{ from: 'm', to: 'x', local: 'w', code: 'grad_m * w' }
];

/** Which nodes PyTorch would track: a leaf with requires_grad, or any op fed by one. */
export function trackedNodes(requiresGrad: Record<AutogradLeaf, boolean>): Set<NodeId> {
	const tracked = new Set<NodeId>(LEAVES.filter((l) => requiresGrad[l]));
	for (const node of OP_NODES) {
		if (node.inputs.some((i) => tracked.has(i))) tracked.add(node.id);
	}
	return tracked;
}

/** The chain-rule steps backward() takes: only edges into tracked nodes. */
export function backwardSteps(requiresGrad: Record<AutogradLeaf, boolean>): BackwardEdge[] {
	const tracked = trackedNodes(requiresGrad);
	if (!tracked.has('loss')) return [];
	return BACKWARD_EDGES.filter((e) => tracked.has(e.to));
}

function pyFloat(v: number): string {
	const s = String(v);
	return /[.eE]/.test(s) ? s : `${s}.0`;
}

export function autogradInputError(s: AutogradState): string | undefined {
	for (const leaf of LEAVES) {
		if (!Number.isFinite(s.values[leaf])) return `Enter a number for ${leaf}.`;
	}
	if (!Number.isFinite(s.lr) || s.lr <= 0) return 'The learning rate must be a positive number.';
	return undefined;
}

/** Visible NumPy code (what runs) and hidden helper code for the view. */
export function autogradCode(s: AutogradState): { code: string; extra: string } {
	const steps = backwardSteps(s.requiresGrad);
	const lines = [
		'import numpy as np',
		'',
		'# Leaves. PyTorch: torch.tensor(3.0, requires_grad=True) — float32 by default',
		...LEAVES.map((l) => `${l} = np.float32(${pyFloat(s.values[l])})${s.requiresGrad[l] ? '   # requires_grad=True' : ''}`),
		'',
		'# Forward: compute the loss, one operation at a time',
		...OP_NODES.map((n) => `${n.id} = ${n.expr}`),
		''
	];
	if (steps.length) {
		lines.push('# Backward: what loss.backward() computes — the chain rule, from loss to the leaves');
		lines.push('grad_loss = np.float32(1.0)');
		for (const e of steps) lines.push(`grad_${e.to} = ${e.code}`);
		const leafGrads = LEAVES.filter((l) => s.requiresGrad[l]);
		lines.push('', `loss, ${leafGrads.map((l) => `grad_${l}`).join(', ')}`);
	} else {
		lines.push(`# Nothing requires grad, so there is no graph: loss.backward() would raise`);
		lines.push(`# ${reference.autograd.noGrad}`);
		lines.push('loss');
	}

	const grads = NODE_ORDER.map((n) => (steps.some((e) => e.to === n) || (n === 'loss' && steps.length) ? `grad_${n}` : 'np.nan'));
	const leafGrad = (l: AutogradLeaf) => (s.requiresGrad[l] && steps.length ? `grad_${l}` : 'np.float32(0)');
	const extra = [
		`__fwd = np.array([${NODE_ORDER.join(', ')}], dtype=np.float32)`,
		`__grad = np.array([${grads.join(', ')}], dtype=np.float32)`,
		`__lr = np.float32(${pyFloat(s.lr)})`,
		...LEAVES.map((l) => `__new_${l} = ${l} - __lr * ${leafGrad(l)}`),
		'__step = np.array([' + LEAVES.map((l) => `__new_${l}`).join(', ') + ', ((__new_w * __new_x + __new_b) - __new_y) ** 2], dtype=np.float32)'
	].join('\n');
	return { code: lines.join('\n'), extra };
}

export const AUTOGRAD_TARGETS = ['loss', '__fwd', '__grad', '__step'];
export const AUTOGRAD_NAMES = [
	...NODE_ORDER,
	...NODE_ORDER.map((n) => `grad_${n}`),
	'__fwd',
	'__grad',
	'__lr',
	'__step',
	...LEAVES.map((l) => `__new_${l}`)
];

/** PyTorch code for the same graph (shown, not run: PyTorch is not available in the browser). */
export function autogradTorchCode(s: AutogradState): string {
	const leaves = LEAVES.map(
		(l) => `${l} = torch.tensor(${pyFloat(s.values[l])}${s.requiresGrad[l] ? ', requires_grad=True' : ''})`
	);
	const tracked = LEAVES.filter((l) => s.requiresGrad[l]);
	const backward = tracked.length
		? ['loss.backward()', '', tracked.map((l) => `${l}.grad`).join(', ')]
		: ['loss.grad_fn   # None — nothing requires grad, so loss.backward() would fail'];
	return ['import torch', '', ...leaves, '', 'pred = w * x + b', 'loss = (pred - y) ** 2', ...backward].join('\n');
}
