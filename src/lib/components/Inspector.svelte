<script lang="ts">
	import type { ArrayInfo } from '../array/types';
	import { formatBytes, formatCount, formatShape } from '../array/normalize';
	import { t } from '../i18n/strings';

	/** Property sheet for one array: the attributes you would query in Python. */
	let {
		info,
		name = info.name ?? 'a',
		showNote = true
	}: { info: ArrayInfo; name?: string; showNote?: boolean } = $props();

	const pending = $derived(info.dtype === '…');
	const rows = $derived([
		{ key: 'shape', value: formatShape(info.shape), help: t('inspector').shapeHelp },
		{ key: 'ndim', value: String(info.ndim), help: t('inspector').ndimHelp },
		{ key: 'size', value: formatCount(info.size), help: t('inspector').sizeHelp },
		{ key: 'dtype', value: info.dtype, help: t('inspector').dtypeHelp },
		{ key: 'itemsize', value: pending ? '…' : t('inspector').byte(info.itemsize), help: t('inspector').itemsizeHelp },
		{ key: 'nbytes', value: pending ? '…' : formatBytes(info.nbytes), help: t('inspector').nbytesHelp }
	]);
</script>

<section class="inspector" aria-label={t('inspector').propertiesOf(name)}>
	<h3 class="title">
		<code>{name}</code>
		{#if info.kind === 'scalar' && info.pythonType}<span class="muted type">{info.pythonType}</span>{/if}
		{#if pending}<span class="muted type">{t('inspector').waiting}</span>{/if}
	</h3>
	<dl>
		{#each rows as row (row.key)}
			<div class="row" title={row.help}>
				<dt class="mono"><span class="obj">{name}.</span>{row.key}</dt>
				<dd class="mono">{row.value}</dd>
			</div>
		{/each}
		{#if !pending && info.ndim > 0}
			<div class="row" title={t('inspector').memoryHelp}>
				<dt class="mono">memory</dt>
				<dd>{info.cContiguous ? t('inspector').contiguous : t('inspector').notContiguous} · {info.ownsData ? t('inspector').ownsData : t('inspector').view}</dd>
			</div>
		{/if}
	</dl>
	{#if showNote && info.dtype === 'int32'}
		<p class="note">{t('inspector').int32Note}</p>
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
