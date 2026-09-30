<script lang="ts">
	import { browser } from '$app/environment';
	import Workspace from '$lib/components/Workspace.svelte';
	import { Lab } from '$lib/lab/lab.svelte';
	import { decodeShare } from '$lib/lab/share';
	import { t } from '$lib/i18n/strings';

	const lab = new Lab('lab');

	/** A share link (#s=…) fills in the lab; nothing unusual runs without an OK. */
	function openLink() {
		const shared = decodeShare(location.hash);
		if (shared) lab.loadShared(shared.settings, shared.code, shared.unsafe);
	}
	if (browser) openLink();
</script>

<svelte:head>
	<title>{t('labPage').title}</title>
</svelte:head>

<svelte:window onhashchange={openLink} />

<h1 class="visually-hidden">{t('labPage').hiddenH1}</h1>
<Workspace {lab} />
