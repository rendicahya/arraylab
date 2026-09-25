<script lang="ts">
	import ArrayGrid, { type CellDecor } from './ArrayGrid.svelte';
	import Explain from '../components/Explain.svelte';
	import Icon from '../components/Icon.svelte';
	import Tag from '../components/Tag.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { Player } from '../lab/player.svelte';
	import { shapeOpExpr } from '../lab/codegen';
	import type { ShapeOp } from '../lab/types';
	import { formatIndex, formatShape, reshapeSuggestions, unravel } from '../array/normalize';
	import { idMap } from '../array/inspect';

	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.reshape);
	const res = $derived(lab.resultFor('reshape'));
	const a = $derived(res ? lab.target('a') : null);
	const result = $derived(res && !res.error ? lab.target('result') : null);
	const src = $derived(res && !res.error ? lab.target('__src') : null);
	const isView = $derived(lab.target('__view')?.values?.[0] === 'True');
	const size = $derived(a?.size ?? lab.provisional?.size ?? 6);

	const OPS: { id: ShapeOp; label: string }[] = [
		{ id: 'reshape', label: 'reshape' },
		{ id: 'transpose', label: 'transpose / .T' },
		{ id: 'flatten', label: 'flatten' },
		{ id: 'ravel', label: 'ravel' }
	];

	const suggestions = $derived([
		...reshapeSuggestions(size, 5).map((t) => t.replace(/[()]/g, '').replace(/,$/, '')),
		'-1, 1',
		...(size % 2 === 0 ? ['2, -1'] : [])
	]);

	/** result position → source element id */
	const provenance = $derived(idMap(src));
	/** source id → result position */
	const inverse = $derived(new Map([...provenance].map(([pos, id]) => [id, pos])));

	let hoverSource = $state<number | null>(null);
	let hoverResult = $state<number | null>(null);
	const player = new Player(450);
	$effect(() => {
		void lab.spec.code;
		player.stop();
		return () => player.stop();
	});
	const focusId = $derived(
		player.step !== null
			? (provenance.get(player.step) ?? null)
			: hoverResult !== null
				? (provenance.get(hoverResult) ?? null)
				: hoverSource
	);

	const groupOf = (id: number) => (a && a.ndim >= 2 ? unravel(id, a.shape)[0] : undefined);

	function decorateSource(flat: number): CellDecor {
		return {
			group: groupOf(flat),
			badge: String(flat),
			state: focusId === null ? undefined : focusId === flat ? 'focus' : 'dim'
		};
	}
	function decorateResult(pos: number): CellDecor {
		const id = provenance.get(pos);
		return {
			group: id === undefined ? undefined : groupOf(id),
			badge: id === undefined ? undefined : String(id),
			state: focusId === null ? undefined : id === focusId ? 'focus' : 'dim',
			title: id !== undefined && a ? `from ${formatIndex('a', unravel(id, a.shape))}` : undefined
		};
	}

	const orderPreserved = $derived.by(() => {
		for (const [pos, id] of provenance) if (pos !== id) return false;
		return true;
	});
	const focusLine = $derived.by(() => {
		if (focusId === null || !a || !result) return null;
		const pos = inverse.get(focusId);
		if (pos === undefined) return null;
		return `${formatIndex('a', unravel(focusId, a.shape))} → ${formatIndex('result', unravel(pos, result.shape))}`;
	});
</script>

