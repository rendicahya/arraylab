<script lang="ts">
	import ArrayGrid, { type CellDecor } from './ArrayGrid.svelte';
	import ShapeAlignment from './ShapeAlignment.svelte';
	import Explain from '../components/Explain.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import type { BroadcastOp } from '../lab/types';
	import { formatIndex, formatShape, unravel } from '../array/normalize';
	import { alignShapes } from '../array/broadcast';
	import { gatherInfo, idMap, valueAt } from '../array/inspect';

	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.broadcast);
	const res = $derived(lab.resultFor('broadcast'));
	const a = $derived(res ? lab.target('a') : null);
	const b = $derived(res ? lab.target('b') : null);
	const ok = $derived(!!res && !res.error);
	const result = $derived(ok ? lab.target('result') : null);
	const ia = $derived(ok ? lab.target('__ia') : null);
	const ib = $derived(ok ? lab.target('__ib') : null);

	const OPS: { id: BroadcastOp; label: string }[] = [
		{ id: '+', label: '+' },
		{ id: '-', label: '−' },
		{ id: '*', label: '×' },
		{ id: '/', label: '÷' },
		{ id: '**', label: '**' },
		{ id: '>', label: '>' }
	];

	const shapeA = $derived(a?.shape ?? lab.provisional?.shape ?? [2, 3]);
	const presets = $derived.by(() => {
		const last = shapeA[shapeA.length - 1] ?? 3;
		const first = shapeA.length >= 2 ? shapeA[shapeA.length - 2] : 2;
		const row = Array.from({ length: last }, (_, i) => (i + 1) * 10).join(' ');
		const col = Array.from({ length: first }, (_, i) => (i + 1) * 100).join('\n');
		const bad = Array.from({ length: last === 2 ? 3 : 2 }, (_, i) => i + 1).join(' ');
		return [
			{ label: 'scalar', text: '10', shape: '()' },
			{ label: 'row', text: row, shape: `(${last},)` },
			{ label: 'column', text: col, shape: `(${first}, 1)` },
			{ label: 'mismatch', text: bad, shape: `(${last === 2 ? 3 : 2},)` }
		];
	});

	const alignment = $derived(a && b ? alignShapes([a.shape, b.shape]) : null);
	const stretchedA = $derived(a && ia ? gatherInfo(a, ia, 'a') : null);
	const stretchedB = $derived(b && ib ? gatherInfo(b, ib, 'b') : null);
	const mapA = $derived(idMap(ia));
	const mapB = $derived(idMap(ib));
	/** First position where each source id appears; later ones are stretched copies. */
	function firstSeen(map: Map<number, number>) {
		const seen = new Map<number, number>();
		for (const [pos, id] of map) if (!seen.has(id)) seen.set(id, pos);
		return seen;
	}
	const firstA = $derived(firstSeen(mapA));
	const firstB = $derived(firstSeen(mapB));
	const aStretched = $derived(!!a && !!result && a.shape.join() !== result.shape.join());
	const bStretched = $derived(!!b && !!result && b.shape.join() !== result.shape.join());

	let hover = $state<number | null>(null);

	function decorate(map: Map<number, number>, first: Map<number, number>, name: string, src: typeof a) {
		return (pos: number): CellDecor => {
			const id = map.get(pos);
			const copy = id !== undefined && first.get(id) !== pos;
			const from = id !== undefined && src ? formatIndex(name, unravel(id, src.shape)) : '';
			return {
				state: hover !== null ? (pos === hover ? 'focus' : 'dim') : copy ? 'ghost' : undefined,
				group: hover === pos ? 0 : undefined,
				title: copy ? `stretched copy of ${from} (not stored in memory)` : from
			};
		};
	}

	const formula = $derived.by(() => {
		if (hover === null || !a || !b || !result) return null;
		const idA = mapA.get(hover);
		const idB = mapB.get(hover);
		if (idA === undefined || idB === undefined) return null;
		const ra = formatIndex('a', unravel(idA, a.shape));
		const rb = formatIndex('b', unravel(idB, b.shape));
		const out = formatIndex('result', unravel(hover, result.shape));
		return `${out} = ${ra} ${s.op} ${rb} = ${valueAt(a, idA)} ${s.op} ${valueAt(b, idB)} = ${valueAt(result, hover)}`;
	});
</script>

