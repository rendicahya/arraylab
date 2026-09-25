<script lang="ts">
	import Icon from './Icon.svelte';
	import { fullscreen } from './fullscreen.svelte';

	const label = $derived(
		!fullscreen.supported
			? 'Fullscreen is not available in this browser'
			: fullscreen.active
				? 'Exit fullscreen'
				: 'Enter fullscreen'
	);
</script>

<button
	class="btn ghost icon-btn"
	type="button"
	onclick={() => fullscreen.toggle()}
	disabled={!fullscreen.supported}
	aria-label={label}
	aria-pressed={fullscreen.active}
	title={fullscreen.error ?? label}
>
	<Icon name={fullscreen.active ? 'minimize' : 'maximize'} />
	<span class="text">{fullscreen.active ? 'Exit' : 'Fullscreen'}</span>
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
