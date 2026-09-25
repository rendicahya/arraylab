<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Chapter } from '../lessons';

	/**
	 * PyTorch chapters: honest placeholder. Pyodide (the browser Python used here)
	 * does not include PyTorch, and ArrayLab does not fake it.
	 */
	let { chapter }: { chapter: Chapter } = $props();

	const comparison = [
		['Type', 'np.ndarray', 'torch.Tensor'],
		['Create', 'np.array([[1, 2], [3, 4]])', 'torch.tensor([[1, 2], [3, 4]])'],
		['Shape', 'a.shape → (2, 2)', 't.shape → torch.Size([2, 2])'],
		['Element count', 'a.size', 't.numel()'],
		['dtype', 'a.dtype → int64 (desktop)', 't.dtype → torch.int64'],
		['Where it lives', 'always CPU memory', 't.device → cpu / cuda:0 / mps'],
		['Convert', 'torch.from_numpy(a)', 't.numpy()  (CPU tensors)'],
		['Gradients', '—', 't.requires_grad, t.grad, t.backward()']
	];
</script>

<div class="phase-two">
	<p class="eyebrow">Chapter {chapter.number} · PyTorch · Phase 2</p>
	<h1>{chapter.title}</h1>
	<p class="lead">{chapter.summary}</p>

	<div class="notice" role="note">
		<h2>Not available in the browser yet</h2>
		<p>
			ArrayLab runs <strong>real</strong> Python in your browser using Pyodide. Pyodide ships NumPy, but it does not include
			PyTorch. Instead of imitating PyTorch with fake tensors (or pretending there is a GPU), this chapter will open once a
			genuine browser-compatible PyTorch runtime can be used.
		</p>
		<p>
			Everything you learn in chapters 01–07 carries over: tensors have a shape, ndim, dtype, axes, indexing, broadcasting and
			element-wise operations that work the same way.
		</p>
	</div>

	<h2>Planned topics</h2>
	<ul class="topics">
		{#each chapter.topics as t (t)}<li>{t}</li>{/each}
	</ul>

	<h2>Preview: NumPy vs PyTorch</h2>
	<p class="muted small">Reference only — this code is not executed here. Run it in a local Python with PyTorch installed.</p>
	<div class="table-wrap">
		<table>
			<thead><tr><th scope="col"></th><th scope="col">NumPy</th><th scope="col">PyTorch</th></tr></thead>
			<tbody>
				{#each comparison.slice(1) as [label, np_, torch_] (label)}
					<tr><th scope="row">{label}</th><td><code>{np_}</code></td><td><code>{torch_}</code></td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	<p>
		<a class="btn primary" href={resolve('/learn/[slug]', { slug: 'ndarray' }) + '/'}>Start with NumPy (chapter 01)</a>
		<a class="btn" href={resolve('/lab') + '/'}>Open the lab</a>
	</p>
</div>

<style>
	.phase-two {
		max-width: 52rem;
		margin: 0 auto;
		padding: 2rem 1.2rem 3rem;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	h1 {
		font-size: 2rem;
	}
	h2 {
		font-size: 1.1rem;
		margin-top: 0.6rem;
	}
	.lead {
		font-size: 1.1rem;
		color: var(--muted);
		margin: 0;
	}
	.notice {
		border: 1px solid var(--warning);
		background: var(--warning-soft);
		border-radius: var(--radius);
		padding: 0.9rem 1.1rem;
	}
	.notice h2 {
		margin: 0 0 0.4rem;
	}
	.notice p {
		margin: 0.4rem 0 0;
	}
	.topics {
		margin: 0;
		padding-left: 1.2rem;
	}
	.small {
		font-size: 0.85rem;
		margin: 0;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.88rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.45rem 0.6rem;
		border-bottom: 1px solid var(--border);
		vertical-align: top;
	}
	thead th {
		color: var(--muted);
		font-weight: 600;
	}
	tbody th {
		font-weight: 600;
		white-space: nowrap;
	}
	p .btn {
		margin-right: 0.5rem;
	}
</style>
