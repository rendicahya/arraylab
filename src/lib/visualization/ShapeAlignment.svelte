<script lang="ts">
	import type { Alignment } from '../array/broadcast';
	import { explainColumn } from '../array/broadcast';
	import { formatShape } from '../array/normalize';

	/** Right-aligned shape table showing NumPy's broadcasting rule column by column. */
	let { names, shapes, alignment }: { names: string[]; shapes: number[][]; alignment: Alignment } = $props();

	const width = $derived(alignment.columns.length);
	const SYMBOL = { equal: '✓ equal', stretch: '↔ 1 stretches', missing: '+ missing → 1', conflict: '✕ conflict' };
</script>

<div class="alignment" role="table" aria-label="Broadcasting shape alignment" style:--cols={width}>
	<div class="row head" role="row">
		<span role="columnheader" class="name"></span>
		<span role="columnheader" class="shape muted">shape</span>
		{#each alignment.columns as _, pos (pos)}
			<span role="columnheader" class="dim muted">axis {pos - width}</span>
		{/each}
	</div>
	{#each shapes as shape, i (i)}
		<div class="row" role="row">
			<span role="rowheader" class="name mono">{names[i]}</span>
			<span role="cell" class="shape mono">{formatShape(shape)}</span>
			{#each alignment.columns as col, pos (pos)}
				<span role="cell" class="dim mono {col.status}" class:pad={col.dims[i] === null} class:one={col.dims[i] === 1 && col.result !== 1}>
					{col.dims[i] ?? '·'}
				</span>
			{/each}
		</div>
	{/each}
	<div class="row verdict" role="row">
		<span role="rowheader" class="name mono">result</span>
		<span role="cell" class="shape mono">{alignment.resultShape ? formatShape(alignment.resultShape) : '—'}</span>
		{#each alignment.columns as col, pos (pos)}
			<span role="cell" class="dim mono {col.status}" title={explainColumn(col, names)}>
				{col.result ?? '✕'}
				<span class="sym">{SYMBOL[col.status]}</span>
			</span>
		{/each}
	</div>
	<p class="summary" class:bad={!alignment.compatible}>
		{#if alignment.compatible}
			✓ Compatible: every column is equal or has a 1 (or a missing dimension).
		{:else}
			✕ Incompatible: at least one column has two different sizes and neither is 1.
		{/if}
	</p>
</div>

<style>
	.alignment {
		display: inline-flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.6rem 0.8rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface-sunken);
		align-self: flex-start;
		max-width: 100%;
		overflow-x: auto;
	}
	.row {
		display: grid;
		grid-template-columns: 3.6rem 6.2rem repeat(var(--cols), 6.4rem);
		align-items: center;
		gap: 0.3rem;
	}
	.name {
		font-weight: 600;
	}
	.shape {
		font-size: 0.85rem;
	}
	.dim {
		text-align: center;
		font-size: 1rem;
		padding: 0.1rem 0.3rem;
		border-radius: 4px;
	}
	.head .dim {
		font-size: 0.68rem;
	}
	.dim.pad {
		color: var(--subtle);
	}
	.dim.one {
		color: var(--axis-mark);
		font-weight: 700;
		text-decoration: underline dotted;
	}
	.verdict {
		border-top: 1px solid var(--border-strong);
		padding-top: 0.2rem;
	}
	.verdict .dim {
		display: flex;
		flex-direction: column;
		font-weight: 700;
	}
	.sym {
		font-size: 0.66rem;
		font-weight: 600;
		font-family: var(--font-sans);
	}
	.verdict .equal .sym,
	.verdict .stretch .sym,
	.verdict .missing .sym {
		color: var(--success);
	}
	.verdict .conflict {
		color: var(--error);
		background: var(--error-soft);
	}
	.summary {
		margin: 0.3rem 0 0;
		font-size: 0.85rem;
		color: var(--success);
	}
	.summary.bad {
		color: var(--error);
	}
</style>
