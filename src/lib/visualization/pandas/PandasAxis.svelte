<script lang="ts">
	import FrameTable from '../FrameTable.svelte';
	import Explain from '../../components/Explain.svelte';
	import type { CellDecor } from '../ArrayGrid.svelte';
	import type { Lab } from '../../lab/lab.svelte';
	import { PANDAS_REDUCE } from '../../pandas/codegen';
	import { formatShape } from '../../array/normalize';

	/** df.sum(axis=0 / 1): the same reduction as NumPy, but the result keeps labels. */
	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.pandas);
	const res = $derived(lab.resultFor('pandas'));
	const ok = $derived(!!res && !res.error);
	const df = $derived(ok ? lab.frame('df') : null);
	const result = $derived(ok ? lab.frame('result') : null);
	const numpy = $derived(ok ? lab.target('__np') : null);

	let hoverGroup = $state<number | null>(null);
	const cols = $derived(df?.previewShape[1] ?? 0);
	const group = (i: number, j: number) => (s.axis === 0 ? j : i);

	function decorateFrame(i: number, j: number): CellDecor {
		const g = group(i, j);
		return {
			group: g,
			badge: result?.index[g],
			state: hoverGroup === null ? undefined : g === hoverGroup ? 'focus' : 'dim',
			title: `feeds result[${result ? quote(result.index[g]) : g}]`
		};
	}
	function decorateResult(i: number): CellDecor {
		return { group: i, state: hoverGroup === null ? undefined : i === hoverGroup ? 'focus' : 'dim' };
	}
	function quote(label: string): string {
		return result?.indexKind === 'O' ? `'${label}'` : label;
	}

	const hasNaN = $derived(!!df && df.values.includes('NaN'));

	const formula = $derived.by(() => {
		if (!df || !result || hoverGroup === null) return null;
		const rows = df.previewShape[0];
		const terms: string[] = [];
		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) if (group(i, j) === hoverGroup) terms.push(df.values[i * cols + j]);
		}
		const used = terms.filter((t) => t !== 'NaN');
		const skipped = terms.length - used.length;
		const out = result.values[hoverGroup];
		const expr: Record<string, string> = {
			sum: used.join(' + ') || '0',
			mean: `(${used.join(' + ')}) / ${used.length}`,
			max: `max(${used.join(', ')})`,
			min: `min(${used.join(', ')})`
		};
		return `result[${quote(result.index[hoverGroup])}] = ${expr[s.fn]} = ${out}${skipped ? `   (${skipped} NaN skipped)` : ''}`;
	});
</script>

<div class="pd-row" role="group" aria-label="Reduction settings">
	<div class="pd-field">
		<span class="eyebrow" id="pd-fn">Function</span>
		<span class="segmented" role="group" aria-labelledby="pd-fn">
			{#each PANDAS_REDUCE as fn (fn)}
				<button type="button" aria-pressed={s.fn === fn} onclick={() => (s.fn = fn)}>{fn}</button>
			{/each}
		</span>
	</div>
	<div class="pd-field">
		<span class="eyebrow" id="pd-axis">axis</span>
		<span class="segmented" role="group" aria-labelledby="pd-axis">
			<button type="button" aria-pressed={s.axis === 0} onclick={() => (s.axis = 0)}>0 <span class="alias">'index'</span></button>
			<button type="button" aria-pressed={s.axis === 1} onclick={() => (s.axis = 1)}>1 <span class="alias">'columns'</span></button>
		</span>
	</div>
</div>

{#if df && result}
	<div class="pd-stage">
		<figure>
			<figcaption><code>df</code> <span class="muted">{formatShape(df.shape)}</span></figcaption>
			<FrameTable info={df} axisMark={s.axis} decorate={decorateFrame} onhover={(i, j) => (hoverGroup = i === null || j === null ? null : group(i, j))} />
		</figure>
		<div class="pd-op" aria-hidden="true"><code>df.{s.fn}(axis={s.axis})</code><span class="pd-arrow">⟶</span></div>
		<figure>
			<figcaption><code>result</code> <span class="muted">Series {formatShape(result.shape)} · {result.dtypes[0]}</span></figcaption>
			<FrameTable info={result} name="result" positions={false} decorate={(i) => decorateResult(i)} onhover={(i) => (hoverGroup = i)} />
		</figure>
	</div>
	<p class="pd-formula mono" aria-live="polite">
		{#if formula}{formula}{:else}<span class="muted">Hover a value to see which values were combined.</span>{/if}
	</p>
	<Explain>
		<p>
			<code>axis={s.axis}</code> works exactly like NumPy's: it collapses axis {s.axis}, so
			{#if s.axis === 0}
				the <strong>rows</strong> are combined and you get <strong>one value per column</strong>.
			{:else}
				the <strong>columns</strong> are combined and you get <strong>one value per row</strong>.
			{/if}
			pandas also accepts the axis by name: <code>axis='{s.axis === 0 ? 'index' : 'columns'}'</code>.
		</p>
		<p>
			The difference: the result is a <strong>Series labeled by the {s.axis === 0 ? 'column' : 'row'} labels</strong>
			({result.index.slice(0, 4).map(quote).join(', ')}{result.index.length > 4 ? ', …' : ''}). NumPy would return a bare array and
			you would have to remember which number belongs to which {s.axis === 0 ? 'column' : 'row'}.
		</p>
		{#if hasNaN}
			<p>
				<strong>NaN is skipped.</strong> pandas reductions ignore missing values by default (<code>skipna=True</code>).
				{#if numpy}
					NumPy does not: <code>np.{s.fn}(df.to_numpy(), axis={s.axis})</code> gives
					<code>[{numpy.values?.join(', ')}]</code>.
				{/if}
			</p>
		{/if}
		{#if s.fn === 'mean'}
			<p class="muted">The mean is a float even for integer columns, like in NumPy.</p>
		{/if}
	</Explain>
{/if}

<style>
	.alias {
		font-size: 0.75em;
		opacity: 0.8;
	}
</style>
