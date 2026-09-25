<script lang="ts">
	import { resolve } from '$app/paths';
	import SourceInput from '$lib/components/SourceInput.svelte';
	import Inspector from '$lib/components/Inspector.svelte';
	import RunStatus from '$lib/components/RunStatus.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ArrayGrid from '$lib/visualization/ArrayGrid.svelte';
	import { Lab } from '$lib/lab/lab.svelte';
	import { chapters } from '$lib/lessons';

	const lab = new Lab('home', { tool: 'array' });
	lab.connect();

	const a = $derived(lab.resultFor('array') ? lab.target('a') : lab.provisional);
	const chapterHref = (slug: string) => resolve('/learn/[slug]', { slug }) + '/';
</script>

<svelte:head>
	<title>ArrayLab — Explore arrays. Understand tensors.</title>
</svelte:head>

<div class="home">
	<section class="hero">
		<div class="intro">
			<p class="eyebrow">An interactive NumPy laboratory</p>
			<h1>Explore arrays.<br /><span class="accent">Understand tensors.</span></h1>
			<p class="lead">
				Type numbers and watch them become a real NumPy array — then reduce along axes, slice, reshape and broadcast,
				and <em>see</em> what NumPy does. Python runs right in your browser.
			</p>
			<div class="cta">
				<a class="btn primary big" href={chapterHref('ndarray')}><Icon name="book" size={16} /> Start chapter 01</a>
				<a class="btn big" href={resolve('/lab') + '/'}><Icon name="flask" size={16} /> Open the lab</a>
			</div>
			<ol class="how" aria-label="How ArrayLab works">
				<li><span class="step mono">1</span><span><strong>Type numbers</strong> — no Python needed to start.</span></li>
				<li><span class="step mono">2</span><span><strong>See the ndarray</strong> — its grid, axes, shape and dtype.</span></li>
				<li>
					<span class="step mono">3</span><span><strong>Change something</strong> — an axis, an index, a shape — and watch NumPy's answer.</span>
				</li>
			</ol>
		</div>

		<div class="try" aria-label="Try it: create an array">
			<SourceInput {lab} compact />
			<RunStatus {lab} />
			{#if a}
				<div class="try-body">
					<div class="grid-wrap"><ArrayGrid info={a} /></div>
					<Inspector info={a} name="a" />
				</div>
			{/if}
		</div>
	</section>

	<section class="chapters" aria-labelledby="chapters-title">
		<h2 id="chapters-title">Chapters</h2>
		<ol>
			{#each chapters as c (c.slug)}
				<li class:soon={c.phase === 'torch'}>
					<a href={chapterHref(c.slug)}>
						<span class="num mono">{c.number}</span>
						<span class="text">
							<strong>{c.title}</strong>
							<span class="muted">{c.summary}</span>
						</span>
						{#if c.phase === 'torch'}<span class="soon-tag">PyTorch · later</span>{/if}
					</a>
				</li>
			{/each}
		</ol>
	</section>

	<footer class="foot muted">
		ArrayLab runs Python and NumPy in your browser with <a href="https://pyodide.org" rel="noopener">Pyodide</a>. No
		server, no account — nothing you type leaves your computer. ·
		<a href="https://github.com/rendicahya/arraylab" rel="noopener">Source on GitHub</a>
	</footer>
</div>

<style>
	.home {
		max-width: 76rem;
		width: 100%;
		margin: 0 auto;
		padding: 2.2rem 1.25rem 2rem;
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
		gap: 2.5rem;
		align-items: start;
	}
	h1 {
		font-size: clamp(2rem, 4vw, 3rem);
		letter-spacing: -0.02em;
		margin: 0.4rem 0 0.9rem;
	}
	.accent {
		color: var(--accent);
	}
	.lead {
		font-size: 1.08rem;
		color: var(--muted);
		max-width: 34rem;
		margin: 0 0 1.4rem;
	}
	.cta {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.big {
		padding: 0.6rem 1.05rem;
		font-size: 0.98rem;
	}
	.how {
		list-style: none;
		margin: 2rem 0 0;
		padding: 1.1rem 0 0;
		border-top: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		gap: 0.7rem;
		max-width: 34rem;
		color: var(--muted);
	}
	.how li {
		display: flex;
		gap: 0.7rem;
		align-items: baseline;
	}
	.how strong {
		color: var(--foreground);
	}
	.step {
		flex: none;
		width: 1.6rem;
		height: 1.6rem;
		display: inline-grid;
		place-items: center;
		border: 1.5px solid var(--accent);
		border-radius: 50%;
		color: var(--accent);
		font-size: 0.8rem;
		font-weight: 700;
	}
	.try {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow: var(--shadow);
		padding: 1.1rem 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		min-width: 0;
	}
	.try-body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 13.5rem;
		gap: 1.2rem;
		align-items: start;
	}
	.grid-wrap {
		overflow: auto;
		padding: 0.4rem 0.1rem;
	}
	.chapters h2 {
		font-size: 1.25rem;
		margin-bottom: 0.8rem;
	}
	.chapters ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
		gap: 0.6rem;
	}
	.chapters a {
		display: flex;
		gap: 0.8rem;
		align-items: flex-start;
		padding: 0.8rem 0.9rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		text-decoration: none;
		color: var(--foreground);
		height: 100%;
		position: relative;
	}
	.chapters a:hover {
		border-color: var(--accent);
	}
	.num {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--accent);
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.9rem;
	}
	.text .muted {
		font-size: 0.84rem;
	}
	.soon a {
		background: transparent;
		border-style: dashed;
	}
	.soon .num {
		color: var(--subtle);
	}
	.soon-tag {
		position: absolute;
		top: 0.5rem;
		right: 0.6rem;
		font-size: 0.68rem;
		color: var(--muted);
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		padding: 0 0.4rem;
	}
	.foot {
		font-size: 0.82rem;
		border-top: 1px solid var(--border);
		padding-top: 1rem;
	}
	@media (max-width: 960px) {
		.hero {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 560px) {
		.try-body {
			grid-template-columns: 1fr;
		}
	}
</style>
