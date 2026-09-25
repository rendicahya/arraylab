<script lang="ts" module>
	/** Per-cell decoration. Color is never the only signal: use `badge`/`mark` too. */
	export type CellDecor = {
		/** Categorical group (0–5 cycle) — e.g. which result element a cell feeds. */
		group?: number;
		state?: 'selected' | 'focus' | 'dim' | 'changed' | 'ghost';
		/** Short text shown in the cell corner, e.g. `r[1]`. */
		badge?: string;
		/** Extra tooltip text. */
		title?: string;
	};
</script>

<script lang="ts">
	import type { ArrayInfo } from '../array/types';
	import { axisRoles, flatIndex, formatCount, formatIndex } from '../array/normalize';

	type Props = {
		info: ArrayInfo;
		name?: string;
		decorate?: (flat: number) => CellDecor | undefined;
		/** Axis to draw collapse arrows along (reductions). */
		axisMark?: number | null;
		/** Mark every axis (axis=None reduction). */
		markAll?: boolean;
		onhover?: (flat: number | null) => void;
		onselect?: (flat: number, index: number[]) => void;
		/** Show the axis legend below the grid. */
		legend?: boolean;
		size?: 'normal' | 'small';
		label?: string;
	};

	let {
		info,
		name = info.name ?? 'a',
		decorate,
		axisMark = null,
		markAll = false,
		onhover,
		onselect,
		legend = true,
		size = 'normal',
		label
	}: Props = $props();

	const shape = $derived(info.shape);
	const ndim = $derived(info.ndim);
	const preview = $derived(info.previewShape ?? info.shape);
	const values = $derived(info.values ?? []);
	const roles = $derived(axisRoles(ndim));
	const rowAxis = $derived(ndim - 2);
	const colAxis = $derived(ndim - 1);
	const cellTag = $derived(onselect ? 'button' : 'div');

	function isMarked(axis: number): boolean {
		return markAll || axisMark === axis;
	}

	/** Index into the preview's flat value list. */
	function previewFlat(index: number[]): number {
		return flatIndex(index, preview);
	}

	function range(n: number): number[] {
		return Array.from({ length: n }, (_, i) => i);
	}

	function cellInfo(index: number[]) {
		const flat = flatIndex(index, shape);
		const value = values[previewFlat(index)] ?? '';
		const decor = decorate?.(flat);
		const title = `${formatIndex(name, index)} = ${value}${decor?.title ? `\n${decor.title}` : ''}`;
		return { flat, value, decor, title };
	}

	function blockTitle(prefix: number[]): string {
		const rest = Array(ndim - prefix.length).fill(':');
		return `${name}[${[...prefix, ...rest].join(', ')}]`;
	}

	function handleKey(event: KeyboardEvent) {
		if (!onselect) return;
		const el = event.target as HTMLElement;
		const flatAttr = el.dataset?.flat;
		if (flatAttr === undefined) return;
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [colAxis, -1],
			ArrowRight: [colAxis, 1],
			ArrowUp: [rowAxis, -1],
			ArrowDown: [rowAxis, 1]
		};
		const move = moves[event.key];
		if (!move || ndim === 0) return;
		const [axis, delta] = move;
		if (axis < 0) return;
		const index = (el.dataset.index ?? '').split(',').map(Number);
		index[axis] += delta;
		if (index[axis] < 0 || index[axis] >= preview[axis]) return;
		event.preventDefault();
		const target = el
			.closest('.array-grid')
			?.querySelector<HTMLElement>(`[data-flat="${flatIndex(index, shape)}"]`);
		target?.focus();
	}
</script>

