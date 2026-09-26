<script lang="ts">
	import TorchCode from './TorchCode.svelte';
	import Explain from '../components/Explain.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import Icon from '../components/Icon.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import type { AutogradLeaf } from '../lab/types';
	import { Player } from '../lab/player.svelte';
	import {
		LEAVES,
		LEAF_ROLE,
		NODE_ORDER,
		OP_NODES,
		autogradTorchCode,
		backwardSteps,
		trackedNodes,
		type NodeId
	} from '../torch/autograd';
	import { TORCH_REFERENCE, TORCH_VERSION, colabUrl } from '../torch/translate';

	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.autograd);
	const res = $derived(lab.resultFor('autograd'));
	const ok = $derived(res && !res.error ? res : null);
	const fwd = $derived(ok ? lab.target('__fwd')?.values : undefined);
	const grad = $derived(ok ? lab.target('__grad')?.values : undefined);
	const step = $derived(ok ? lab.target('__step')?.values : undefined);

	const tracked = $derived(trackedNodes(s.requiresGrad));
	const steps = $derived(backwardSteps(s.requiresGrad));
	const player = new Player(900);

	function value(n: NodeId): string {
		return fwd?.[NODE_ORDER.indexOf(n)] ?? '…';
	}
	function gradOf(n: NodeId): string | null {
		const g = grad?.[NODE_ORDER.indexOf(n)];
		return g === undefined || g === 'nan' ? null : g;
	}
	const paren = (v: string) => (v.startsWith('-') ? `(${v})` : v);

	// ---- layout (SVG user units) ----
	const W = 142;
	const H = 66;
	type Layout = { width: number; height: number; pos: Record<NodeId, { x: number; y: number }> };
	/** Left to right: leaves, then each operation. */
	const WIDE: Layout = {
		width: 968,
		height: 372,
		pos: {
			x: { x: 8, y: 10 },
			w: { x: 8, y: 100 },
			b: { x: 8, y: 190 },
			y: { x: 8, y: 280 },
			m: { x: 206, y: 55 },
			pred: { x: 404, y: 120 },
			diff: { x: 602, y: 190 },
			loss: { x: 818, y: 190 }
		}
	};
	/** Narrow screens: operations go down a column, each leaf joins from the left. */
	const TALL: Layout = {
		width: 450,
		height: 523,
		pos: {
			x: { x: 8, y: 0 },
			w: { x: 8, y: 90 },
			b: { x: 8, y: 190 },
			y: { x: 8, y: 320 },
			m: { x: 210, y: 45 },
			pred: { x: 210, y: 175 },
			diff: { x: 210, y: 305 },
			loss: { x: 210, y: 435 }
		}
	};
	let graphWidth = $state(0);
	const layout = $derived(graphWidth && graphWidth < 620 ? TALL : WIDE);
	const POS = $derived(layout.pos);
	const EDGES: [NodeId, NodeId][] = OP_NODES.flatMap((n) => n.inputs.map((i) => [i, n.id] as [NodeId, NodeId]));

	/** An edge goes sideways when the target is to the right, otherwise down its column. */
	const sideways = (from: NodeId, to: NodeId) => POS[to].x >= POS[from].x + W;
	/** Vertical edges run near the right edge of the column, clear of the centered tags. */
	const DOWN_X = W - 14;

	function edgePath(from: NodeId, to: NodeId): string {
		const a = POS[from];
		const b = POS[to];
		if (!sideways(from, to)) return `M ${a.x + DOWN_X} ${a.y + H} L ${b.x + DOWN_X} ${b.y}`;
		const x1 = a.x + W;
		const y1 = a.y + H / 2;
		const x2 = b.x;
		const y2 = b.y + H / 2;
		const mx = (x1 + x2) / 2;
		return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
	}
	function edgeLabel(from: NodeId, to: NodeId) {
		const a = POS[from];
		const b = POS[to];
		if (!sideways(from, to)) return { x: a.x + DOWN_X + 8, y: (a.y + H + b.y) / 2 + 4, anchor: 'start' };
		return { x: (a.x + W + b.x) / 2, y: (a.y + b.y + H) / 2 - 6, anchor: 'middle' };
	}

	// ---- animation ----
	const activeForward = $derived(s.phase === 'forward' && player.step !== null ? OP_NODES[player.step] : null);
	const activeBackward = $derived(s.phase === 'backward' && player.step !== null ? steps[player.step] : null);
	let hoverStep = $state<number | null>(null);
	const focusEdge = $derived(activeBackward ?? (hoverStep !== null ? steps[hoverStep] : null));

	function isActiveEdge(from: NodeId, to: NodeId): boolean {
		if (activeForward) return activeForward.id === to;
		if (focusEdge) return focusEdge.to === from && focusEdge.from === to;
		return false;
	}
	function nodeActive(n: NodeId): boolean {
		return activeForward?.id === n || focusEdge?.to === n;
	}

	function setPhase(phase: 'forward' | 'backward') {
		player.stop();
		s.phase = phase;
	}
	function animate() {
		player.toggle(s.phase === 'forward' ? OP_NODES.length : steps.length);
	}

	function localValue(local: string): string {
		if (local === '2 · diff') return `2 × ${paren(value('diff'))}`;
		if (local === 'x' || local === 'w') return paren(value(local));
		return local.replace('−', '-');
	}

	function takeStep() {
		if (!step) return;
		const values: Partial<Record<AutogradLeaf, number>> = {};
		LEAVES.forEach((l, i) => {
			if (s.requiresGrad[l]) values[l] = Number(step[i]);
		});
		lab.apply({ autograd: { values } });
	}
	const lossAfter = $derived(step?.[LEAVES.length]);
	const trackedLeaves = $derived(LEAVES.filter((l) => s.requiresGrad[l]));
