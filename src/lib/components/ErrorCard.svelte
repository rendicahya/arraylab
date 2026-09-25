<script lang="ts">
	import Icon from './Icon.svelte';
	import { explainError } from '../array/errors';
	import type { PyError } from '../runtime/protocol';

	let { error, diagram = true }: { error: PyError; diagram?: boolean } = $props();
	const ex = $derived(explainError(error));
</script>

<div class="error-card" role="alert">
	<div class="head">
		<Icon name="alert" size={18} />
		<strong>{ex.title}</strong>
	</div>
	{#each ex.details as d, i (i)}<p>{d}</p>{/each}
	{#if diagram && ex.diagram}<pre class="diagram">{ex.diagram}</pre>{/if}
	{#if ex.hint}<p class="hint"><strong>Try:</strong> {ex.hint}</p>{/if}
	<details>
		<summary>Original Python error</summary>
		<pre>{error.traceback || `${error.type}: ${error.message}`}</pre>
	</details>
</div>

<style>
	.error-card {
		border: 1px solid var(--error);
		border-left-width: 4px;
		background: var(--error-soft);
		border-radius: var(--radius);
		padding: 0.65rem 0.85rem;
		font-size: 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		max-width: 46rem;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--error);
	}
	.head strong {
		color: var(--foreground);
	}
	p {
		margin: 0;
	}
	.hint {
		color: var(--foreground);
	}
	pre {
		margin: 0;
		font-size: 0.82rem;
		white-space: pre-wrap;
		word-break: break-word;
	}
	.diagram {
		background: var(--surface);
		padding: 0.45rem 0.6rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		white-space: pre;
		overflow-x: auto;
	}
	details summary {
		cursor: pointer;
		color: var(--muted);
		font-size: 0.82rem;
	}
	details pre {
		margin-top: 0.3rem;
		color: var(--muted);
	}
</style>
