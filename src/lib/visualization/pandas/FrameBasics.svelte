<script lang="ts">
	import ArrayGrid, { type CellDecor } from '../ArrayGrid.svelte';
	import FrameTable from '../FrameTable.svelte';
	import Explain from '../../components/Explain.svelte';
	import type { Lab } from '../../lab/lab.svelte';
	import { formatShape } from '../../array/normalize';
	import { tv } from '../../i18n/viz/pandas';

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

<div class="pd-row" role="group" aria-label={tv('frameBasics').labelsAria}>
	<label class="pd-field">
		<span class="eyebrow">{tv('frameBasics').indexLabel}</span>
		<input class="pd-input" bind:value={s.index} placeholder={tv('frameBasics').placeholder} spellcheck="false" autocomplete="off" size="16" />
	</label>
	<label class="pd-field">
		<span class="eyebrow">{tv('frameBasics').columnsLabel}</span>
		<input class="pd-input" bind:value={s.columns} placeholder={tv('frameBasics').placeholder} spellcheck="false" autocomplete="off" size="16" />
	</label>
	<p class="pd-small muted hint">{tv('frameBasics').hint}</p>
</div>

{#if a}
	<div class="pd-stage">
		<figure>
			<figcaption><code>a</code> <span class="muted">ndarray {formatShape(a.shape)}</span></figcaption>
			<ArrayGrid info={a} legend={false} decorate={decorateArray} onhover={onArrayHover} />
		</figure>
		{#if df}
			<div class="pd-op" aria-hidden="true"><code>{call}</code><span class="pd-arrow">⟶</span><span>{tv('frameBasics').addsLabels}</span></div>
			<figure>
				<figcaption><code>df</code> <span class="muted">DataFrame {formatShape(df.shape)}</span></figcaption>
				<FrameTable info={df} decorate={decorateFrame} onhover={(i, j) => (hover = i === null || j === null ? null : [i, j])} />
			</figure>
			{#if values}
				<div class="pd-op" aria-hidden="true"><code>df.to_numpy()</code><span class="pd-arrow">⟶</span><span>{tv('frameBasics').dropsThem}</span></div>
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
		<p>{tv('frameBasics').p1(formatShape(values.shape))}</p>
		{#if a.ndim === 1}
			<p>{tv('frameBasics').p2d1(a.shape[0])}</p>
		{:else}
			<p>{tv('frameBasics').p2dn(formatShape(a.shape))}</p>
		{/if}
		{#if df.indexType === 'RangeIndex'}
			<p>{tv('frameBasics').p3range}</p>
		{:else}
			<p>{tv('frameBasics').p3labeled}</p>
		{/if}
		<p>{shared ? tv('frameBasics').sharesMemory : tv('frameBasics').copied}</p>
		<p class="muted">{tv('frameBasics').hoverHint}</p>
	</Explain>
{/if}

<style>
	.hint {
		align-self: center;
		max-width: 22rem;
	}
</style>
