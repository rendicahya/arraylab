<script lang="ts">
	import ArrayGrid from '../ArrayGrid.svelte';
	import FrameTable from '../FrameTable.svelte';
	import Explain from '../../components/Explain.svelte';
	import type { CellDecor } from '../ArrayGrid.svelte';
	import type { Lab } from '../../lab/lab.svelte';
	import type { PandasMissing } from '../../lab/types';
	import { EXAMPLE_TABLE, MISSING_ROW } from '../../pandas/codegen';
	import { formatShape } from '../../array/normalize';
	import { tv } from '../../i18n/viz/pandas';

	/** One dtype per column, and what a missing value does to it. */
	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.pandas);
	const res = $derived(lab.resultFor('pandas'));
	const ok = $derived(!!res && !res.error);
	const df = $derived(ok ? lab.frame('df') : null);
	const values = $derived(ok ? lab.target('values') : null);
	const numbers = $derived(ok ? lab.target('numbers') : null);
	/** dtypes of the same table without the missing value (a Series: column → dtype). */
	const base = $derived(ok ? lab.frame('__base') : null);

	const OPTIONS: PandasMissing[] = ['none', ...EXAMPLE_TABLE.map((c) => c.column)];
	const missingCol = $derived(EXAMPLE_TABLE.findIndex((c) => c.column === s.missing));

	function baseDtype(j: number): string | undefined {
		if (!base || !df) return undefined;
		const k = base.index.indexOf(df.columns[j]);
		return k >= 0 ? base.values[k] : undefined;
	}
	const before = $derived(missingCol >= 0 ? baseDtype(missingCol) : undefined);
	const after = $derived(missingCol >= 0 && df ? df.dtypes[missingCol] : undefined);

	function decorate(i: number, j: number): CellDecor | undefined {
		if (i === MISSING_ROW && j === missingCol) return { state: 'changed', badge: 'None', title: tv('pandasDtypes').noneTypedHere };
		return undefined;
	}
	function dtypeNote(j: number): string | undefined {
		const b = baseDtype(j);
		return b && df && b !== df.dtypes[j] ? tv('pandasDtypes').wasWithoutMissing(b) : undefined;
	}
</script>

<div class="pd-row">
	<div class="pd-field">
		<span class="eyebrow" id="missing-label">{tv('pandasDtypes').putNoneIn(MISSING_ROW)}</span>
		<span class="segmented" role="group" aria-labelledby="missing-label">
			{#each OPTIONS as o (o)}
				<button type="button" aria-pressed={s.missing === o} onclick={() => (s.missing = o)}>{o === 'none' ? tv('pandasDtypes').nothing : o}</button>
			{/each}
		</span>
	</div>
</div>

{#if df}
	<div class="pd-stage">
		<figure>
			<figcaption><code>df</code> <span class="muted">{tv('pandasDtypes').frameCaption(formatShape(df.shape))}</span></figcaption>
			<FrameTable info={df} dtypes {decorate} {dtypeNote} />
		</figure>
		{#if values && numbers}
			<div class="arrays">
				<figure>
					<figcaption><code>df.to_numpy()</code> <span class="muted">{formatShape(values.shape)} · <strong>{values.dtype}</strong></span></figcaption>
					<ArrayGrid info={values} name="values" legend={false} size="small" />
				</figure>
				<figure>
					<figcaption><code>df[['age', 'score']].to_numpy()</code> <span class="muted">{formatShape(numbers.shape)} · <strong>{numbers.dtype}</strong></span></figcaption>
					<ArrayGrid info={numbers} name="numbers" legend={false} size="small" />
				</figure>
			</div>
		{/if}
	</div>

	<Explain>
		<p>{tv('pandasDtypes').p1(df.columns.map((c, j) => `${c}: ${df.dtypes[j]}`).join(', '))}</p>
		{#if values && numbers}
			<p>{tv('pandasDtypes').p2(values.dtype, numbers.dtype)}</p>
		{/if}
		{#if missingCol >= 0 && before && after}
			<p>
				<strong>{tv('pandasDtypes').missingIn(s.missing)}</strong>
				{#if before === after}
					{tv('pandasDtypes').staysSame(after, df.values[MISSING_ROW * df.shape[1] + missingCol])}
				{:else}
					{tv('pandasDtypes').changed(before, after)}
					{#if before.startsWith('int') && after.startsWith('float')}
						{tv('pandasDtypes').intToFloat}
					{:else if after === 'object'}
						{tv('pandasDtypes').boolToObject}
					{/if}
				{/if}
			</p>
		{:else}
			<p class="muted">{tv('pandasDtypes').prompt}</p>
		{/if}
	</Explain>
{/if}

<style>
	.arrays {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}
</style>
