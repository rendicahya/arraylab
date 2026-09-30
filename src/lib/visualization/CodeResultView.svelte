<script lang="ts">
	import ArrayGrid from './ArrayGrid.svelte';
	import ShapeView from './ShapeView.svelte';
	import FrameTable from './FrameTable.svelte';
	import { isFrameInfo } from '../array/types';
	import ErrorCard from '../components/ErrorCard.svelte';
	import RichText from '../components/RichText.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { formatShape } from '../array/normalize';
	import { tCodeResult } from '../i18n/viz/viewsCombineCode';

	/** Visualizes arrays produced by the learner's own code in the editor. */
	let { lab }: { lab: Lab } = $props();

	const r = $derived(lab.scratchResult);
	const view = $derived(lab.scratchView);
	const other = $derived(r?.result && r.result.kind === 'other' ? r.result : null);
</script>

{#if lab.runtimeError && !r}
	<p class="stopped" role="status">
		<strong>{tCodeResult().stopped}</strong> {lab.runtimeError} {tCodeResult().stoppedRest}
	</p>
{/if}
{#if !r}
	<div class="empty">
		<p><strong>{tCodeResult().emptyTitle}</strong> ({tCodeResult().emptyOr} <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd>).</p>
		<p class="muted"><RichText text={tCodeResult().emptyBody} /></p>
	</div>
{:else}
	{#if r.error}<ErrorCard error={r.error} />{/if}
	{#if r.variables?.length}
		<div class="vars" role="group" aria-label={tCodeResult().variablesAria}>
			<span class="eyebrow">{tCodeResult().variables}</span>
			{#each r.variables as v (v.name)}
				<button
					type="button"
					class="chip mono"
					aria-pressed={view?.name === v.name}
					onclick={() => lab.showVariable(v.name!)}
				>
					{v.name} <span class="muted">{formatShape(v.shape)}</span>
				</button>
			{/each}
		</div>
	{/if}
	{#if other}
		<div class="value">
			<span class="eyebrow">{tCodeResult().lastExpression}</span>
			<pre class="mono">{other.repr}</pre>
			<span class="muted small">{tCodeResult().type} <code>{other.pythonType}</code></span>
		</div>
	{/if}
	{#if view && isFrameInfo(view)}
		<p class="small muted"><code>{view.name}</code> · {view.pythonType} · shape {formatShape(view.shape)}</p>
		<div class="stage"><FrameTable info={view} name={view.name} /></div>
	{:else if view}
		<ShapeView info={view} name={view.name} />
		<div class="stage"><ArrayGrid info={view} name={view.name} /></div>
	{/if}
{/if}

<style>
	.stopped {
		margin: 0;
		padding: 0.45rem 0.7rem;
		border: 1px solid var(--warning);
		background: var(--warning-soft);
		border-radius: var(--radius);
		font-size: 0.88rem;
	}
	.empty p {
		margin: 0 0 0.4rem;
	}
	kbd {
		border: 1px solid var(--border-strong);
		border-bottom-width: 2px;
		border-radius: 4px;
		padding: 0 0.3rem;
		font-size: 0.8rem;
	}
	.vars {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
	}
	.chip {
		border: 1px solid var(--border-strong);
		background: var(--surface);
		border-radius: 999px;
		padding: 0.1rem 0.6rem;
		font-size: 0.82rem;
		cursor: pointer;
	}
	.chip[aria-pressed='true'] {
		background: var(--accent-soft);
		border-color: var(--accent);
	}
	.value pre {
		margin: 0.2rem 0;
		font-size: 1rem;
		white-space: pre-wrap;
	}
	.small {
		font-size: 0.8rem;
	}
	.stage {
		overflow: auto;
		padding: 0.5rem 0.2rem;
	}
</style>
