<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>{page.status === 404 ? 'Page not found' : 'Error'} · ArrayLab</title>
</svelte:head>

<div class="error-page">
	<p class="code mono">IndexError: {page.status}</p>
	<h1>{page.status === 404 ? 'This page is out of bounds.' : 'Something went wrong.'}</h1>
	<p class="muted">{page.error?.message}</p>
	<p>
		<a class="btn primary" href={resolve('/')}>Go to the start</a>
		<a class="btn" href={resolve('/lab') + '/'}>Open the lab</a>
	</p>
</div>

<style>
	.error-page {
		max-width: 40rem;
		margin: 0 auto;
		padding: 4rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.code {
		color: var(--axis-mark);
		margin: 0;
	}
	h1 {
		font-size: 1.8rem;
	}
	.btn {
		margin-right: 0.4rem;
	}
</style>
