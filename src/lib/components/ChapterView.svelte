<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { replaceState } from '$app/navigation';
	import Workspace from './Workspace.svelte';
	import LessonPanel from './LessonPanel.svelte';
	import { Lab } from '../lab/lab.svelte';
	import type { Chapter } from '../lessons';

	let { chapter }: { chapter: Chapter } = $props();

	const lab = untrack(() => new Lab(chapter.slug, chapter.steps[0]?.patch));
	let step = $state(0);
	let mounted = false;

	onMount(() => {
		const m = location.hash.match(/^#step-(\d+)$/);
		const fromHash = m ? Number(m[1]) - 1 : 0;
		if (fromHash > 0 && fromHash < chapter.steps.length) step = fromHash;
		mounted = true;
	});

	// Entering a step sets up the lab for it; the learner is free to change everything after.
	let applied = -1;
	$effect(() => {
		const s = step;
		if (s === applied) return;
		const first = applied === -1;
		applied = s;
		untrack(() => lab.apply(chapter.steps[s].patch));
		// Keep the step in the URL (#step-3) so it can be shared; only after the router is ready.
		const hash = s === 0 ? '' : `#step-${s + 1}`;
		if (!first && mounted && location.hash !== hash) replaceState(hash || location.pathname, {});
	});
</script>

<Workspace {lab}>
	{#snippet left()}
		<LessonPanel {chapter} {lab} bind:step />
	{/snippet}
</Workspace>
