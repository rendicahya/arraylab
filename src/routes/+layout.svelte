<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { theme } from '$lib/components/theme.svelte';
	import { fullscreen } from '$lib/components/fullscreen.svelte';

	let { children } = $props();

	onMount(() => {
		const stopTheme = theme.init();
		const stopFullscreen = fullscreen.init();
		return () => {
			stopTheme?.();
			stopFullscreen?.();
		};
	});
</script>

<div class="shell">
	<AppHeader />
	<main>
		{@render children()}
	</main>
</div>

<style>
	.shell {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
</style>
