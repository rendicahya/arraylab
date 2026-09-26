<script lang="ts">
	import ArrayGrid from '../ArrayGrid.svelte';
	import FrameTable from '../FrameTable.svelte';
	import Explain from '../../components/Explain.svelte';
	import type { CellDecor } from '../ArrayGrid.svelte';
	import type { Lab } from '../../lab/lab.svelte';
	import type { PandasMissing } from '../../lab/types';
	import { EXAMPLE_TABLE, MISSING_ROW } from '../../pandas/codegen';
	import { formatShape } from '../../array/normalize';

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
		if (i === MISSING_ROW && j === missingCol) return { state: 'changed', badge: 'None', title: 'None was typed here' };
		return undefined;
	}
	function dtypeNote(j: number): string | undefined {
		const b = baseDtype(j);
		return b && df && b !== df.dtypes[j] ? `was ${b} without the missing value` : undefined;
	}
</script>

<div class="pd-row">
	<div class="pd-field">
		<span class="eyebrow" id="missing-label">Put <code>None</code> in row {MISSING_ROW} of</span>
		<span class="segmented" role="group" aria-labelledby="missing-label">
			{#each OPTIONS as o (o)}
				<button type="button" aria-pressed={s.missing === o} onclick={() => (s.missing = o)}>{o === 'none' ? 'nothing' : o}</button>
			{/each}
		</span>
	</div>
</div>

{#if df}
	<div class="pd-stage">
		<figure>
			<figcaption><code>df</code> <span class="muted">DataFrame {formatShape(df.shape)} · a dtype per column</span></figcaption>
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
		<p>
			An ndarray has <strong>one</strong> dtype. A DataFrame has <strong>one dtype per column</strong>
			({df.columns.map((c, j) => `${c}: ${df.dtypes[j]}`).join(', ')}): each column is stored as its own 1-D array.
			Text columns have the dtype <code>str</code> in pandas 3 (older pandas showed <code>object</code>).
		</p>
		{#if values && numbers}
			<p>
				<code>df.to_numpy()</code> has to put everything in one array, so it falls back to <code>{values.dtype}</code> — Python
				objects, slow and without vectorized math. Select the numeric columns first and you get a real
				<code>{numbers.dtype}</code> array (int64 and float64 meet at float64).
			</p>
		{/if}
		{#if missingCol >= 0 && before && after}
			<p>
				<strong>Missing value in <code>{s.missing}</code>:</strong>
				{#if before === after}
					the dtype stays <code>{after}</code>; the missing value is shown as <code>{df.values[MISSING_ROW * df.shape[1] + missingCol]}</code>.
				{:else}
					<code>{before}</code> → <code>{after}</code>.
					{#if before.startsWith('int') && after.startsWith('float')}
						Integers have no “missing” value, so pandas stores the column as floats and uses <code>NaN</code> (a float) for the gap.
					{:else if after === 'object'}
						A bool column cannot hold <code>None</code>, so pandas falls back to <code>object</code>: a column of Python objects.
					{/if}
				{/if}
			</p>
		{:else}
			<p class="muted">Put a missing value into a column and watch its dtype.</p>
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
