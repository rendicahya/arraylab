<script lang="ts">
	import ChapterView from '$lib/components/ChapterView.svelte';
	import { localizeChapter } from '$lib/lessons';
	import { lang } from '$lib/i18n/lang.svelte';

	let { data } = $props();
	const chapter = $derived(data.chapter);
	const localized = $derived(localizeChapter(chapter, lang.current));
</script>

<svelte:head>
	<title>{localized.number} {localized.title} · ArrayLab</title>
	<meta name="description" content={localized.summary} />
</svelte:head>

{#key chapter.slug}
	<ChapterView {chapter} />
{/key}
