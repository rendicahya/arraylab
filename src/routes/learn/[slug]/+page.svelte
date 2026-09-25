<script lang="ts">
	import ChapterView from '$lib/components/ChapterView.svelte';
	import PhaseTwo from '$lib/components/PhaseTwo.svelte';

	let { data } = $props();
	const chapter = $derived(data.chapter);
</script>

<svelte:head>
	<title>{chapter.number} {chapter.title} · ArrayLab</title>
	<meta name="description" content={chapter.summary} />
</svelte:head>

{#key chapter.slug}
	{#if chapter.phase === 'torch'}
		<PhaseTwo {chapter} />
	{:else}
		<ChapterView {chapter} />
	{/if}
{/key}
