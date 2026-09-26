<script lang="ts">
	import type { FrameInfo } from '../array/types';
	import { formatBytes, formatCount, formatShape } from '../array/normalize';

	/** Property sheet for a DataFrame or Series: the attributes you would query in pandas. */
	let { info, name = info.name ?? 'df' }: { info: FrameInfo; name?: string } = $props();

	const series = $derived(info.kind === 'series');

	function labelList(labels: string[], kind: string, total: number, type: string): string {
		if (type === 'RangeIndex') return `RangeIndex(0 … ${total - 1})`;
		const shown = labels.slice(0, 5).map((l) => (kind === 'O' ? `'${l}'` : l));
		return `[${shown.join(', ')}${total > shown.length ? ', …' : ''}]`;
	}

	const rows = $derived.by(() => {
		const out = [
			{ key: 'shape', value: formatShape(info.shape), help: series ? 'Number of rows.' : '(rows, columns).' },
			{ key: 'ndim', value: String(info.ndim), help: 'A DataFrame is always 2-D, a Series 1-D.' },
			{ key: 'size', value: formatCount(info.size), help: 'Number of values = rows × columns. Labels are not counted.' },
			{
				key: 'index',
				value: labelList(info.index, info.indexKind, info.shape[0], info.indexType),
				help: 'Row labels. RangeIndex means the default labels 0, 1, 2 … (equal to the positions).'
			}
		];
		if (series) {
			out.push({ key: 'dtype', value: info.dtypes[0] ?? '?', help: 'A Series has one dtype.' });
			out.push({ key: 'name', value: info.columns[0] ? info.columns[0] : 'None', help: 'The label a Series carries (e.g. its column name).' });
		} else {
			out.push({
				key: 'columns',
				value: labelList(info.columns, info.columnsKind, info.shape[1], info.columnsType),
				help: 'Column labels.'
			});
		}
		return out;
	});
</script>

<section class="inspector" aria-label="Properties of {name}">
	<h3 class="title"><code>{name}</code> <span class="muted type">{info.pythonType}</span></h3>
	<dl>
		{#each rows as row (row.key)}
			<div class="row" title={row.help}>
				<dt class="mono"><span class="obj">{name}.</span>{row.key}</dt>
				<dd class="mono">{row.value}</dd>
			</div>
		{/each}
	</dl>
	{#if !series}
		<dl class="dtypes" aria-label="{name}.dtypes">
			<div class="row head" title="Each column has its own dtype."><dt class="mono"><span class="obj">{name}.</span>dtypes</dt><dd></dd></div>
			{#each info.dtypes as dt, j (j)}
				<div class="row sub">
					<dt class="mono">{info.columns[j]}</dt>
					<dd class="mono">{dt}</dd>
				</div>
			{/each}
			{#if info.shape[1] > info.dtypes.length}<div class="row sub"><dt class="muted">…</dt><dd></dd></div>{/if}
		</dl>
	{/if}
	<div class="row" title="Memory of the values, without the labels: memory_usage(index=False).">
		<span class="mono muted">memory</span>
		<span class="mono strong">{formatBytes(info.nbytes)}</span>
	</div>
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
	.row.head {
		border-bottom: none;
		padding-bottom: 0;
	}
	.row.sub {
		padding-left: 0.8rem;
		font-size: 0.82rem;
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
		overflow-wrap: anywhere;
	}
	.strong {
		font-weight: 600;
	}
</style>
