<script lang="ts">
	import ArrayGrid, { type CellDecor } from '../ArrayGrid.svelte';
	import FrameTable from '../FrameTable.svelte';
	import Explain from '../../components/Explain.svelte';
	import type { Lab } from '../../lab/lab.svelte';
	import { formatShape } from '../../array/normalize';

	/** DataFrame = 2-D array + row labels + column labels. */
	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.pandas);
	const res = $derived(lab.resultFor('pandas'));
	const ok = $derived(!!res && !res.error);
	const a = $derived(res ? lab.target('a') : lab.provisional);
	const df = $derived(ok ? lab.frame('df') : null);
	const values = $derived(ok ? lab.target('values') : null);
	const shared = $derived(ok && lab.target('__shared')?.values?.[0] === 'True');

	let hover = $state<[number, number] | null>(null);
	const cols = $derived(df?.shape[1] ?? 1);

	function decorateArray(flat: number): CellDecor | undefined {
		if (!hover) return undefined;
		return flat === hover[0] * cols + hover[1] ? { state: 'focus' } : { state: 'dim' };
	}
	function decorateFrame(i: number, j: number): CellDecor | undefined {
		if (!hover) return undefined;
		return i === hover[0] && j === hover[1] ? { state: 'focus' } : { state: 'dim' };
	}
	function onArrayHover(flat: number | null) {
		hover = flat === null ? null : [Math.floor(flat / cols), flat % cols];
	}

	const call = $derived(
		`pd.DataFrame(a${s.index.trim() ? ', index=…' : ''}${s.columns.trim() ? ', columns=…' : ''})`
	);
</script>

<div class="pd-row" role="group" aria-label="Labels">
	<label class="pd-field">
		<span class="eyebrow">index · row labels</span>
		<input class="pd-input" bind:value={s.index} placeholder="empty → 0, 1, 2 …" spellcheck="false" autocomplete="off" size="16" />
	</label>
	<label class="pd-field">
		<span class="eyebrow">columns · column labels</span>
		<input class="pd-input" bind:value={s.columns} placeholder="empty → 0, 1, 2 …" spellcheck="false" autocomplete="off" size="16" />
	</label>
	<p class="pd-small muted hint">Words become text labels (<code>'r0'</code>), whole numbers become number labels (<code>10</code>).</p>
</div>

{#if a}
	<div class="pd-stage">
		<figure>
			<figcaption><code>a</code> <span class="muted">ndarray {formatShape(a.shape)}</span></figcaption>
			<ArrayGrid info={a} legend={false} decorate={decorateArray} onhover={onArrayHover} />
		</figure>
		{#if df}
			<div class="pd-op" aria-hidden="true"><code>{call}</code><span class="pd-arrow">⟶</span><span>adds labels</span></div>
			<figure>
				<figcaption><code>df</code> <span class="muted">DataFrame {formatShape(df.shape)}</span></figcaption>
				<FrameTable info={df} decorate={decorateFrame} onhover={(i, j) => (hover = i === null || j === null ? null : [i, j])} />
			</figure>
			{#if values}
				<div class="pd-op" aria-hidden="true"><code>df.to_numpy()</code><span class="pd-arrow">⟶</span><span>drops them</span></div>
				<figure>
					<figcaption><code>values</code> <span class="muted">ndarray {formatShape(values.shape)} · {values.dtype}</span></figcaption>
					<ArrayGrid info={values} name="values" legend={false} decorate={decorateArray} onhover={onArrayHover} />
				</figure>
			{/if}
		{/if}
	</div>
{/if}

{#if df && a && values}
	<Explain>
		<p>
			A <strong>DataFrame</strong> is a 2-D array of values with <strong>labels</strong> on both axes:
			<code>df.index</code> names the rows and <code>df.columns</code> names the columns (the shaded boxes). The labels are not
			values — <code>df.to_numpy()</code> returns only the {formatShape(values.shape)} array.
		</p>
		{#if a.ndim === 1}
			<p>A 1-D array of {a.shape[0]} values becomes <strong>{a.shape[0]} rows × 1 column</strong>. A DataFrame is always 2-D.</p>
		{:else}
			<p>Same shape as <code>a</code>: <code>{formatShape(a.shape)}</code>. Axis 0 of <code>a</code> is now labeled by the index, axis 1 by the columns.</p>
		{/if}
		{#if df.indexType === 'RangeIndex'}
			<p>
				Without row labels pandas numbers the rows <code>0, 1, 2 …</code> (a <code>RangeIndex</code>). Then labels and positions
				are the same numbers — until you sort or filter the rows. Step 4 (loc / iloc) shows why that matters.
			</p>
		{:else}
			<p>The small grey numbers are <strong>positions</strong>. Every row and column has both a label and a position.</p>
		{/if}
		<p>
			{#if shared}
				<code>values</code> shares memory with <code>a</code>.
			{:else}
				pandas 3 <strong>copied</strong> <code>a</code>: <code>np.shares_memory(values, a)</code> is False, so changing
				<code>a</code> later does not change <code>df</code>.
			{/if}
		</p>
		<p class="muted">Hover a value: it is the same element in all three.</p>
	</Explain>
{/if}

<style>
	.hint {
		align-self: center;
		max-width: 22rem;
	}
</style>
