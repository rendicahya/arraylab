<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title = 'What happened', children }: { title?: string; children: Snippet } = $props();
</script>

<section class="explain" aria-label={title}>
	<h3 class="eyebrow">{title}</h3>
	<div class="body">{@render children()}</div>
</section>

<style>
	.explain {
		border-left: 3px solid var(--accent);
		padding: 0.2rem 0 0.2rem 0.8rem;
		max-width: 48rem;
	}
	.body {
		font-size: 0.92rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: 0.25rem;
	}
	.body :global(p) {
		margin: 0;
	}
	.body :global(ul) {
		margin: 0;
		padding-left: 1.1rem;
	}
</style>