</script>

<div class="controls">
	<fieldset class="leaves">
		<legend class="eyebrow">Leaves</legend>
		{#each LEAVES as l (l)}
			<div class="leaf">
				<label class="val">
					<span class="mono name">{l}</span>
					<input
						type="number"
						step="any"
						value={s.values[l]}
						oninput={(e) => {
							const v = (e.currentTarget as HTMLInputElement).valueAsNumber;
							s.values[l] = v;
						}}
						aria-label="value of {l} ({LEAF_ROLE[l]})"
					/>
				</label>
				<label class="rg">
					<input type="checkbox" bind:checked={s.requiresGrad[l]} />
					<span class="mono">requires_grad</span>
				</label>
			</div>
		{/each}
	</fieldset>
	<div class="phase">
		<span class="segmented" role="group" aria-label="Direction">
			<button type="button" aria-pressed={s.phase === 'forward'} onclick={() => setPhase('forward')}>Forward</button>
			<button type="button" aria-pressed={s.phase === 'backward'} onclick={() => setPhase('backward')}>Backward</button>
		</span>
		<button class="btn" type="button" onclick={animate} disabled={s.phase === 'backward' && !steps.length}>
			<Icon name={player.playing ? 'pause' : 'play'} size={14} />
			{player.playing ? 'Stop' : s.phase === 'forward' ? 'Animate forward' : 'Animate backward'}
		</button>
	</div>
</div>

<RunStatus {lab} />

<div class="graph-wrap" bind:clientWidth={graphWidth}>
	<svg
		class:tall={layout === TALL}
		viewBox="0 0 {layout.width} {layout.height}"
		role="img"
		aria-label="Computational graph: m = w times x, pred = m plus b, diff = pred minus y, loss = diff squared. {s.phase === 'backward'
			? 'Gradients flow from loss back to the leaves.'
			: 'Values flow from the leaves to loss.'}"
	>
		<defs>
			<marker id="ag-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
				<path d="M 0 0 L 10 5 L 0 10 z" class="arrowhead" />
			</marker>
		</defs>

		{#each EDGES as [from, to] (from + to)}
			{@const back = s.phase === 'backward'}
			{@const live = back ? tracked.has(from) && tracked.has(to) : true}
			<path
				d={edgePath(from, to)}
				class="edge"
				class:back
				class:off={!live}
				class:active={isActiveEdge(from, to)}
				marker-end={back ? undefined : 'url(#ag-arrow)'}
				marker-start={back && live ? 'url(#ag-arrow)' : undefined}
			/>
			{#if back && live}
				{@const e = steps.find((x) => x.from === to && x.to === from)}
				{#if e}
					{@const p = edgeLabel(from, to)}
					<text x={p.x} y={p.y} class="edge-label" class:active={isActiveEdge(from, to)} text-anchor={p.anchor}>× {e.local}</text>
				{/if}
			{/if}
		{/each}

		{#each NODE_ORDER as n (n)}
			{@const p = POS[n]}
			{@const op = OP_NODES.find((o) => o.id === n)}
			{@const isTracked = tracked.has(n)}
			{@const g = gradOf(n)}
			<g class="node" class:tracked={isTracked} class:active={nodeActive(n)} class:leaf={!op}>
				<rect x={p.x} y={p.y} width={W} height={H} rx="8" />
				<text x={p.x + 10} y={p.y + 20} class="name">{n}{#if op}<tspan class="expr">{` = ${op.expr}`}</tspan>{/if}</text>
				<text x={p.x + 10} y={p.y + 40} class="val">{value(n)}</text>
				{#if s.phase === 'backward'}
					<text x={p.x + 10} y={p.y + 58} class="grad" class:none={g === null}>
						grad {g ?? (op ? '—' : 'None')}
					</text>
				{/if}
				<text x={p.x + W / 2} y={p.y + H + 15} class="tag" text-anchor="middle">
					{#if op}{isTracked ? op.gradFn : 'no grad_fn'}{:else}{isTracked ? 'requires_grad' : LEAF_ROLE[n as AutogradLeaf]}{/if}
				</text>
			</g>
		{/each}
	</svg>
</div>

<div class="legend small muted" aria-hidden="true">
	<span><span class="swatch solid"></span> tracked by autograd</span>
	<span><span class="swatch dashed"></span> not tracked</span>
	{#if s.phase === 'backward'}<span><code>× 2 · diff</code> on an edge = local derivative (chain-rule factor)</span>{/if}
</div>

{#if ok}
	{#if s.phase === 'forward'}
		<Explain title="Forward: compute the loss">
			<ol class="chain">
				{#each OP_NODES as node, i (node.id)}
					<li class:active={activeForward?.id === node.id}>
						<code>{node.id} = {node.expr}</code> =
						<span class="mono">{node.expr.replace(/\b(w|x|m|b|pred|y|diff)\b/g, (v) => paren(value(v as NodeId)))} = <strong>{value(node.id)}</strong></span>
						{#if tracked.has(node.id)}<span class="muted">· records <code>{node.gradFn}</code></span>{/if}
						{#if i === OP_NODES.length - 1}<span class="muted">(PyTorch: <code>loss.grad_fn</code> → {tracked.has('loss') ? `<${node.gradFn}>` : 'None'})</span>{/if}
					</li>
				{/each}
			</ol>
			<p class="muted">
				Every operation on a tensor that requires grad remembers <em>how</em> it was made (its <code>grad_fn</code>) — that
				record is the computational graph. Leaves have <code>grad_fn = None</code>.
			</p>
		</Explain>
	{:else if steps.length}
		<Explain title="Backward: the chain rule, from loss to the leaves">
			<ol class="chain">
				<li><code>loss.grad</code> starts at <strong>1</strong> (∂loss/∂loss)</li>
				{#each steps as e, i (e.from + e.to)}
					<li
						class:active={focusEdge === e}
						onmouseenter={() => (hoverStep = i)}
						onmouseleave={() => (hoverStep = null)}
					>
						∂loss/∂<code>{e.to}</code> = ∂loss/∂<code>{e.from}</code> × <code>{e.local}</code> =
						<span class="mono">{gradOf(e.from)} × {localValue(e.local)} = <strong>{gradOf(e.to)}</strong></span>
					</li>
				{/each}
			</ol>
			<p>
				Result: {#each LEAVES as l, i (l)}<code>{l}.grad</code> = <strong class="mono">{s.requiresGrad[l] ? gradOf(l) : 'None'}</strong
					>{i < LEAVES.length - 1 ? ', ' : '.'}
				{/each}
				Leaves without <code>requires_grad</code> get no gradient.
			</p>
		</Explain>

		<section class="descent" aria-label="Gradient descent step">
			<h3 class="eyebrow">Use the gradients</h3>
			<p class="small">
				A gradient says how <code>loss</code> changes when a leaf grows. Stepping <em>against</em> it lowers the loss:
				<code>w ← w − lr · w.grad</code>.
			</p>
			<div class="step-row">
				<label class="lr"><span class="mono">lr</span> <input type="number" step="any" min="0" bind:value={s.lr} aria-label="learning rate" /></label>
				<button class="btn primary" type="button" onclick={takeStep} disabled={!step || !trackedLeaves.length}>
					<Icon name="stepForward" size={14} /> Take a step
				</button>
				{#if lossAfter}
					<span class="mono small">loss {value('loss')} → <strong>{lossAfter}</strong></span>
				{/if}
			</div>
			<p class="muted small">
				Real PyTorch <strong>adds</strong> new gradients to <code>.grad</code> on every <code>backward()</code> (e.g.
				<code>w.grad</code> goes {TORCH_REFERENCE.autograd.example['w.grad']} → {TORCH_REFERENCE.autograd.accumulated['w.grad']} in the default example), so training
				loops reset them with <code>optimizer.zero_grad()</code>.
			</p>
		</section>
	{:else}
		<p class="notice-none" role="status">
			<Icon name="info" size={15} />
			<span>
				No leaf requires grad, so PyTorch records no graph and <code>loss.backward()</code> fails with
				<code>{TORCH_REFERENCE.autograd.noGrad}</code>. Tick <code>requires_grad</code> on <code>w</code> or <code>b</code>.
			</span>
		</p>
	{/if}
{/if}

<div class="torch-row">
	<TorchCode code={autogradTorchCode(s)} title="The same in PyTorch" />
	<p class="small muted">
		ArrayLab computes these numbers with NumPy in float32, writing out the chain rule that <code>loss.backward()</code> applies
		(see <em>Code that ran</em>). The grad_fn names and error messages were recorded with PyTorch {TORCH_VERSION}.
		<a href={colabUrl('pytorch.ipynb')} target="_blank" rel="noopener">Run it with real PyTorch in Colab</a>.
	</p>
</div>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.6rem 1rem;
	}
	.leaves {
		border: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.9rem;
	}
	.leaves legend {
		margin-bottom: 0.25rem;
	}
	.leaf {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.val {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.val .name {
		font-weight: 700;
	}
	.val input {
		width: 5.2rem;
		padding: 0.2rem 0.35rem;
	}
	.rg {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.75rem;
		color: var(--muted);
	}
	.phase {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.graph-wrap {
		overflow-x: auto;
	}
	svg {
		width: 100%;
		min-width: 560px;
		max-width: 62rem;
		height: auto;
		display: block;
	}
	svg.tall {
		min-width: 0;
		max-width: 30rem;
	}
	.edge {
		fill: none;
		stroke: var(--border-strong);
		stroke-width: 2;
	}
	.edge.back {
		stroke: var(--g1-strong);
	}
	.edge.off {
		stroke: var(--border);
		stroke-dasharray: 4 4;
	}
	.edge.active {
		stroke: var(--accent);
		stroke-width: 3.5;
	}
	.arrowhead {
		fill: var(--muted);
	}
	.edge-label {
		font: 600 12px var(--font-mono, monospace);
		fill: var(--g1-strong);
		paint-order: stroke;
		stroke: var(--background);
		stroke-width: 4px;
	}
	.edge-label.active {
		fill: var(--accent);
	}
	.node rect {
		fill: var(--surface);
		stroke: var(--border-strong);
		stroke-width: 1.5;
		stroke-dasharray: 5 4;
	}
	.node.tracked rect {
		stroke: var(--accent);
		stroke-width: 2;
		stroke-dasharray: none;
	}
	.node.active rect {
		fill: var(--array-cell-highlight);
		stroke: var(--array-cell-highlight-border);
		stroke-width: 3;
	}
	.node text {
		fill: var(--foreground);
		font-family: var(--font-mono, monospace);
	}
	.node .name {
		font-size: 14px;
		font-weight: 700;
	}
	.node .expr {
		font-weight: 400;
		font-size: 12px;
		fill: var(--muted);
	}
	.node .val {
		font-size: 16px;
	}
	.node .grad {
		font-size: 12px;
		font-weight: 700;
		fill: var(--g1-strong);
	}
	.node .grad.none {
		fill: var(--subtle);
		font-weight: 400;
	}
	.node .tag {
		font-size: 11px;
		fill: var(--muted);
	}
	.node.tracked .tag {
		fill: var(--accent);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 1rem;
	}
	.swatch {
		display: inline-block;
		width: 1.4rem;
		height: 0.8rem;
		vertical-align: middle;
		border-radius: 3px;
		border: 2px solid var(--accent);
	}
	.swatch.dashed {
		border: 1.5px dashed var(--border-strong);
	}
	.small {
		font-size: 0.82rem;
		margin: 0;
	}
	.chain {
		margin: 0;
		padding-left: 1.3rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.chain li {
		border-radius: var(--radius-sm);
		padding: 0.05rem 0.3rem;
		border: 1px solid transparent;
	}
	.chain li.active {
		background: var(--array-cell-highlight);
		border-color: var(--array-cell-highlight-border);
	}
	.descent {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		padding: 0.7rem 0.8rem;
		max-width: 48rem;
	}
	.descent p {
		margin: 0;
	}
	.step-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
	}
	.lr {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.lr input {
		width: 5rem;
		padding: 0.2rem 0.35rem;
	}
	.notice-none {
		display: flex;
		gap: 0.45rem;
		align-items: flex-start;
		margin: 0;
		border: 1px solid var(--warning);
		background: var(--warning-soft);
		border-radius: var(--radius-sm);
		padding: 0.5rem 0.7rem;
		font-size: 0.88rem;
	}
	.notice-none :global(svg) {
		flex: none;
		margin-top: 0.15rem;
	}
	.torch-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
		gap: 0.8rem 1.2rem;
		align-items: start;
	}
</style>
