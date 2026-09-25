<script lang="ts">
	import Icon from './Icon.svelte';
	import { theme } from './theme.svelte';

	const next = $derived(theme.current === 'dark' ? 'light' : 'dark');
	const label = $derived(`Switch to ${next} mode`);
</script>

<button class="btn ghost icon-btn" type="button" onclick={() => theme.toggle()} aria-label={label} title={label}>
	<Icon name={theme.current === 'dark' ? 'moon' : 'sun'} />
	<span class="text">{theme.current === 'dark' ? 'Dark' : 'Light'}</span>
</button>

<style>
	.icon-btn {
		padding: 0.35rem 0.55rem;
	}
	.text {
		font-size: 0.85rem;
		color: var(--muted);
	}
	@media (max-width: 640px) {
		.text {
			display: none;
		}
	}
</style>
