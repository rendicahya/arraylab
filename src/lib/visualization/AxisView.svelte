<script lang="ts">
	import ArrayGrid, { type CellDecor } from './ArrayGrid.svelte';
	import Explain from '../components/Explain.svelte';
	import Icon from '../components/Icon.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { Player } from '../lab/player.svelte';
	import { REDUCE_FNS } from '../lab/codegen';
	import { axisRoles, formatIndex, formatShape, unravel } from '../array/normalize';
	import { reductionGroup, valueAt } from '../array/inspect';

	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.axis);
	const res = $derived(lab.resultFor('axis'));
	const a = $derived(res ? lab.target('a') : null);
	const result = $derived(res ? lab.target('result') : null);
	const ndim = $derived(a?.ndim ?? lab.provisional?.ndim ?? 2);
	const axisOptions = $derived([null, ...Array.from({ length: ndim }, (_, i) => i)]);
	const roles = $derived(axisRoles(ndim));

	// Keep the chosen axis valid when the array changes dimension.
	$effect(() => {
		if (s.axis !== null && s.axis >= ndim) s.axis = ndim > 0 ? ndim - 1 : null;
	});

	let hoverResult = $state<number | null>(null);
	let hoverInput = $state<number | null>(null);
	const player = new Player(900);
	$effect(() => {
		void lab.spec.code;
		player.stop();
		return () => player.stop();
	});

	const valid = $derived(!!a && !!result && !res?.error && (s.axis === null || s.axis < (a?.ndim ?? 0)));
	const reducedShape = $derived(a ? a.shape.filter((_, i) => i !== s.axis) : []);
	const group = (flat: number) => (a ? reductionGroup(flat, a.shape, s.axis) : 0);
	const focusGroup = $derived(
		player.step ?? hoverResult ?? (hoverInput !== null ? group(hoverInput) : null)
	);
	const resultSize = $derived(result?.size ?? 0);
	const call = $derived(
		`np.${s.fn}(a${s.axis === null ? '' : `, axis=${s.axis}`}${s.keepdims ? ', keepdims=True' : ''})`
	);

	function badge(g: number): string | undefined {
		if (s.axis === null) return undefined;
		const idx = unravel(g, reducedShape);
		return idx.length ? idx.join(',') : undefined;
	}

	function decorateInput(flat: number): CellDecor {
		const g = group(flat);
		const b = badge(g);
		return {
			group: g,
			badge: b,
			state: focusGroup === null ? undefined : g === focusGroup ? 'focus' : 'dim',
			title: b === undefined ? 'combined into the single result' : `feeds result[${b}]`
		};
	}

	function decorateResult(flat: number): CellDecor {
		return {
			group: flat,
			state: focusGroup === null ? undefined : flat === focusGroup ? 'focus' : 'dim'
		};
	}

	const formula = $derived.by(() => {
		if (!a || !result || focusGroup === null || !valid) return null;
		const members: number[] = [];
		for (let f = 0; f < a.size && members.length <= 64; f++) if (group(f) === focusGroup) members.push(f);
		const terms = members.map((f) => valueAt(a, f));
		const shown = terms.every((t) => t !== undefined) && members.length <= 12;
		const out = valueAt(result, focusGroup) ?? '…';
		const target = result.ndim === 0 ? 'result' : formatIndex('result', unravel(focusGroup, result.shape));
		const list = shown ? terms.join(', ') : `${Math.round(a.size / Math.max(1, resultSize))} values`;
		const expr: Record<string, string> = {
			sum: shown ? terms.join(' + ') : `sum of ${list}`,
			prod: shown ? terms.join(' × ') : `product of ${list}`,
			mean: shown ? `(${terms.join(' + ')}) / ${terms.length}` : `mean of ${list}`,
			max: `max(${list})`,
			min: `min(${list})`,
			argmax: `position of max(${list})`
		};
		return `${target} = ${expr[s.fn]} = ${out}`;
	});
</script>

