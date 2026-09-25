<script lang="ts">
	import type { ArrayInfo } from '../array/types';
	import { formatBytes, formatCount, formatShape } from '../array/normalize';

	/** Property sheet for one array: the attributes you would query in Python. */
	let {
		info,
		name = info.name ?? 'a',
		showNote = true
	}: { info: ArrayInfo; name?: string; showNote?: boolean } = $props();

	const pending = $derived(info.dtype === '…');
	const rows = $derived([
		{ key: 'shape', value: formatShape(info.shape), help: 'Length of each axis.' },
		{ key: 'ndim', value: String(info.ndim), help: 'Number of axes = number of entries in shape.' },
		{ key: 'size', value: formatCount(info.size), help: 'Total number of elements = product of the shape.' },
		{ key: 'dtype', value: info.dtype, help: 'Type of every element. One array has exactly one dtype.' },
		{ key: 'itemsize', value: pending ? '…' : `${info.itemsize} byte${info.itemsize === 1 ? '' : 's'}`, help: 'Bytes used by one element.' },
		{ key: 'nbytes', value: pending ? '…' : formatBytes(info.nbytes), help: 'Bytes used by all elements = size × itemsize.' }
	]);
</script>

<section class="inspector" aria-label="Properties of {name}">
	<h3 class="title">
		<code>{name}</code>
		{#if info.kind === 'scalar' && info.pythonType}<span class="muted type">{info.pythonType}</span>{/if}
		{#if pending}<span class="muted type">waiting for NumPy…</span>{/if}
	</h3>
	<dl>
		{#each rows as row (row.key)}
			<div class="row" title={row.help}>
				<dt class="mono"><span class="obj">{name}.</span>{row.key}</dt>
				<dd class="mono">{row.value}</dd>
			</div>
		{/each}
		{#if !pending && info.ndim > 0}
			<div class="row" title="Is the data stored in one block, in reading order (row-major)?">
				<dt class="mono">memory</dt>
				<dd>{info.cContiguous ? 'C-contiguous' : 'not contiguous'} · {info.ownsData ? 'owns data' : 'view'}</dd>
			</div>
		{/if}
	</dl>
	{#if showNote && info.dtype === 'int32'}
		<p class="note">
			int32 is the default integer in this browser (32-bit WebAssembly). Desktop NumPy 2 on 64-bit systems uses int64.
		</p>
	{/if}
</section>

<style>
	.inspector {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.title {
		font-size: 0.95rem;
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		flex-wrap: wrap;
	}
	.type {
		font-size: 0.78rem;
		font-weight: 400;
	}
	dl {
		margin: 0;
		display: flex;
		flex-direction: column;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.28rem 0;
		border-bottom: 1px solid var(--border);
		font-size: 0.86rem;
	}
	dt {
		color: var(--muted);
	}
	.obj {
		color: var(--subtle);
	}
	dd {
		margin: 0;
		text-align: right;
		font-weight: 600;
	}
	.note {
		margin: 0.2rem 0 0;
		font-size: 0.75rem;
		color: var(--muted);
	}
</style>
