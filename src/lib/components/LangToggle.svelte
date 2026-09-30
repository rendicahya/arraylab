<script lang="ts">
	import Icon from './Icon.svelte';
	import { lang } from '../i18n/lang.svelte';
	import { t } from '../i18n/strings';

	const label = $derived(lang.current === 'en' ? t('lang').toIndonesian : t('lang').toEnglish);
</script>

<button class="btn ghost icon-btn" type="button" onclick={() => lang.toggle()} aria-label={label} title={label}>
	<Icon name="globe" />
	<span class="code">{lang.current.toUpperCase()}</span>
</button>

<style>
	.icon-btn {
		padding: 0.35rem 0.55rem;
	}
	.code {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--muted);
	}
</style>
