<script lang="ts">
	import ArrayGrid, { type CellDecor } from './ArrayGrid.svelte';
	import MemoryBar from './MemoryBar.svelte';
	import Explain from '../components/Explain.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { DTYPES } from '../lab/codegen';
	import { formatShape } from '../array/normalize';
	import { boolMap, describeDtype } from '../array/inspect';

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
		return changed.get(flat) ? { state: 'changed', badge: '≠', title: 'value changed by the conversion' } : undefined;
	}
</script>

<div class="controls">
	<span class="eyebrow" id="dt-label">Convert with <code>a.astype(…)</code></span>
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
				<code>{result.dtype}</code>: {describeDtype(result.dtype)}.
				{#if range?.values}
					It can store values from <code>{range.values[0]}</code> to <code>{range.values[1]}</code>.
				{/if}
			</p>
			<p>
				Same shape, same number of elements ({a.size}); only the bytes per element change:
				<code>{a.itemsize}</code> → <code>{result.itemsize}</code>, so <code>nbytes</code> goes from {a.nbytes} to {result.nbytes}.
				<code>astype</code> returns a new array (a copy).
			</p>
			{#if changedCount > 0}
				<p><strong>{changedCount}</strong> value{changedCount === 1 ? '' : 's'} changed (dashed, marked ≠):</p>
			{:else}
				<p>No value changed — every element is exactly representable in <code>{result.dtype}</code>.</p>
			{/if}
			<ul>
				{#if 'fc'.includes(from) && from && 'iu'.includes(to) && to}
					<li>Float → integer <strong>truncates toward zero</strong> (2.7 → 2, −1.5 → −1). nan and inf have no integer value.</li>
				{/if}
				{#if 'iu'.includes(from) && from && 'iu'.includes(to) && to && result.itemsize <= a.itemsize && changedCount > 0}
					<li>Integers that do not fit <strong>wrap around</strong> (e.g. 300 in uint8 becomes 44 = 300 − 256). No error is raised by astype.</li>
				{/if}
				{#if to === 'b'}<li>To bool: <code>0</code> becomes False, <strong>any other value</strong> becomes True.</li>{/if}
				{#if from === 'b' && to !== 'b'}<li>From bool: True → 1, False → 0.</li>{/if}
				{#if 'iub'.includes(from) && from && to === 'f'}
					<li>Integer → float is exact for small values; very large integers can lose precision (float32 has ~7 significant digits, float64 ~16).</li>
				{/if}
				{#if from === 'f' && to === 'f' && result.itemsize < a.itemsize}
					<li>Fewer bits → values are <strong>rounded</strong> to the nearest representable number.</li>
				{/if}
				{#if to === 'c'}<li>Complex numbers get an imaginary part of 0.</li>{/if}
			</ul>
			{#if a.dtype === 'int32' && lab.settings.source.mode === 'literal' && !lab.settings.source.dtype}
				<p class="muted">
					Why is <code>a</code> int32? NumPy here runs on 32-bit WebAssembly, where the default integer is int32. On a
					typical 64-bit desktop, NumPy 2 creates int64 for the same code.
				</p>
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