<div class="controls" role="group" aria-label="Reduction settings">
	<div class="field">
		<span class="eyebrow" id="fn-label">Function</span>
		<span class="segmented" role="group" aria-labelledby="fn-label">
			{#each REDUCE_FNS as fn (fn.id)}
				<button type="button" aria-pressed={s.fn === fn.id} onclick={() => (s.fn = fn.id)}>{fn.label}</button>
			{/each}
		</span>
	</div>
	<div class="field">
		<span class="eyebrow" id="axis-label">axis</span>
		<span class="segmented" role="group" aria-labelledby="axis-label">
			{#each axisOptions as opt (String(opt))}
				<button type="button" aria-pressed={s.axis === opt} onclick={() => (s.axis = opt)}>
					{opt === null ? 'None' : opt}
				</button>
			{/each}
		</span>
	</div>
	<label class="check">
		<input type="checkbox" bind:checked={s.keepdims} />
		<code>keepdims=True</code>
	</label>
	<button class="btn" type="button" onclick={() => player.toggle(resultSize)} disabled={!valid}>
		<Icon name={player.playing ? 'pause' : 'play'} size={15} />
		{player.playing ? 'Stop' : 'Step through'}
	</button>
</div>

<RunStatus {lab} />

{#if a && valid && result}
	<div class="stage">
		<figure>
			<figcaption><code>a</code> <span class="muted">{formatShape(a.shape)}</span></figcaption>
			<ArrayGrid
				info={a}
				axisMark={s.axis}
				markAll={s.axis === null}
				decorate={decorateInput}
				onhover={(f) => (hoverInput = f)}
			/>
		</figure>
		<div class="op" aria-hidden="true">
			<code>{call}</code>
			<span class="big-arrow">⟶</span>
		</div>
		<figure>
			<figcaption>
				<code>result</code> <span class="muted">{formatShape(result.shape)} · {result.dtype}</span>
			</figcaption>
			<ArrayGrid
				info={result}
				name="result"
				decorate={decorateResult}
				onhover={(f) => (hoverResult = f)}
				legend={false}
			/>
		</figure>
	</div>
	<p class="formula mono" aria-live="polite">
		{#if formula}
			{formula}
		{:else}
			<span class="muted">Hover a result element (or press “Step through”) to see which values produced it.</span>
		{/if}
	</p>
	<Explain>
		{#if s.axis === null}
			<p>
				<code>axis=None</code> combines <strong>all {a.size} elements</strong> into a single value{s.keepdims
					? `, kept as shape ${formatShape(result.shape)} because of keepdims`
					: ''}.
			</p>
		{:else}
			<p>
				<code>axis={s.axis}</code> collapses axis {s.axis} ({roles[s.axis]}, length {a.shape[s.axis]}).
				Each result element combines the {a.shape[s.axis]} values whose indices differ
				<em>only</em> in position {s.axis}. Cells with the same label (and color) feed the same result element.
			</p>
			<p>
				Shape: <code>{formatShape(a.shape)}</code> → <code>{formatShape(result.shape)}</code>
				{#if s.keepdims}
					— keepdims leaves axis {s.axis} in place with length 1, so the result still lines up with
					<code>a</code> for broadcasting.
				{:else}
					— axis {s.axis} is removed.
				{/if}
			</p>
		{/if}
		{#if s.fn === 'mean'}
			<p>The mean is a float even for integer input, so the dtype is <code>{result.dtype}</code>.</p>
		{/if}
		{#if s.fn === 'argmax'}
			<p>
				<code>argmax</code> returns <strong>where</strong> the maximum is (its index{s.axis === null
					? ' in the flattened array'
					: ` along axis ${s.axis}`}), not the maximum itself.
			</p>
		{/if}
		{#if a.ndim >= 2 && s.axis !== null}
			<p class="muted">
				Think “which index varies”, not “rows or columns” — that reading still works in 3-D and beyond.
			</p>
		{/if}
	</Explain>
{/if}

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.75rem 1.25rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.9rem;
		padding-bottom: 0.3rem;
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
	}
	.op {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.big-arrow {
		font-size: 1.6rem;
		color: var(--axis-mark);
	}
	.formula {
		margin: 0;
		min-height: 1.6em;
		font-size: 0.95rem;
	}
</style>
