<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ThemeToggle from './ThemeToggle.svelte';
	import FullscreenToggle from './FullscreenToggle.svelte';

	const links = [
		{ href: resolve('/learn/[slug]', { slug: 'ndarray' }) + '/', match: '/learn', label: 'Learn' },
		{ href: resolve('/lab') + '/', match: '/lab', label: 'Lab' }
	];
</script>

<header class="app-header">
	<a class="brand" href={resolve('/')} aria-label="ArrayLab home">
		<svg class="logo" viewBox="0 0 32 32" aria-hidden="true">
			<g fill="none" stroke="currentColor" stroke-width="2.4">
				<rect x="5" y="5" width="9" height="9" rx="2" />
				<rect x="18" y="5" width="9" height="9" rx="2" />
				<rect x="5" y="18" width="9" height="9" rx="2" />
			</g>
			<rect x="18" y="18" width="9" height="9" rx="2" class="logo-hi" />
		</svg>
		<span class="name">Array<span class="lab">Lab</span></span>
		<span class="tagline">Explore arrays. Understand tensors.</span>
	</a>

	<nav aria-label="Main">
		{#each links as link (link.label)}
			<a
				href={link.href}
				aria-current={page.route.id?.startsWith(link.match) ? 'page' : undefined}>{link.label}</a
			>
		{/each}
	</nav>

	<div class="controls">
		<ThemeToggle />
		<FullscreenToggle />
	</div>
</header>

<style>
	.app-header {
		height: var(--header-h);
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 0 1rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
		position: relative;
		z-index: 5;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		text-decoration: none;
		color: var(--foreground);
		min-width: 0;
	}
	.logo {
		width: 26px;
		height: 26px;
		color: var(--accent);
		flex: none;
	}
	.logo-hi {
		fill: var(--array-cell-highlight-border);
	}
	.name {
		font-weight: 700;
		font-size: 1.1rem;
		letter-spacing: -0.01em;
	}
	.lab {
		color: var(--accent);
	}
	.tagline {
		color: var(--muted);
		font-size: 0.85rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	nav {
		display: flex;
		gap: 0.25rem;
	}
	nav a {
		text-decoration: none;
		color: var(--muted);
		padding: 0.3rem 0.65rem;
		border-radius: var(--radius-sm);
		font-weight: 500;
		font-size: 0.92rem;
	}
	nav a:hover {
		color: var(--foreground);
		background: var(--surface-sunken);
	}
	nav a[aria-current='page'] {
		color: var(--accent);
		background: var(--accent-soft);
	}
	.controls {
		margin-left: auto;
		display: flex;
		gap: 0.25rem;
	}
	:global(:root[data-fullscreen='true']) .tagline {
		display: none;
	}
	@media (max-width: 900px) {
		.tagline {
			display: none;
		}
	}
	@media (max-width: 480px) {
		.app-header {
			gap: 0.5rem;
			padding: 0 0.5rem;
		}
	}
</style>
