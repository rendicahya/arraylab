<script lang="ts">
	import type { CellDecor } from './ArrayGrid.svelte';
	import type { FrameInfo } from '../array/types';
	import { formatCount } from '../array/normalize';

	/**
	 * A DataFrame (or Series, as one column) drawn as a grid of values framed by
	 * its labels. Labels are styled differently from values on purpose: they are
	 * not part of the data (df.to_numpy() has only the values).
	 */
	type Props = {
		info: FrameInfo;
		name?: string;
		decorate?: (row: number, col: number) => CellDecor | undefined;
		/** 0: arrows down every column (reduce with axis=0); 1: arrows along every row. */
		axisMark?: 0 | 1 | null;
		onhover?: (row: number | null, col: number | null) => void;
		onselect?: (row: number, col: number) => void;
		/** Show each column's dtype under its label. */
		dtypes?: boolean;
		/** Show positions (0, 1, 2 …) next to the labels. */
		positions?: boolean;
		/** Label cells to emphasize, e.g. the ones a selection used. */
		hitRows?: Set<number>;
		hitCols?: Set<number>;
		/** Decoration for the dtype cell of a column (e.g. a dtype that changed). */
		dtypeNote?: (col: number) => string | undefined;
	};

	let {
		info,
		name = info.name ?? 'df',
		decorate,
		axisMark = null,
		onhover,
		onselect,
		dtypes = false,
		positions = true,
		hitRows,
		hitCols,
		dtypeNote
	}: Props = $props();

	const rows = $derived(info.previewShape[0]);
	const cols = $derived(info.previewShape[1]);
	const series = $derived(info.kind === 'series');
	const moreRows = $derived(info.shape[0] - rows);
	const moreCols = $derived(series ? 0 : info.shape[1] - cols);
	const cellTag = $derived(onselect ? 'button' : 'div');

	function range(n: number): number[] {
		return Array.from({ length: n }, (_, i) => i);
	}

	function quote(label: string, kind: string): string {
		return kind === 'O' ? `'${label}'` : label;
	}

	function cellTitle(i: number, j: number, value: string, decor?: CellDecor): string {
		const row = quote(info.index[i], info.indexKind);
		const at = series
			? `${name}.loc[${row}]  (position ${i})`
			: `${name}.loc[${row}, ${quote(info.columns[j], info.columnsKind)}]  (position ${i}, ${j})`;
		return `${at} = ${value}${decor?.title ? `\n${decor.title}` : ''}`;
	}
</script>

