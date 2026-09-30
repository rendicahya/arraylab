<script lang="ts">
	import ArrayGrid from './ArrayGrid.svelte';
	import TorchCode from './TorchCode.svelte';
	import Explain from '../components/Explain.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import Icon from '../components/Icon.svelte';
	import RichText from '../components/RichText.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import type { TorchView } from '../lab/types';
	import { formatShape } from '../array/normalize';
	import {
		CREATE_PRESETS,
		TORCH_OPS,
		TORCH_REFERENCE,
		TORCH_VERSION,
		colabUrl,
		createPresetFor,
		elementSize,
		tensorSource,
		torchDtypeOf,
		torchOp,
		torchOpResult,
		torchSize
	} from '../torch/translate';
	import { tTorch } from '../i18n/viz/torchAutograd';

	let { lab }: { lab: Lab } = $props();

	const tv = $derived(tTorch());
	const VIEWS = $derived<{ id: TorchView; label: string }[]>([
		{ id: 'tensor', label: tv.viewLabels.tensor },
		{ id: 'convert', label: tv.viewLabels.convert },
		{ id: 'ops', label: tv.viewLabels.ops },
		{ id: 'create', label: tv.viewLabels.create },
		{ id: 'device', label: tv.viewLabels.device }
	]);

	const s = $derived(lab.settings.torch);
	const source = $derived(lab.settings.source);
	const res = $derived(lab.resultFor('torch'));
	const a = $derived(res ? lab.target('a') : lab.provisional);
	const result = $derived(res && !res.error && s.view === 'ops' ? lab.target('result') : null);
	const ready = $derived(!!a && a.dtype !== '…');

	const t = $derived(tensorSource(source, ready ? a : null));
	const preset = $derived(source.mode === 'expr' ? createPresetFor(source.expr) : undefined);
	const op = $derived(torchOp(s.op));
	const opResult = $derived(t.dtype ? torchOpResult(op.id, t.dtype) : null);
	const facts = TORCH_REFERENCE.tensorFacts;
	const fromList = TORCH_REFERENCE.tensorFromList;

	/** Code that creates `t`, as shown to the learner. */
	const tensorCode = $derived(
		preset && s.view === 'create'
			? `t = ${preset.torch}`
			: t.how === 'from_numpy'
				? `a = ${source.expr.trim()}\n${t.code}`
				: t.code
	);
	const tDtype = $derived(preset && s.view === 'create' ? preset.dtype : t.dtype);

	type Row = { key: string; focus?: string; np: string; npValue: string; torch: string; torchValue: string };
	const rows = $derived.by((): Row[] => {
		if (!a || !ready) return [];
		const size = elementSize(tDtype ?? '');
		return [
			{ key: 'shape', focus: 'shape', np: 'a.shape', npValue: formatShape(a.shape), torch: 't.shape', torchValue: torchSize(a.shape) },
			{ key: 'ndim', focus: 'shape', np: 'a.ndim', npValue: String(a.ndim), torch: 't.ndim  /  t.dim()', torchValue: String(a.ndim) },
			{ key: 'elements', focus: 'numel', np: 'a.size', npValue: String(a.size), torch: 't.numel()', torchValue: String(a.size) },
			{ key: 'dtype', focus: 'dtype', np: 'a.dtype', npValue: a.dtype, torch: 't.dtype', torchValue: tDtype ?? '?' },
			{ key: 'bytes / element', focus: 'dtype', np: 'a.itemsize', npValue: String(a.itemsize), torch: 't.element_size()', torchValue: size === null ? '?' : String(size) },
			{ key: 'device', focus: 'device', np: '—', npValue: 'always CPU memory', torch: 't.device', torchValue: `device(type='${facts.defaultDevice}')` },
			{ key: 'gradients', np: '—', npValue: 'not tracked', torch: 't.requires_grad', torchValue: String(facts.requiresGrad) }
		];
	});

	const intDefaultNote = $derived(ready && a?.dtype === 'int32' && !source.dtype);
