<script lang="ts">
	import Icon from './Icon.svelte';
	import { theme } from './theme.svelte';
	import { t } from '../i18n/strings';

	const label = $derived(theme.current === 'dark' ? t('theme').toLight : t('theme').toDark);
</script>

<button class="btn ghost icon-btn" type="button" onclick={() => theme.toggle()} aria-label={label} title={label}>
	<Icon name={theme.current === 'dark' ? 'moon' : 'sun'} />
</button>

<style>
	.icon-btn {
		padding: 0.35rem 0.55rem;
	}
</style>