<div class="controls">
	<div class="expr mono" aria-label="Operation">
		<span>result = a</span>
		<span class="segmented" role="group" aria-label="Operator">
			{#each OPS as op (op.id)}
				<button type="button" aria-pressed={s.op === op.id} onclick={() => (s.op = op.id)}>{op.label}</button>
			{/each}
		</span>
		<span>b</span>
	</div>
	<label class="b-input">
		<span class="eyebrow">b — type numbers (new line = new row)</span>
		<textarea bind:value={s.b} rows={Math.min(5, Math.max(2, s.b.split('\n').length))} spellcheck="false" class="mono"></textarea>
	</label>
	<div class="presets" role="group" aria-label="Example shapes for b">
		{#each presets as p (p.label)}
			<button type="button" class="chip" aria-pressed={s.b === p.text} onclick={() => (s.b = p.text)}>
				{p.label} <span class="mono muted">{p.shape}</span>
			</button>
		{/each}
	</div>
</div>

<RunStatus {lab} hideDiagram />

{#if a && b && alignment}
	<ShapeAlignment names={['a', 'b']} shapes={[a.shape, b.shape]} {alignment} />
{/if}

{#if a && b}
	<div class="stage">
		<figure>
			<figcaption>
				<code>a</code> <span class="muted">{formatShape(a.shape)}{aStretched ? ` → stretched to ${formatShape(result?.shape ?? [])}` : ''}</span>
			</figcaption>
			<ArrayGrid info={stretchedA ?? a} name="a" decorate={stretchedA ? decorate(mapA, firstA, 'a', a) : undefined} onhover={(f) => (hover = f)} legend={false} size="small" />
		</figure>
		<div class="op mono" aria-hidden="true">{s.op}</div>
		<figure>
			<figcaption>
				<code>b</code> <span class="muted">{formatShape(b.shape)}{bStretched ? ` → stretched to ${formatShape(result?.shape ?? [])}` : ''}</span>
			</figcaption>
			<ArrayGrid info={stretchedB ?? b} name="b" decorate={stretchedB ? decorate(mapB, firstB, 'b', b) : undefined} onhover={(f) => (hover = f)} legend={false} size="small" />
		</figure>
		{#if result}
			<div class="op mono" aria-hidden="true">=</div>
			<figure>
				<figcaption><code>result</code> <span class="muted">{formatShape(result.shape)} · {result.dtype}</span></figcaption>
				<ArrayGrid info={result} name="result" decorate={(pos) => (hover === null ? undefined : { state: pos === hover ? 'focus' : 'dim', group: pos === hover ? 0 : undefined })} onhover={(f) => (hover = f)} legend={false} size="small" />
			</figure>
		{/if}
	</div>
	{#if result}
		<p class="formula mono" aria-live="polite">
			{#if formula}{formula}{:else}<span class="muted">Hover any element to see which values were combined.</span>{/if}
		</p>
		<Explain>
			<p>
				NumPy lines the shapes up <strong>from the right</strong>. In each column the sizes must be equal, or one of
				them must be 1 (a missing dimension counts as 1). Size-1 dimensions are <strong>stretched</strong> to match.
			</p>
			{#if aStretched || bStretched}
				<p>
					Dashed cells are stretched copies — a <em>conceptual</em> picture. NumPy does not copy anything: it reuses the
					same values by stepping through memory with stride 0.
				</p>
			{/if}
			<p>
				Result dtype <code>{result.dtype}</code> comes from combining <code>{a.dtype}</code> and <code>{b.dtype}</code>{s.op === '/'
					? ' — true division always gives floats'
					: s.op === '>'
						? ' — comparisons give booleans'
						: ''}.
			</p>
		</Explain>
	{/if}
{/if}

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.6rem 1.2rem;
	}
	.expr {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 1.02rem;
		padding-bottom: 0.2rem;
	}
	.b-input {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.b-input textarea {
		min-width: 12rem;
		resize: vertical;
	}
	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		padding-bottom: 0.2rem;
	}
	.chip {
		border: 1px solid var(--border-strong);
		background: var(--surface);
		border-radius: 999px;
		padding: 0.1rem 0.6rem;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.chip[aria-pressed='true'] {
		background: var(--accent-soft);
		border-color: var(--accent);
	}
	.stage {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.8rem 1.1rem;
		overflow: auto;
		padding: 0.5rem 0.2rem;
	}
	figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	figcaption {
		font-size: 0.85rem;
	}
	.op {
		font-size: 1.5rem;
		color: var(--muted);
		padding-top: 1.2rem;
	}
	.formula {
		margin: 0;
		min-height: 1.6em;
	}
</style>