</script>

<div class="controls">
	<span class="segmented" role="group" aria-label={tv.viewAria}>
		{#each VIEWS as v (v.id)}
			<button type="button" aria-pressed={s.view === v.id} onclick={() => (s.view = v.id)}>{v.label}</button>
		{/each}
	</span>
	<a class="btn small colab" href={colabUrl('pytorch.ipynb')} target="_blank" rel="noopener">
		{tv.runInColab} <Icon name="arrowRight" size={13} />
	</a>
</div>

<p class="honest" role="note">
	<Icon name="info" size={15} />
	<span>
		<strong>{tv.honestNote(TORCH_VERSION).strong}</strong> {tv.honestNote(TORCH_VERSION).rest}
	</span>
</p>

<RunStatus {lab} />

{#if s.view === 'tensor' && a}
	<div class="pair">
		<figure class="side">
			<figcaption><code>a</code> <span class="muted">{tv.npRuns}</span></figcaption>
			<ArrayGrid info={a} legend={false} />
		</figure>
		<div class="side">
			<TorchCode code={`import torch\n\n${tensorCode}`} title={tv.tensorCaption} />
			<p class="muted small">{tv.sameValues}</p>
		</div>
	</div>

	{#if ready}
		<div class="table-wrap">
			<table class="props">
				<thead>
					<tr><th scope="col"></th><th scope="col">{tv.colNumpyLive} <span class="muted">{tv.live}</span></th><th scope="col">{tv.colTorchRecorded} <span class="muted">{tv.recorded}</span></th></tr>
				</thead>
				<tbody>
					{#each rows as row (row.key)}
						<tr class:focus={row.focus && row.focus === s.focus}>
							<th scope="row">{#if row.focus && row.focus === s.focus}<span class="marker" aria-label={tv.thisStep}>▶</span>{/if}{row.key}</th>
							<td><code>{row.np}</code> <span class="arrow">→</span> <span class="mono value">{row.npValue}</span></td>
							<td><code>{row.torch}</code> <span class="arrow">→</span> <span class="mono value">{row.torchValue}</span></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<Explain title={tv.whatDiffers}>
			{#if t.how === 'tensor' && tDtype && tDtype !== torchDtypeOf(a.dtype)}
				<p>
					{tv.sameTypedDifferentDtype(a.dtype, tDtype)}
					{#if a.dtypeKind === 'f'}
						{tv.float32Note(fromList.float)}
					{:else if 'iu'.includes(a.dtypeKind)}
						{tv.intAlwaysInt64}
					{:else if a.dtypeKind === 'c'}
						{tv.complexNote}
					{/if}
				</p>
			{:else}
				<p>{tv.agreeDtype(a.dtype, tDtype ?? '?')}</p>
			{/if}
			{#if intDefaultNote}
				<p class="muted">{tv.int32DesktopNote}</p>
			{/if}
			<p>{tv.shapeIsTorchSize}</p>
		</Explain>
	{/if}
{:else if s.view === 'convert' && a}
	<div class="convert">
		<section class="card">
			<h3><code>torch.from_numpy(a)</code></h3>
			<div class="memory" aria-label={tv.shareMemoryAria}>
				<span class="name mono">a</span><span class="name mono">t</span>
				<svg class="lines" viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true"><path d="M 25 0 L 48 14 M 75 0 L 52 14" /></svg>
				<span class="block">{tv.oneSharedBlock(ready ? `${a.nbytes} bytes` : '…')}</span>
			</div>
			<p><strong>{tv.sharesMemoryWith}</strong> {tv.withA}
				{#if ready}<code>{a.dtype}</code> → <code>{torchDtypeOf(a.dtype)}</code>.{/if}</p>
			<p class="muted small">{tv.likeNumpyView}</p>
		</section>
		<section class="card">
			<h3><code>torch.tensor(data)</code></h3>
			<div class="memory two" aria-label={tv.separateMemoryAria}>
				<span class="name mono">a</span><span class="name mono">t</span>
				<span class="block">{tv.block1}</span><span class="block">{tv.block2Copy}</span>
			</div>
			<p><strong>{tv.copiesTheData}</strong> {tv.copiesTheDataRest}</p>
			<p class="muted small">
				{tv.fromListNote(fromList.int.replace('torch.', ''), fromList.float.replace('torch.', ''))}
			</p>
		</section>
		<section class="card">
			<h3><code>t.numpy()</code></h3>
			<div class="memory" aria-label={tv.shareMemoryAria2}>
				<span class="name mono">t</span><span class="name mono">b</span>
				<svg class="lines" viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true"><path d="M 25 0 L 48 14 M 75 0 L 52 14" /></svg>
				<span class="block">{tv.oneSharedBlock('')}</span>
			</div>
			<p>{tv.backToNumpy} <strong>{tv.sharingMemory}</strong>. {tv.worksOnlyCpu}</p>
			<p class="muted small">
				{tv.detachFirst}
				<span class="mono">{TORCH_REFERENCE.autograd.numpyOfGrad.split('. ')[0]}.</span> {tv.useDetach}
			</p>
		</section>
	</div>
	<TorchCode
		code={`import numpy as np\nimport torch\n\n${t.how === 'tensor' ? t.code.replace(/^t = torch\.tensor\(/, 'a = np.array(') : `a = ${source.expr.trim()}`}\n\nt = torch.from_numpy(a)   # shares memory\nc = torch.tensor(a)       # copy\n\na[0, 0] = 100\nprint(t[0, 0])   # 100 — same memory\nprint(c[0, 0])   # unchanged — a copy\n\nb = t.numpy()    # back to NumPy, shares memory with t`}
		title={tv.tryItWithPytorch}
	/>
	{#if ready && a.ndim !== 2}
		<p class="muted small">{tv.indexingNote(a.ndim, a.ndim === 0 ? tv.a2dArray : tv.nIndices(a.ndim))}</p>
	{/if}
{:else if s.view === 'ops' && a}
	<div class="op-picker" role="group" aria-label={tv.operationAria}>
		{#each TORCH_OPS as o (o.id)}
			<button type="button" class="chip" aria-pressed={s.op === o.id} onclick={() => (s.op = o.id)}>{o.label}</button>
		{/each}
	</div>
	<div class="pair">
		<figure class="side">
			<figcaption><code>{op.numpy}</code> <span class="muted">{tv.numpyRunsHere}</span></figcaption>
			{#if result}
				<ArrayGrid info={result} name="result" legend={false} />
				<p class="small mono">shape {formatShape(result.shape)} · dtype {result.dtype}</p>
			{:else if res?.error}
				<p class="small err">{tv.numpyRaised(res.error.type, res.error.message)}</p>
			{/if}
		</figure>
		<div class="side">
			<TorchCode code={`${tensorCode}\n\nresult = ${op.torch}`} title={tv.sameInPytorch} />
			{#if opResult && 'error' in opResult}
				<p class="outcome err" role="note">
					<Icon name="alert" size={14} />
					<span>{tv.pytorchRaises} <span class="mono">{opResult.error}</span></span>
				</p>
			{:else if opResult && result}
				<dl class="outcome-list">
					<dt>{tv.pytorchResultRecorded} <span class="muted">{tv.recorded}</span></dt>
					<dd>{tv.sameValuesShapeDtype(torchSize(result.shape), opResult.dtype)}</dd>
					{#if torchDtypeOf(result.dtype) !== opResult.dtype}
						<dd><span class="tag-diff">{tv.dtypeDiffers(result.dtype)}</span></dd>
					{/if}
				</dl>
			{/if}
		</div>
	</div>
	{#if op.note}
		<Explain title={tv.note}><p><RichText text={op.note} /></p></Explain>
	{/if}
{:else if s.view === 'create'}
	<div class="op-picker" role="group" aria-label={tv.creationFunctionAria}>
		{#each CREATE_PRESETS as p (p.id)}
			<button
				type="button"
				class="chip mono"
				aria-pressed={preset?.id === p.id}
				onclick={() => lab.apply({ source: { mode: 'expr', expr: p.numpy } })}>{p.torch}</button
			>
		{/each}
	</div>
	{#if preset && a}
		<div class="pair">
			<figure class="side">
				<figcaption><code>{preset.numpy}</code> <span class="muted">{tv.numpyRunsHere}</span></figcaption>
				<ArrayGrid info={a} legend={false} />
				{#if preset.random}
					<p class="small warn">{tv.randomNote(preset.torch)}</p>
				{/if}
			</figure>
			<div class="side">
				<TorchCode code={`import torch\n\nt = ${preset.torch}`} title="PyTorch" />
				<table class="props compact">
					<tbody>
						<tr><th scope="row">shape</th><td class="mono">{torchSize(a.shape)}</td></tr>
						<tr>
							<th scope="row">dtype</th>
							<td class="mono">
								{preset.dtype}
								<span class="muted">{tv.numpyHere(a.dtype, a.dtype !== preset.numpyDtype ? tv.desktopSuffix(preset.numpyDtype) : '')}</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<Explain title={tv.defaults}>
			<p>{tv.floatDefaultNote(facts.defaultFloat)}</p>
			<p class="muted">{tv.sizesNote}</p>
		</Explain>
	{:else}
		<p class="muted">{tv.pickACreationFunction}</p>
	{/if}
{:else if s.view === 'device'}
	<div class="devices" aria-label={tv.devicesAria}>
		<section class="dev here">
			<h3>{tv.cpuTitle} <span class="muted">{tv.cpuSub}</span></h3>
			<p class="mono">t.device → device(type='cpu')</p>
			<p class="small">{tv.cpuBody}</p>
		</section>
		<div class="moves" aria-hidden="true">
			<span>── t.to("cuda") ──▶</span>
			<span>◀── t.cpu() ──</span>
		</div>
		<section class="dev away">
			<h3>{tv.gpuTitle} <span class="muted">{tv.gpuSub}</span></h3>
			<p class="mono">t.device → device(type='cuda', index=0)</p>
			<p class="small">{tv.gpuBody}</p>
		</section>
	</div>
	<TorchCode
		code={`import torch\n\nt = torch.tensor([[1., 2., 3.], [4., 5., 6.]])\nprint(t.device)                  # cpu\n\ndevice = "cuda" if torch.cuda.is_available() else "cpu"\ng = t.to(device)                 # a copy in GPU memory (if there is a GPU)\nprint(g.device)\n\ny = g * 2                        # runs on the GPU\nback = y.cpu().numpy()           # .numpy() needs a CPU tensor`}
		title={tv.movingATensor}
	/>
	<Explain title={tv.rulesOfThumb}>
		<ul>
			<li>{tv.rule1}</li>
			<li>{tv.rule2}</li>
			<li>{tv.rule3}</li>
			<li>{tv.rule4}</li>
		</ul>
	</Explain>
{/if}

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.small {
		font-size: 0.82rem;
		margin: 0;
	}
	.btn.small {
		font-size: 0.8rem;
		padding: 0.25rem 0.55rem;
	}
	.honest {
		display: flex;
		gap: 0.45rem;
		align-items: flex-start;
		margin: 0;
		font-size: 0.82rem;
		color: var(--muted);
		border: 1px solid var(--border);
		background: var(--surface-sunken);
		border-radius: var(--radius-sm);
		padding: 0.4rem 0.6rem;
	}
	.honest :global(svg) {
		flex: none;
		margin-top: 0.15rem;
		color: var(--accent);
	}
	.honest strong {
		color: var(--foreground);
	}
	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
		gap: 1rem 1.5rem;
		align-items: start;
	}
	.side {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
		overflow-x: auto;
	}
	figcaption {
		font-size: 0.85rem;
	}
	.table-wrap {
		overflow-x: auto;
	}
	.props {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.86rem;
	}
	.props th,
	.props td {
		text-align: left;
		padding: 0.35rem 0.55rem;
		border-bottom: 1px solid var(--border);
		vertical-align: baseline;
	}
	.props thead th {
		font-weight: 600;
		font-size: 0.8rem;
	}
	.props tbody th {
		font-weight: 600;
		white-space: nowrap;
	}
	.props tr.focus {
		background: var(--accent-soft);
	}
	.props tr.focus th {
		color: var(--accent-strong);
	}
	.marker {
		margin-right: 0.3rem;
		color: var(--accent);
	}
	.props.compact {
		width: auto;
	}
	.arrow {
		color: var(--subtle);
	}
	.value {
		font-weight: 600;
	}
	.convert {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
		gap: 0.8rem;
	}
	.card {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		padding: 0.7rem 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		font-size: 0.88rem;
	}
	.card h3 {
		font-size: 0.9rem;
	}
	.card p {
		margin: 0;
	}
	.memory {
		display: grid;
		grid-template-columns: 1fr 1fr;
		justify-items: center;
		gap: 0.15rem 0.5rem;
		padding: 0.4rem;
		border-radius: var(--radius-sm);
		background: var(--surface-sunken);
	}
	.memory .name {
		font-weight: 700;
		border: 1.5px solid var(--foreground);
		border-radius: 999px;
		padding: 0 0.6rem;
	}
	.memory .lines {
		grid-column: 1 / -1;
		width: 100%;
		height: 14px;
		fill: none;
		stroke: var(--muted);
		stroke-width: 1.5;
		vector-effect: non-scaling-stroke;
	}
	.memory .lines path {
		vector-effect: non-scaling-stroke;
	}
	.memory .block {
		grid-column: 1 / -1;
		border: 2px solid var(--accent);
		background: var(--accent-soft);
		border-radius: var(--radius-sm);
		padding: 0.15rem 0.6rem;
		font-size: 0.78rem;
	}
	.memory.two .block {
		grid-column: auto;
		border-style: solid;
	}
	.memory.two .block:last-child {
		border-style: dashed;
		border-color: var(--g1-strong);
		background: var(--g1);
	}
	.op-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.chip {
		border: 1px solid var(--border-strong);
		background: var(--surface);
		border-radius: 999px;
		padding: 0.1rem 0.6rem;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.chip[aria-pressed='true'] {
		background: var(--accent-soft);
		border-color: var(--accent);
		font-weight: 600;
	}
	.outcome {
		margin: 0;
		font-size: 0.86rem;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.3rem;
	}
	.err {
		color: var(--error);
	}
	.outcome-list {
		margin: 0;
		font-size: 0.86rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.outcome-list dt {
		font-weight: 600;
	}
	.outcome-list dd {
		margin: 0;
	}
	.outcome.err {
		border: 1px solid var(--error);
		background: var(--error-soft);
		border-radius: var(--radius-sm);
		padding: 0.35rem 0.55rem;
		align-items: flex-start;
	}
	.warn {
		color: var(--warning);
	}
	.tag-diff {
		font-size: 0.75rem;
		border: 1px solid var(--warning);
		background: var(--warning-soft);
		color: var(--foreground);
		border-radius: 999px;
		padding: 0 0.45rem;
	}
	.devices {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		gap: 0.8rem;
		align-items: center;
	}
	.dev {
		border-radius: var(--radius);
		padding: 0.7rem 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.dev h3 {
		font-size: 0.95rem;
	}
	.dev p {
		margin: 0;
	}
	.dev.here {
		border: 2px solid var(--accent);
		background: var(--accent-soft);
	}
	.dev.away {
		border: 2px dashed var(--border-strong);
		background: var(--surface);
	}
	.moves {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-family: var(--font-mono, monospace);
		font-size: 0.78rem;
		color: var(--muted);
		white-space: nowrap;
	}
	@media (max-width: 700px) {
		.devices {
			grid-template-columns: 1fr;
		}
		.moves {
			align-items: center;
		}
	}
</style>
