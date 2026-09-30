<script lang="ts">
	import ArrayGrid, { type CellDecor } from './ArrayGrid.svelte';
	import MemoryBar from './MemoryBar.svelte';
	import Explain from '../components/Explain.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import RichText from '../components/RichText.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { DTYPES } from '../lab/codegen';
	import { formatShape } from '../array/normalize';
	import { boolMap } from '../array/inspect';
	import { tDtype, describeDtypeLocalized } from '../i18n/viz/broadcastVectorizeDtype';

	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.dtype);
	const res = $derived(lab.resultFor('dtype'));
	const a = $derived(res ? lab.target('a') : null);
	const result = $derived(res && !res.error ? lab.target('result') : null);
	const changed = $derived(boolMap(res && !res.error ? lab.target('__changed') : null));
	const range = $derived(res && !res.error ? lab.target('__range') : null);
	const changedCount = $derived([...changed.values()].filter(Boolean).length);

	const from = $derived(a?.dtypeKind ?? '');
	const to = $derived(result?.dtypeKind ?? '');

	function decorate(flat: number): CellDecor | undefined {
		return changed.get(flat) ? { state: 'changed', badge: '≠', title: tDtype().valueChangedTitle } : undefined;
	}
</script>

<div class="controls">
	<span class="eyebrow" id="dt-label"><RichText text={tDtype().convertWith} /></span>
	<span class="segmented" role="group" aria-labelledby="dt-label">
		{#each DTYPES as t (t)}
			<button type="button" aria-pressed={s.target === t} onclick={() => (s.target = t)}>{t}</button>
		{/each}
	</span>
</div>

<RunStatus {lab} />

{#if a}
	<div class="stage">
		<figure>
			<figcaption><code>a</code> <span class="muted">{formatShape(a.shape)} · <strong>{a.dtype}</strong></span></figcaption>
			<ArrayGrid info={a} legend={false} />
			<MemoryBar info={a} />
		</figure>
		{#if result}
			<div class="op" aria-hidden="true"><code>.astype(np.{s.target})</code><span class="big-arrow">⟶</span></div>
			<figure>
				<figcaption><code>result</code> <span class="muted">{formatShape(result.shape)} · <strong>{result.dtype}</strong></span></figcaption>
				<ArrayGrid info={result} name="result" {decorate} legend={false} />
				<MemoryBar info={result} />
			</figure>
		{/if}
	</div>

	{#if result}
		<Explain>
			<p>
				<code>{result.dtype}</code>: {describeDtypeLocalized(result.dtype)}.
				{#if range?.values}
					<RichText text={tDtype().canStore(String(range.values[0]), String(range.values[1]))} />
				{/if}
			</p>
			<p>
				<RichText text={tDtype().sameShape(a.size, a.itemsize, result.itemsize, a.nbytes, result.nbytes)} />
			</p>
			{#if changedCount > 0}
				<p><RichText text={tDtype().valuesChanged(changedCount)} /></p>
			{:else}
				<p><RichText text={tDtype().noValueChanged(result.dtype)} /></p>
			{/if}
			<ul>
				{#if 'fc'.includes(from) && from && 'iu'.includes(to) && to}
					<li><RichText text={tDtype().floatToInt} /></li>
				{/if}
				{#if 'iu'.includes(from) && from && 'iu'.includes(to) && to && result.itemsize <= a.itemsize && changedCount > 0}
					<li><RichText text={tDtype().wrapAround} /></li>
				{/if}
				{#if to === 'b'}<li><RichText text={tDtype().toBool} /></li>{/if}
				{#if from === 'b' && to !== 'b'}<li><RichText text={tDtype().fromBool} /></li>{/if}
				{#if 'iub'.includes(from) && from && to === 'f'}
					<li><RichText text={tDtype().intToFloat} /></li>
				{/if}
				{#if from === 'f' && to === 'f' && result.itemsize < a.itemsize}
					<li><RichText text={tDtype().rounded} /></li>
				{/if}
				{#if to === 'c'}<li><RichText text={tDtype().complexImaginary} /></li>{/if}
			</ul>
			{#if a.dtype === 'int32' && lab.settings.source.mode === 'literal' && !lab.settings.source.dtype}
				<p class="muted"><RichText text={tDtype().int32Note} /></p>
			{/if}
		</Explain>
	{/if}
{/if}

<style>
	.controls {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3rem;
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
		gap: 0.5rem;
	}
	figcaption {
		font-size: 0.85rem;
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
</style>
