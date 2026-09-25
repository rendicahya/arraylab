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
	import type { Lab } from '../lab/lab.svelte';
	import { TOOLS } from '../lab/types';
	import type { ArrayInfo } from '../array/types';

	/**
	 * The lab layout: optional lesson column, visualization, inspector and code panel.
	 * The same layout is used in normal and fullscreen mode.
	 */
	let { lab, left }: { lab: Lab; left?: Snippet } = $props();

	// The lab passed in never changes for the lifetime of the workspace.
	// svelte-ignore state_referenced_locally
	lab.connect();

	const tool = $derived(lab.settings.tool);

	const inspected = $derived.by((): { name: string; info: ArrayInfo }[] => {
		if (tool === 'code') return lab.scratchView ? [{ name: lab.scratchView.name ?? 'value', info: lab.scratchView }] : [];
		const fresh = lab.resultFor(tool);
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
		{#if tool !== 'code'}
			<div class="source-wrap"><SourceInput {lab} /></div>
		{/if}
		<div class="tool-tabs" role="tablist" aria-label="Tools">
			{#each TOOLS as t (t.id)}
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
		{:else}
			<p class="muted small">Array properties appear here.</p>
		{/each}
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
	}
	.workspace.has-left {
		grid-template-columns: 310px minmax(0, 1fr) 270px;
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
	.tool-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.tool-tabs button {
		border: 1px solid var(--border);
		background: var(--surface);
		border-radius: 999px;
		padding: 0.25rem 0.8rem;
		cursor: pointer;
		font-size: 0.88rem;
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
	:global(:root[data-fullscreen='true']) .workspace {
		--code-h: 230px;
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
