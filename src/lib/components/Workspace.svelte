<script lang="ts">
	import type { Snippet } from 'svelte';
	import SourceInput from './SourceInput.svelte';
	import Inspector from './Inspector.svelte';
	import CodePanel from './CodePanel.svelte';
	import ArrayView from '../visualization/ArrayView.svelte';
	import AxisView from '../visualization/AxisView.svelte';
	import IndexView from '../visualization/IndexView.svelte';
	import ReshapeView from '../visualization/ReshapeView.svelte';
	import BroadcastView from '../visualization/BroadcastView.svelte';
	import VectorizeView from '../visualization/VectorizeView.svelte';
	import DtypeView from '../visualization/DtypeView.svelte';
	import CodeResultView from '../visualization/CodeResultView.svelte';
	import TorchView from '../visualization/TorchView.svelte';
	import AutogradView from '../visualization/AutogradView.svelte';
	import PandasView from '../visualization/pandas/PandasView.svelte';
	import FrameInspector from './FrameInspector.svelte';
	import { pandasUsesSource } from '../lab/codegen';
	import type { Lab } from '../lab/lab.svelte';
	import { TOOLS } from '../lab/types';
	import { isFrameInfo, type ArrayInfo, type FrameInfo } from '../array/types';

	/**
	 * The lab layout: optional lesson column, visualization, inspector and code panel.
	 * The same layout is used in normal and fullscreen mode.
	 */
	let { lab, left }: { lab: Lab; left?: Snippet } = $props();

	// The lab passed in never changes for the lifetime of the workspace.
	// svelte-ignore state_referenced_locally
	lab.connect();

	const tool = $derived(lab.settings.tool);

	/** The tab row is one line that scrolls when narrow: keep the active tab in view. */
	let tabRow = $state<HTMLElement>();
	let tabRowWidth = $state(0);
	/** Hidden tabs on either side: shown as a fade at that edge. */
	let hiddenLeft = $state(false);
	let hiddenRight = $state(false);
	function measureTabs() {
		const row = tabRow;
		if (!row) return;
		hiddenLeft = row.scrollLeft > 1;
		hiddenRight = row.scrollLeft + row.clientWidth < row.scrollWidth - 1;
	}
	$effect(() => {
		void tabRowWidth;
		measureTabs();
	});
	$effect(() => {
		void tool;
		const row = tabRow;
		const tab = row?.querySelector<HTMLElement>('[aria-selected="true"]');
		if (!row || !tab) return;
		const left = tab.offsetLeft - row.offsetLeft;
		const clear = 40; // keep it out of the edge fade
		if (left < row.scrollLeft + clear) row.scrollLeft = left - clear;
		else if (left + tab.offsetWidth > row.scrollLeft + row.clientWidth - clear) {
			row.scrollLeft = left + tab.offsetWidth - row.clientWidth + clear;
		}
	});

	const showSource = $derived(
		tool !== 'code' && tool !== 'autograd' && (tool !== 'pandas' || pandasUsesSource(lab.settings.pandas.view))
	);

	/** DataFrames and Series shown in the inspector. */
	const frames = $derived.by((): { name: string; info: FrameInfo }[] => {
		if (tool === 'code') {
			const v = lab.scratchView;
			return v && isFrameInfo(v) ? [{ name: v.name ?? 'value', info: v }] : [];
		}
		if (tool !== 'pandas' || !lab.resultFor('pandas')) return [];
		const out: { name: string; info: FrameInfo }[] = [];
		for (const name of ['df', 's1', 's2', 'result']) {
			const f = lab.frame(name);
			if (f) out.push({ name, info: f });
		}
		return out;
	});

	const inspected = $derived.by((): { name: string; info: ArrayInfo }[] => {
		if (tool === 'code') {
			const v = lab.scratchView;
			return v && !isFrameInfo(v) ? [{ name: v.name ?? 'value', info: v }] : [];
		}
		if (tool === 'pandas') {
			const fresh = lab.resultFor('pandas');
			const a = showSource ? (fresh ? lab.target('a') : lab.provisional) : null;
			const result = fresh ? lab.target('result') : null;
			return [...(a ? [{ name: 'a', info: a }] : []), ...(result ? [{ name: 'result', info: result }] : [])];
		}
		const fresh = lab.resultFor(tool);
		if (tool === 'autograd') {
			const loss = fresh ? lab.target('loss') : null;
			return loss ? [{ name: 'loss', info: loss }] : [];
		}
		const out: { name: string; info: ArrayInfo }[] = [];
		const a = fresh ? lab.target('a') : lab.provisional;
		if (a) out.push({ name: 'a', info: a });
		if (!fresh) return out;
		for (const name of ['b', 'result', 'vec_result']) {
			const t = lab.target(name);
			if (t) out.push({ name, info: t });
		}
		return out;
	});
