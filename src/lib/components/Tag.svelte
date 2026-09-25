<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		tone = 'neutral',
		title,
		children
	}: { tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'error'; title?: string; children: Snippet } =
		$props();
</script>

<span class="tag {tone}" {title}>{@render children()}</span>

<style>
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		border: 1px solid var(--border-strong);
		color: var(--muted);
		background: var(--surface);
		white-space: nowrap;
	}
	.accent {
		color: var(--accent);
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.success {
		color: var(--success);
		border-color: var(--success);
		background: var(--success-soft);
	}
	.warning {
		color: var(--warning);
		border-color: var(--warning);
		background: var(--warning-soft);
	}
	.error {
		color: var(--error);
		border-color: var(--error);
		background: var(--error-soft);
	}
</style>
