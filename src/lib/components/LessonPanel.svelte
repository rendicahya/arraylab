<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Icon from './Icon.svelte';
	import RichText from './RichText.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { chapters, type Chapter } from '../lessons';

	let {
		chapter,
		lab,
		step = $bindable(0)
	}: { chapter: Chapter; lab: Lab; step?: number } = $props();

	const current = $derived(chapter.steps[step]);
	const index = $derived(chapters.findIndex((c) => c.slug === chapter.slug));
	const next = $derived(chapters[index + 1]);
	const prev = $derived(chapters[index - 1]);
	let done = $state<Set<number>>(new Set());

	function go(i: number) {
		step = Math.max(0, Math.min(chapter.steps.length - 1, i));
	}

	function chapterHref(slug: string) {
		return resolve('/learn/[slug]', { slug }) + '/';
	}
</script>

<div class="lesson">
	<label class="picker">
		<span class="visually-hidden">Chapter</span>
		<select
			value={chapter.slug}
			onchange={(e) => goto(chapterHref((e.currentTarget as HTMLSelectElement).value))}
			aria-label="Choose chapter"
		>
			{#each chapters as c (c.slug)}
				<option value={c.slug}>{c.number} — {c.title}</option>
			{/each}
		</select>
	</label>

	<header>
		<p class="eyebrow">Chapter {chapter.number}</p>
		<h1>{chapter.title}</h1>
	</header>

	<ol class="steps" aria-label="Steps">
		{#each chapter.steps as s, i (i)}
			<li>
				<button type="button" aria-current={i === step ? 'step' : undefined} onclick={() => go(i)}>
					<span class="num" class:done={done.has(i) && i !== step}>{done.has(i) && i !== step ? '✓' : i + 1}</span>
					<span class="label">{s.title}</span>
				</button>
			</li>
		{/each}
	</ol>

	{#if current}
		<article aria-live="polite">
			<h2>{current.title}</h2>
			{#each current.body as p, i (i)}<p><RichText text={p} /></p>{/each}

			{#if current.tasks?.length}
				<h3 class="eyebrow">Try this</h3>
				<ul class="tasks">
					{#each current.tasks as task, i (i)}
						<li>
							{#if task.patch}
								<button
									type="button"
									class="task"
									onclick={() => {
										lab.apply(task.patch!);
										done = new Set([...done, step]);
									}}
								>
									<Icon name="arrowRight" size={14} />
									<span><RichText text={task.text} /></span>
								</button>
							{:else}
								<span class="task static"><RichText text={task.text} /></span>
							{/if}
						</li>
					{/each}
				</ul>
				<button class="btn ghost reset" type="button" onclick={() => lab.apply(current.patch)}>
					<Icon name="reset" size={14} /> Reset this step
				</button>
			{/if}

			{#if current.remember}
				<p class="remember"><strong>Remember:</strong> <RichText text={current.remember} /></p>
			{/if}
		</article>
	{/if}

	<nav class="pager" aria-label="Step navigation">
		{#if step > 0}
			<button class="btn" type="button" onclick={() => go(step - 1)}><Icon name="chevronLeft" size={16} /> Back</button>
		{:else if prev}
			<a class="btn" href={chapterHref(prev.slug)}><Icon name="chevronLeft" size={16} /> {prev.number}</a>
		{:else}
			<span></span>
		{/if}
		<span class="count muted">{step + 1} / {chapter.steps.length}</span>
		{#if step < chapter.steps.length - 1}
			<button class="btn primary" type="button" onclick={() => ((done = new Set([...done, step])), go(step + 1))}>
				Next <Icon name="chevronRight" size={16} />
			</button>
		{:else if next}
			<a class="btn primary" href={chapterHref(next.slug)}>{next.number} {next.title} <Icon name="chevronRight" size={16} /></a>
		{/if}
	</nav>
</div>

<style>
	.lesson {
		padding: 0.9rem 1rem 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.picker select {
		width: 100%;
		font-size: 0.85rem;
	}
	h1 {
		font-size: 1.3rem;
		margin-top: 0.1rem;
	}
	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.steps button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.55rem;
		border: none;
		background: none;
		text-align: left;
		padding: 0.3rem 0.4rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--muted);
		font-size: 0.88rem;
	}
	.steps button:hover {
		background: var(--surface-sunken);
		color: var(--foreground);
	}
	.steps button[aria-current='step'] {
		background: var(--accent-soft);
		color: var(--foreground);
		font-weight: 600;
	}
	.num {
		flex: none;
		width: 1.4rem;
		height: 1.4rem;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 0.75rem;
		border: 1.5px solid var(--border-strong);
		font-weight: 600;
	}
	[aria-current='step'] .num {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-contrast);
	}
	.num.done {
		border-color: var(--success);
		color: var(--success);
	}
	article {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		border-top: 1px solid var(--border);
		padding-top: 0.8rem;
	}
	h2 {
		font-size: 1.05rem;
	}
	article p {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.55;
	}
	h3 {
		margin-top: 0.4rem;
	}
	.tasks {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.task {
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
		text-align: left;
		border: 1px solid var(--border);
		background: var(--surface);
		border-radius: var(--radius-sm);
		padding: 0.4rem 0.55rem;
		cursor: pointer;
		font-size: 0.86rem;
	}
	.task :global(svg) {
		margin-top: 0.2rem;
		flex: none;
		color: var(--accent);
	}
	.task:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.task.static {
		cursor: default;
	}
	.reset {
		align-self: flex-start;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.remember {
		background: var(--surface-sunken);
		border-radius: var(--radius-sm);
		padding: 0.5rem 0.65rem;
		font-size: 0.86rem !important;
	}
	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 0.6rem;
		border-top: 1px solid var(--border);
	}
	.pager .btn {
		font-size: 0.85rem;
	}
	.count {
		font-size: 0.8rem;
	}
</style>