{#snippet cell(index: number[])}
	{@const c = cellInfo(index)}
	<svelte:element
		this={cellTag}
		type={onselect ? 'button' : undefined}
		class="cell {c.decor?.state ?? ''}"
		class:grouped={c.decor?.group !== undefined}
		style:--g={c.decor?.group !== undefined ? `var(--g${c.decor.group % 6})` : null}
		style:--g-strong={c.decor?.group !== undefined ? `var(--g${c.decor.group % 6}-strong)` : null}
		data-flat={c.flat}
		data-index={index.join(',')}
		title={c.title}
		aria-label={onselect ? c.title : undefined}
		role={onselect ? undefined : 'gridcell'}
		onmouseenter={() => onhover?.(c.flat)}
		onmouseleave={() => onhover?.(null)}
		onfocus={() => onhover?.(c.flat)}
		onblur={() => onhover?.(null)}
		onclick={onselect ? () => onselect(c.flat, index) : undefined}
	>
		<span class="v">{c.value}</span>
		{#if c.decor?.badge}<span class="badge">{c.decor.badge}</span>{/if}
		{#if c.decor?.state === 'selected'}<span class="tick" aria-hidden="true">✓</span>{/if}
	</svelte:element>
{/snippet}

{#snippet grid2d(prefix: number[])}
	{@const rows = ndim >= 2 ? preview[rowAxis] : 1}
	{@const cols = ndim >= 1 ? preview[colAxis] : 1}
	{@const moreCols = ndim >= 1 && preview[colAxis] < shape[colAxis]}
	{@const moreRows = ndim >= 2 && preview[rowAxis] < shape[rowAxis]}
	<div
		class="grid2d"
		role="grid"
		aria-label={prefix.length ? blockTitle(prefix) : `${label ?? name}, shape ${shape.join(' × ') || 'scalar'}`}
		style:grid-template-columns="auto repeat({cols}, minmax(var(--cell-min), max-content)){moreCols ? ' auto' : ''}"
	>
		{#if ndim >= 1}
			<div class="corner" aria-hidden="true">
				{#if ndim === 1 && isMarked(colAxis)}<span class="arrow">→</span>{/if}
			</div>
			{#each range(cols) as j (j)}
				<div class="col-label" class:marked={isMarked(colAxis)} aria-hidden="true">
					{j}
					{#if ndim >= 2 && isMarked(rowAxis)}<span class="arrow down">↓</span>{/if}
				</div>
			{/each}
			{#if moreCols}<div class="col-label" aria-hidden="true">…</div>{/if}
		{/if}

		{#each range(rows) as i (i)}
			<div class="row-label" class:marked={ndim >= 2 && isMarked(rowAxis)} aria-hidden="true">
				{#if ndim >= 2}{i}{/if}
				{#if ndim >= 2 && isMarked(colAxis)}<span class="arrow">→</span>{/if}
			</div>
			{#each range(cols) as j (j)}
				{@render cell(ndim === 0 ? [] : ndim === 1 ? [j] : [...prefix, i, j])}
			{/each}
			{#if moreCols}
				<div class="more" title="{formatCount(shape[colAxis] - cols)} more columns not shown">⋯</div>
			{/if}
		{/each}
		{#if moreRows}
			<div></div>
			{#each range(cols) as j (j)}<div class="more" title="{formatCount(shape[rowAxis] - rows)} more rows not shown">⋮</div>{/each}
		{/if}
	</div>
{/snippet}

{#snippet block(prefix: number[])}
	{@const axis = prefix.length}
	{#if ndim - axis <= 2}
		{@render grid2d(prefix)}
	{:else}
		{@const horizontal = (ndim - axis) % 2 === 1}
		<div class="blocks" class:horizontal class:marked={isMarked(axis)}>
			{#each range(preview[axis]) as k (k)}
				{#if k > 0 && isMarked(axis)}
					<div class="block-arrow" aria-hidden="true">{horizontal ? '→' : '↓'}</div>
				{/if}
				<div class="block" class:marked={isMarked(axis)}>
					<div class="block-title mono">
						{blockTitle([...prefix, k])}
					</div>
					{@render block([...prefix, k])}
				</div>
			{/each}
			{#if preview[axis] < shape[axis]}
				<div class="more-blocks">+{formatCount(shape[axis] - preview[axis])} more along axis {axis}</div>
			{/if}
		</div>
	{/if}
{/snippet}

<div class="array-grid size-{size}" onkeydown={handleKey} role="presentation">
	{#if info.truncated}
		<p class="truncation" role="note">
			Array has {formatCount(info.size)} elements. Showing a {preview.join(' × ')} preview of
			{shape.join(' × ')}.
		</p>
	{/if}
	{#if ndim === 0}
		<div class="scalar">{@render cell([])}</div>
	{:else}
		{@render block([])}
	{/if}
	{#if legend && ndim > 0}
		<ul class="legend" aria-label="Axes">
			{#each roles as role, axis (axis)}
				<li class:marked={isMarked(axis)}>
					<span class="mono">axis {axis}</span>
					<span class="muted">{role} · length {shape[axis]}</span>
					<span class="arrow" aria-hidden="true"
						>{axis === colAxis ? '→' : axis === rowAxis ? '↓' : (ndim - axis) % 2 === 1 ? '→' : '↓'}</span
					>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.array-grid {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.6rem;
		max-width: 100%;
	}
	.size-small {
		--cell-min: 2.1rem;
		--cell-h: 1.9rem;
		--cell-font: 0.82rem;
	}
	.grid2d {
		display: grid;
		gap: 3px;
		align-items: stretch;
	}
	.corner,
	.col-label,
	.row-label {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--array-label);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		user-select: none;
	}
	.col-label {
		flex-direction: column;
		line-height: 1.1;
		padding-bottom: 1px;
	}
	.row-label {
		justify-content: flex-end;
		padding-right: 0.3rem;
		min-width: 1.1rem;
	}
	.marked {
		color: var(--axis-mark);
		font-weight: 700;
	}
	.arrow {
		color: var(--axis-mark);
		font-weight: 700;
		font-size: 0.95rem;
		line-height: 1;
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
			border-color 120ms ease,
			transform 120ms ease;
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
		transform: scale(1.06);
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
	.blocks {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.blocks.horizontal {
		flex-direction: row;
		flex-wrap: wrap;
		align-items: flex-start;
	}
	.block {
		padding: 0.45rem 0.55rem 0.55rem;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius);
	}
	.block.marked {
		border-color: var(--axis-mark);
		border-style: solid;
	}
	.block-title {
		font-size: 0.72rem;
		color: var(--array-label);
		margin-bottom: 0.3rem;
	}
	.block.marked > .block-title {
		color: var(--axis-mark);
		font-weight: 600;
	}
	.block-arrow {
		align-self: center;
		color: var(--axis-mark);
		font-weight: 700;
		font-size: 1.2rem;
	}
	.more-blocks {
		align-self: center;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.truncation {
		margin: 0;
		font-size: 0.8rem;
		color: var(--warning);
		background: var(--warning-soft);
		padding: 0.25rem 0.55rem;
		border-radius: var(--radius-sm);
	}
	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.9rem;
		font-size: 0.78rem;
	}
	.legend li {
		display: flex;
		gap: 0.35rem;
		align-items: center;
	}
	.legend li .arrow {
		font-size: 0.8rem;
		color: var(--subtle);
	}
	.legend li.marked,
	.legend li.marked .arrow {
		color: var(--axis-mark);
	}
	.legend li.marked .muted {
		color: var(--axis-mark);
	}
</style>
