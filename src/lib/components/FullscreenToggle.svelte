<script lang="ts">
	import Icon from './Icon.svelte';
	import { fullscreen } from './fullscreen.svelte';
	import { t } from '../i18n/strings';

	const label = $derived(
		!fullscreen.supported ? t('fullscreen').unsupported : fullscreen.active ? t('fullscreen').exit : t('fullscreen').enter
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
</button>

<style>
	.icon-btn {
		padding: 0.35rem 0.55rem;
	}
</style>