<div class="controls">
	<span class="segmented" role="group" aria-label="Operation">
		{#each OPS as op (op.id)}
			<button type="button" aria-pressed={s.op === op.id} onclick={() => (s.op = op.id)}>{op.label}</button>
		{/each}
	</span>
	{#if s.op === 'reshape'}
		<label class="expr mono">
			<span>a.reshape(</span>
			<input bind:value={s.shape} spellcheck="false" aria-label="New shape" size={Math.max(6, s.shape.length + 1)} />
			<span>)</span>
		</label>
	{:else if s.op === 'transpose'}
		<label class="expr mono">
			<span>a.transpose(</span>
			<input bind:value={s.axes} spellcheck="false" placeholder="reverse" aria-label="Axis order (optional)" size={Math.max(7, s.axes.length + 1)} />
			<span>)</span>
		</label>
	{/if}
	<button class="btn" type="button" onclick={() => player.toggle(result?.size ?? 0)} disabled={!result}>
		<Icon name={player.playing ? 'pause' : 'play'} size={15} />
		{player.playing ? 'Stop' : 'Play reading order'}
	</button>
</div>
{#if s.op === 'reshape'}
	<div class="presets" role="group" aria-label="Shapes that fit {size} elements">
		{#each suggestions as sug (sug)}
			<button type="button" class="chip mono" aria-pressed={s.shape === sug} onclick={() => (s.shape = sug)}>({sug})</button>
		{/each}
	</div>
{/if}

<RunStatus {lab} />

{#if a}
	<div class="stage">
		<figure>
			<figcaption><code>a</code> <span class="muted">{formatShape(a.shape)}</span></figcaption>
			<ArrayGrid info={a} decorate={decorateSource} onhover={(f) => (hoverSource = f)} />
		</figure>
		{#if result}
			<div class="op" aria-hidden="true"><code>{shapeOpExpr('a', s)}</code><span class="big-arrow">⟶</span></div>
			<figure>
				<figcaption>
					<code>result</code> <span class="muted">{formatShape(result.shape)}</span>
					<Tag tone={isView ? 'accent' : 'neutral'} title="np.shares_memory(result, a)">{isView ? 'view of a' : 'copy'}</Tag>
					{#if !result.cContiguous}<Tag tone="warning" title="result.flags['C_CONTIGUOUS']">not C-contiguous</Tag>{/if}
				</figcaption>
				<ArrayGrid info={result} name="result" decorate={decorateResult} onhover={(f) => (hoverResult = f)} />
			</figure>
		{/if}
	</div>
	<p class="focus-line mono" aria-live="polite">
		{#if focusLine}{focusLine}{:else}<span class="muted">Small numbers are each element's position in <code>a</code>'s reading order (0, 1, 2, …). Hover to follow one element.</span>{/if}
	</p>

	{#if result}
		<Explain>
			{#if s.op === 'reshape'}
				<p>
					Same {a.size} elements, <strong>same order</strong>, new shape:
					<code>{formatShape(a.shape)}</code> → <code>{formatShape(result.shape)}</code>
					({result.shape.join(' × ')} = {result.size}). Read <code>result</code> row by row and the labels go
					0, 1, 2, … exactly as in <code>a</code>.
				</p>
				{#if s.shape.includes('-1')}<p><code>-1</code> asks NumPy to infer that dimension from the size.</p>{/if}
				<p class="muted">
					Not to be confused with <code>np.resize</code>, which may repeat or drop elements to reach a different size.
				</p>
			{:else if s.op === 'transpose'}
				<p>
					Transpose reorders the axes{s.axes.trim() ? ` to (${s.axes})` : ' (reversed)'}{#if a.ndim === 2 && !s.axes.trim()}: element
						<code>a[i, j]</code> moves to <code>result[j, i]</code>{:else if a.ndim === 3 && !s.axes.trim()}: element
						<code>a[i, j, k]</code> moves to <code>result[k, j, i]</code>{/if}. Shape <code>{formatShape(a.shape)}</code> →
					<code>{formatShape(result.shape)}</code>.
				</p>
				<p>
					{orderPreserved ? 'Here the reading order happens to be unchanged.' : 'The reading order changes: press “Play reading order” and watch the source jump.'}
					No data moves: the result is a {isView ? 'view' : 'copy'} with swapped strides{result.cContiguous ? '' : ', so it is no longer C-contiguous'}.
				</p>
			{:else if s.op === 'flatten'}
				<p><code>flatten()</code> always returns a new 1-D <strong>copy</strong> in reading order.</p>
			{:else}
				<p>
					<code>ravel()</code> returns 1-D in reading order — a <strong>view</strong> when possible (no copy), otherwise a copy.
					Here it is a <strong>{isView ? 'view' : 'copy'}</strong>.
				</p>
			{/if}
			<p>
				<strong>{isView ? 'View' : 'Copy'}:</strong>
				{isView ? 'writing into result would also change a.' : 'result has its own memory; changing it leaves a untouched.'}
			</p>
		</Explain>
	{/if}
{/if}

<style>
	.controls {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6rem 1rem;
	}
	.expr {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		font-size: 1.02rem;
	}
	.expr input {
		font-family: var(--font-mono);
		min-width: 5rem;
	}
	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.chip {
		border: 1px solid var(--border-strong);
		background: var(--surface);
		border-radius: 999px;
		padding: 0.1rem 0.55rem;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.chip[aria-pressed='true'] {
		background: var(--accent-soft);
		border-color: var(--accent);
		color: var(--accent);
	}
	.stage {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem 1.5rem;
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
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.op {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.big-arrow {
		font-size: 1.6rem;
		color: var(--accent);
	}
	.focus-line {
		margin: 0;
		min-height: 1.6em;
	}
</style>