</script>

<div class="workspace" class:has-left={!!left}>
	{#if left}
		<aside class="left" aria-label="Lesson">{@render left()}</aside>
	{/if}

	<section class="center" aria-label="Array lab">
		{#if showSource}
			<div class="source-wrap"><SourceInput {lab} /></div>
		{/if}
		<div
			class="tool-tabs"
			class:fade-left={hiddenLeft}
			class:fade-right={hiddenRight}
			role="tablist"
			aria-label="Tools"
			bind:this={tabRow}
			bind:clientWidth={tabRowWidth}
			onscroll={measureTabs}
		>
			{#each TOOLS as t, i (t.id)}
				{#if i > 0 && TOOLS[i - 1].group !== t.group}<span class="sep" aria-hidden="true"></span>{/if}
				<button
					type="button"
					role="tab"
					aria-selected={tool === t.id}
					title={t.description}
					onclick={() => (lab.settings.tool = t.id)}>{t.label}</button
				>
			{/each}
		</div>
		<div class="tool-body" role="tabpanel" aria-label={TOOLS.find((t) => t.id === tool)?.description}>
			{#if tool === 'array'}<ArrayView {lab} />
			{:else if tool === 'axis'}<AxisView {lab} />
			{:else if tool === 'index'}<IndexView {lab} />
			{:else if tool === 'reshape'}<ReshapeView {lab} />
			{:else if tool === 'broadcast'}<BroadcastView {lab} />
			{:else if tool === 'vectorize'}<VectorizeView {lab} />
			{:else if tool === 'dtype'}<DtypeView {lab} />
			{:else if tool === 'torch'}<TorchView {lab} />
			{:else if tool === 'autograd'}<AutogradView {lab} />
			{:else if tool === 'pandas'}<PandasView {lab} />
			{:else}<CodeResultView {lab} />{/if}
		</div>
	</section>

	<aside class="right" aria-label="Inspector">
		<h2 class="eyebrow">Inspector</h2>
		{#each inspected as item, i (item.name)}
			<Inspector
				info={item.info}
				name={item.name}
				showNote={inspected.findIndex((x) => x.info.dtype === 'int32') === i}
			/>
		{/each}
		{#each frames as item (item.name)}
			<FrameInspector info={item.info} name={item.name} />
		{/each}
		{#if !inspected.length && !frames.length}
			<p class="muted small">Array properties appear here.</p>
		{/if}
	</aside>

	<div class="bottom"><CodePanel {lab} /></div>
</div>

<style>
	.workspace {
		/* Explicit height (not flex: 1): the parent column has no definite height. */
		flex: none;
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 270px;
		grid-template-rows: minmax(0, 1fr) auto;
		grid-template-areas:
			'center right'
			'bottom bottom';
		height: calc(100dvh - var(--header-h));
		/* Short laptop screens give the visualization more of the height. */
		--code-h: clamp(180px, 28dvh, 280px);
	}
	.workspace.has-left {
		grid-template-columns: clamp(270px, 21vw, 320px) minmax(0, 1fr) 270px;
		grid-template-areas:
			'left center right'
			'bottom bottom bottom';
	}
	.left {
		grid-area: left;
		border-right: 1px solid var(--border);
		background: var(--surface);
		overflow: auto;
		min-height: 0;
	}
	.center {
		grid-area: center;
		overflow: auto;
		min-height: 0;
		min-width: 0;
		padding: 0.9rem 1.2rem 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		container: center / inline-size;
	}
	.right {
		grid-area: right;
		border-left: 1px solid var(--border);
		background: var(--surface);
		overflow: auto;
		min-height: 0;
		padding: 0.8rem 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.bottom {
		grid-area: bottom;
		min-height: 0;
	}
	.source-wrap {
		padding-bottom: 0.7rem;
		border-bottom: 1px dashed var(--border);
	}
	/* One line: wrapping to a second row pushes the visualization down on laptops. */
	.tool-tabs {
		display: flex;
		align-items: center;
		gap: 0.18rem;
		flex: none;
		overflow-x: auto;
		scrollbar-width: thin;
		padding-bottom: 2px;
	}
	.tool-tabs.fade-right {
		mask-image: linear-gradient(to right, #000 calc(100% - 2.5rem), transparent);
	}
	.tool-tabs.fade-left {
		mask-image: linear-gradient(to left, #000 calc(100% - 2.5rem), transparent);
	}
	.tool-tabs.fade-left.fade-right {
		mask-image: linear-gradient(to right, transparent, #000 2.5rem, #000 calc(100% - 2.5rem), transparent);
	}
	.tool-tabs .sep {
		flex: none;
		width: 1px;
		height: 1.1rem;
		margin: 0 0.15rem;
		background: var(--border-strong);
	}
	.tool-tabs button {
		flex: none;
		white-space: nowrap;
		border: 1px solid var(--border);
		background: var(--surface);
		border-radius: 999px;
		padding: 0.2rem 0.5rem;
		cursor: pointer;
		font-size: 0.82rem;
		color: var(--muted);
		font-weight: 500;
	}
	.tool-tabs button:hover {
		color: var(--foreground);
		border-color: var(--border-strong);
	}
	.tool-tabs button[aria-selected='true'] {
		background: var(--foreground);
		border-color: var(--foreground);
		color: var(--background);
	}
	.tool-body {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.small {
		font-size: 0.85rem;
	}
	/* Wide visualization area: larger cells instead of empty space. */
	@container center (min-width: 720px) {
		.tool-body {
			--cell-font: 1.08rem;
			--cell-min: 3rem;
			--cell-h: 2.65rem;
		}
	}
	@container center (min-width: 1000px) {
		.tool-body {
			--cell-font: 1.18rem;
			--cell-min: 3.3rem;
			--cell-h: 2.9rem;
		}
	}
	/* Short laptop screens (e.g. 1366 × 768): more height for the visualization. */
	@media (max-height: 820px) {
		.workspace {
			--code-h: clamp(160px, 25dvh, 240px);
		}
		.center {
			padding-top: 0.6rem;
			gap: 0.6rem;
		}
	}
	:global(:root[data-fullscreen='true']) .workspace {
		--code-h: clamp(170px, 25dvh, 260px);
	}
	:global(:root[data-fullscreen='true']) .center {
		padding: 0.6rem 0.9rem;
	}
	@media (max-width: 1180px) {
		.workspace.has-left {
			grid-template-columns: 270px minmax(0, 1fr);
			grid-template-rows: minmax(0, 1fr) auto auto;
			grid-template-areas:
				'left center'
				'left right'
				'bottom bottom';
		}
		.workspace:not(.has-left) {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: minmax(0, 1fr) auto auto;
			grid-template-areas: 'center' 'right' 'bottom';
		}
		.right {
			border-left: none;
			border-top: 1px solid var(--border);
			flex-direction: row;
			flex-wrap: wrap;
			max-height: 220px;
		}
		.right > :global(*) {
			flex: 1 1 220px;
		}
		.right h2 {
			flex-basis: 100%;
		}
	}
	@media (max-width: 800px) {
		.workspace,
		.workspace.has-left {
			display: flex;
			flex-direction: column;
			height: auto;
		}
		.left,
		.right {
			border: none;
			border-bottom: 1px solid var(--border);
			max-height: none;
		}
		.center {
			overflow: visible;
			padding: 0.8rem;
		}
		.bottom {
			--code-h: 420px;
		}
	}
</style>
