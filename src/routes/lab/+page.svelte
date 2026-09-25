<script lang="ts">
	import Workspace from '$lib/components/Workspace.svelte';
	import { Lab } from '$lib/lab/lab.svelte';

	const lab = new Lab('lab');
</script>

<svelte:head>
	<title>Lab · ArrayLab</title>
</svelte:head>

<h1 class="visually-hidden">ArrayLab — free lab</h1>
<Workspace {lab} />
