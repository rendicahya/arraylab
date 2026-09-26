<script lang="ts">
	import { untrack } from 'svelte';
	import RunStatus from '../../components/RunStatus.svelte';
	import FrameBasics from './FrameBasics.svelte';
	import PandasDtypes from './PandasDtypes.svelte';
	import PandasAxis from './PandasAxis.svelte';
	import PandasSelect from './PandasSelect.svelte';
	import PandasAlign from './PandasAlign.svelte';
	import type { Lab } from '../../lab/lab.svelte';
	import type { PandasView } from '../../lab/types';
	import { pandasUsesSource } from '../../lab/codegen';
	import { fitLabels, frameShape, parseLabels } from '../../pandas/codegen';
	import { PANDAS_VERSION } from '../../runtime/config';

	let { lab }: { lab: Lab } = $props();

	const VIEWS: { id: PandasView; label: string }[] = [
		{ id: 'frame', label: 'DataFrame' },
		{ id: 'dtypes', label: 'dtype per column' },
		{ id: 'axis', label: 'axis' },
		{ id: 'select', label: 'loc / iloc' },
		{ id: 'align', label: 'Alignment' }
	];

	const s = $derived(lab.settings.pandas);
	const a = $derived(lab.resultFor('pandas') ? lab.target('a') : null);
	const shape = $derived(a && a.dtype !== '…' ? a.shape : (lab.provisional?.shape ?? null));
	const shapeKey = $derived(shape ? shape.join('×') : '');

	// When the array changes shape, extend or trim the typed labels to fit it
	// (A B C → A B for two columns). Only on shape changes, never while typing.
	let fittedFor = '';
	$effect(() => {
		const key = shapeKey;
		if (!key || key === fittedFor || !pandasUsesSource(s.view)) return;
		fittedFor = key;
		const fit = shape ? frameShape(shape) : null;
		if (!fit) return;
		untrack(() => {
			const index = parseLabels(s.index);
			const columns = parseLabels(s.columns);
			if (index.ok) {
				const next = fitLabels(index.value, fit[0], 'index');
				if (next.length !== index.value.length) s.index = next.join(' ');
			}
			if (columns.ok) {
				const next = fitLabels(columns.value, fit[1], 'columns');
				if (next.length !== columns.value.length) s.columns = next.join(' ');
			}
		});
	});
</script>

<div class="pandas">
	<div class="controls">
		<span class="segmented" role="group" aria-label="pandas view">
			{#each VIEWS as v (v.id)}
				<button type="button" aria-pressed={s.view === v.id} onclick={() => (s.view = v.id)}>{v.label}</button>
			{/each}
		</span>
		<span class="real muted" title="pandas is downloaded the first time this tool runs (≈ 5 MB), then cached.">
			real pandas {PANDAS_VERSION} · runs here
		</span>
	</div>

	<RunStatus {lab} />

	{#if s.view === 'frame'}<FrameBasics {lab} />
	{:else if s.view === 'dtypes'}<PandasDtypes {lab} />
	{:else if s.view === 'axis'}<PandasAxis {lab} />
	{:else if s.view === 'select'}<PandasSelect {lab} />
	{:else}<PandasAlign {lab} />{/if}
</div>

<style>
	.pandas {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.real {
		font-size: 0.78rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.05rem 0.55rem;
	}
	/* Shared by the pandas sub-views. */
	.pandas :global(.pd-row) {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.6rem 1.2rem;
	}
	.pandas :global(.pd-field) {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.pandas :global(.pd-stage) {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem 1.5rem;
		overflow: auto;
		padding: 0.5rem 0.2rem;
	}
	.pandas :global(.pd-stage figure) {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.pandas :global(.pd-stage figcaption) {
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.pandas :global(.pd-op) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		font-size: 0.8rem;
		color: var(--muted);
		max-width: 16rem;
		text-align: center;
	}
	.pandas :global(.pd-arrow) {
		font-size: 1.6rem;
		color: var(--axis-mark);
		line-height: 1;
	}
	.pandas :global(.pd-chips) {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.pandas :global(.pd-chip) {
		border: 1px solid var(--border-strong);
		background: var(--surface);
		border-radius: 999px;
		padding: 0.1rem 0.55rem;
		font-size: 0.8rem;
		font-family: var(--font-mono);
		cursor: pointer;
		color: var(--foreground);
	}
	.pandas :global(.pd-chip:hover) {
		border-color: var(--accent);
	}
	.pandas :global(.pd-chip[aria-pressed='true']) {
		background: var(--accent-soft);
		border-color: var(--accent);
		color: var(--accent-strong);
		font-weight: 600;
	}
	.pandas :global(.pd-input) {
		font-family: var(--font-mono);
		font-size: 0.95rem;
	}
	.pandas :global(.pd-small) {
		font-size: 0.82rem;
		margin: 0;
	}
	.pandas :global(.pd-formula) {
		margin: 0;
		min-height: 1.6em;
		font-size: 0.95rem;
	}
</style>