<div class="frame-table">
	{#if info.truncated}
		<p class="truncation" role="note">
			{series ? 'Series' : 'DataFrame'} has {formatCount(info.shape[0])} rows{series ? '' : ` × ${formatCount(info.shape[1])} columns`}.
			Showing the first {rows}{series ? '' : ` × ${cols}`}.
		</p>
	{/if}
	<div
		class="grid"
		role="grid"
		aria-label="{name}: {series ? 'Series' : 'DataFrame'} with {info.shape[0]} rows{series ? '' : ` and ${info.shape[1]} columns`}"
		style:grid-template-columns="auto repeat({cols}, minmax(var(--cell-min), max-content)){moreCols ? ' auto' : ''}"
	>
		<div class="corner" aria-hidden="true"></div>
		{#each range(cols) as j (j)}
			<div
				class="lab col"
				class:empty={!info.columns[j] && series}
				class:hit={hitCols?.has(j)}
				class:marked={axisMark === 0}
				role="columnheader"
				title={series && !info.columns[j] ? 'This Series has no name' : undefined}
			>
				<span class="l">{info.columns[j]}</span>
				{#if positions && !series}<span class="pos" title="position {j}">{j}</span>{/if}
				{#if axisMark === 0}<span class="arrow" aria-hidden="true">↓</span>{/if}
			</div>
		{/each}
		{#if moreCols}<div class="more" title="{moreCols} more columns">⋯</div>{/if}

		{#if dtypes}
			<div class="dt-label" aria-hidden="true">dtype</div>
			{#each range(cols) as j (j)}
				{@const note = dtypeNote?.(j)}
				<div class="dt mono" class:changed={!!note} title={note}>{info.dtypes[j]}{#if note}<span class="flag" aria-hidden="true">▲</span>{/if}</div>
			{/each}
			{#if moreCols}<div></div>{/if}
		{/if}

		{#each range(rows) as i (i)}
			<div class="lab row" class:hit={hitRows?.has(i)} class:marked={axisMark === 1} role="rowheader">
				<span class="l">{info.index[i]}</span>
				{#if positions && info.indexType !== 'RangeIndex'}<span class="pos" title="position {i}">{i}</span>{/if}
				{#if axisMark === 1}<span class="arrow" aria-hidden="true">→</span>{/if}
			</div>
			{#each range(cols) as j (j)}
				{@const value = info.values[i * cols + j] ?? ''}
				{@const decor = decorate?.(i, j)}
				{@const title = cellTitle(i, j, value, decor)}
				<svelte:element
					this={cellTag}
					type={onselect ? 'button' : undefined}
					class="cell {decor?.state ?? ''}"
					class:grouped={decor?.group !== undefined}
					class:missing={value === 'NaN' || value === 'None' || value === '<NA>'}
					style:--g={decor?.group !== undefined ? `var(--g${decor.group % 6})` : null}
					style:--g-strong={decor?.group !== undefined ? `var(--g${decor.group % 6}-strong)` : null}
					role={onselect ? undefined : 'gridcell'}
					aria-label={onselect ? title : undefined}
					{title}
					onmouseenter={() => onhover?.(i, j)}
					onmouseleave={() => onhover?.(null, null)}
					onfocus={() => onhover?.(i, j)}
					onblur={() => onhover?.(null, null)}
					onclick={onselect ? () => onselect(i, j) : undefined}
				>
					<span class="v">{value}</span>
					{#if decor?.badge}<span class="badge">{decor.badge}</span>{/if}
					{#if decor?.state === 'selected'}<span class="tick" aria-hidden="true">✓</span>{/if}
				</svelte:element>
			{/each}
			{#if moreCols}<div class="more">⋯</div>{/if}
		{/each}
		{#if moreRows > 0}
			<div class="more">⋮</div>
			{#each range(cols) as j (j)}<div class="more" title="{moreRows} more rows">⋮</div>{/each}
		{/if}
	</div>
</div>

<style>
	.frame-table {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		max-width: 100%;
	}
	.grid {
		display: grid;
		gap: 3px;
		align-items: stretch;
	}
	.lab {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.1rem 0.45rem;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--foreground);
		background: var(--surface-sunken);
		border: 1.5px solid var(--border-strong);
		border-radius: 4px;
		white-space: nowrap;
	}
	.lab.row {
		justify-content: flex-end;
	}
	.lab.empty {
		background: transparent;
		border-color: transparent;
		min-height: 0.5rem;
	}
	.lab .pos {
		font-size: 0.66rem;
		font-weight: 500;
		color: var(--subtle);
		border: 1px solid var(--border);
		border-radius: 3px;
		padding: 0 0.2rem;
		line-height: 1.3;
	}
	.lab.hit {
		border-color: var(--array-cell-highlight-border);
		background: var(--array-cell-highlight);
	}
	.lab.marked {
		color: var(--axis-mark);
		border-color: var(--axis-mark);
	}
	.arrow {
		color: var(--axis-mark);
		font-weight: 700;
		font-size: 0.95rem;
		line-height: 1;
	}
	.dt-label,
	.dt {
		font-size: 0.7rem;
		color: var(--muted);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
	}
	.dt-label {
		justify-content: flex-end;
		padding-right: 0.3rem;
		font-style: italic;
	}
	.dt.changed {
		color: var(--axis-mark);
		font-weight: 700;
	}
	.flag {
		font-size: 0.6rem;
	}
	.cell {
		position: relative;
		min-width: var(--cell-min);
		height: var(--cell-h);
		padding: 0 0.55rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
		font-size: var(--cell-font);
		font-variant-numeric: tabular-nums;
		background: var(--array-cell);
		border: 1.5px solid var(--array-cell-border);
		border-radius: 4px;
		color: var(--foreground);
		white-space: nowrap;
		transition:
			background-color 120ms ease,
			opacity 120ms ease,
			border-color 120ms ease;
	}
	.cell.missing .v {
		color: var(--muted);
		font-style: italic;
	}
	button.cell {
		cursor: pointer;
	}
	button.cell:hover {
		border-color: var(--accent);
	}
	.cell.grouped {
		background: var(--g);
		border-color: var(--g-strong);
	}
	.cell.selected {
		background: var(--array-cell-highlight);
		border: 2.5px solid var(--array-cell-highlight-border);
		font-weight: 700;
	}
	.cell.focus {
		border: 2.5px solid var(--g-strong, var(--array-cell-highlight-border));
		font-weight: 700;
		z-index: 1;
	}
	.cell.dim {
		opacity: var(--array-cell-dim);
	}
	.cell.changed {
		border-style: dashed;
		border-width: 2px;
		border-color: var(--axis-mark);
	}
	.cell.ghost {
		border-style: dashed;
		background: transparent;
		color: var(--muted);
	}
	.badge {
		position: absolute;
		top: -0.55em;
		right: -0.35em;
		font-size: 0.6rem;
		line-height: 1;
		padding: 0.12em 0.3em;
		border-radius: 3px;
		background: var(--surface-elevated);
		border: 1px solid var(--g-strong, var(--border-strong));
		color: var(--g-strong, var(--muted));
		font-weight: 600;
		pointer-events: none;
		white-space: nowrap;
	}
	.tick {
		position: absolute;
		top: -0.6em;
		left: -0.4em;
		font-size: 0.65rem;
		background: var(--array-cell-highlight-border);
		color: var(--surface);
		border-radius: 50%;
		width: 1.25em;
		height: 1.25em;
		display: grid;
		place-items: center;
		font-weight: 700;
	}
	.more {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--muted);
		font-family: var(--font-mono);
	}
	.truncation {
		margin: 0;
		font-size: 0.8rem;
		color: var(--warning);
		background: var(--warning-soft);
		padding: 0.25rem 0.55rem;
		border-radius: var(--radius-sm);
	}
</style>
