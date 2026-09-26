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

	let { lab }: { lab: Lab } = $props();

	const VIEWS: { id: TorchView; label: string }[] = [
		{ id: 'tensor', label: 'ndarray vs Tensor' },
		{ id: 'convert', label: 'Convert' },
		{ id: 'ops', label: 'Operations' },
		{ id: 'create', label: 'Create' },
		{ id: 'device', label: 'Device' }
	];

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
	<span class="segmented" role="group" aria-label="PyTorch view">
		{#each VIEWS as v (v.id)}
			<button type="button" aria-pressed={s.view === v.id} onclick={() => (s.view = v.id)}>{v.label}</button>
		{/each}
	</span>
	<a class="btn small colab" href={colabUrl('pytorch.ipynb')} target="_blank" rel="noopener">
		Run the PyTorch side in Colab <Icon name="arrowRight" size={13} />
	</a>
</div>

<p class="honest" role="note">
	<Icon name="info" size={15} />
	<span>
		<strong>NumPy runs here for real; PyTorch does not run in the browser.</strong> PyTorch code is shown next to it, and every
		PyTorch result stated here (dtypes, errors) was recorded with PyTorch {TORCH_VERSION}.
	</span>
</p>

<RunStatus {lab} />

{#if s.view === 'tensor' && a}
	<div class="pair">
		<figure class="side">
			<figcaption><code>a</code> <span class="muted">NumPy ndarray · runs here</span></figcaption>
			<ArrayGrid info={a} legend={false} />
		</figure>
		<div class="side">
			<TorchCode code={`import torch\n\n${tensorCode}`} title="t — the same numbers as a PyTorch Tensor" />
			<p class="muted small">Same values, same shape, same axes: a tensor is PyTorch's n-dimensional array.</p>
		</div>
	</div>

	{#if ready}
		<div class="table-wrap">
			<table class="props">
				<thead>
					<tr><th scope="col"></th><th scope="col">NumPy <span class="muted">(live)</span></th><th scope="col">PyTorch <span class="muted">(recorded)</span></th></tr>
				</thead>
				<tbody>
					{#each rows as row (row.key)}
						<tr class:focus={row.focus && row.focus === s.focus}>
							<th scope="row">{#if row.focus && row.focus === s.focus}<span class="marker" aria-label="this step">▶</span>{/if}{row.key}</th>
							<td><code>{row.np}</code> <span class="arrow">→</span> <span class="mono value">{row.npValue}</span></td>
							<td><code>{row.torch}</code> <span class="arrow">→</span> <span class="mono value">{row.torchValue}</span></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<Explain title="What differs">
			{#if t.how === 'tensor' && tDtype && tDtype !== torchDtypeOf(a.dtype)}
				<p>
					Same typed numbers, different dtype: NumPy made <code>{a.dtype}</code>, PyTorch makes <code>{tDtype}</code>.
					{#if a.dtypeKind === 'f'}
						PyTorch's default float is <strong>float32</strong> ({fromList.float}); NumPy's is float64. Deep learning rarely needs
						float64 precision, and float32 is half the memory and much faster on GPUs.
					{:else if 'iu'.includes(a.dtypeKind)}
						From Python integers PyTorch always makes <strong>int64</strong>.
					{:else if a.dtypeKind === 'c'}
						From Python complex numbers PyTorch makes complex64 (two float32s); NumPy makes complex128.
					{/if}
				</p>
			{:else}
				<p>Here both libraries agree on the dtype: <code>{a.dtype}</code> ↔ <code>{tDtype}</code>.</p>
			{/if}
			{#if intDefaultNote}
				<p class="muted">
					NumPy's int32 is specific to this browser (32-bit WebAssembly). Desktop NumPy on a 64-bit system makes int64 — the
					same as PyTorch.
				</p>
			{/if}
			<p>
				The shape is a <code>torch.Size</code>, which is a tuple (<code>t.shape[0]</code>, <code>t.size(1)</code> and unpacking
				all work). <code>numel()</code> is NumPy's <code>size</code> — in PyTorch, <code>t.size()</code> means the <em>shape</em>.
			</p>
		</Explain>
	{/if}
{:else if s.view === 'convert' && a}
	<div class="convert">
		<section class="card">
			<h3><code>torch.from_numpy(a)</code></h3>
			<div class="memory" aria-label="a and t share one block of memory">
				<span class="name mono">a</span><span class="name mono">t</span>
				<svg class="lines" viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true"><path d="M 25 0 L 48 14 M 75 0 L 52 14" /></svg>
				<span class="block">one shared block · {ready ? `${a.nbytes} bytes` : '…'}</span>
			</div>
			<p><strong>Shares memory</strong> with <code>a</code>: change <code>a[0, 0]</code> and <code>t</code> changes too. dtype is kept:
				{#if ready}<code>{a.dtype}</code> → <code>{torchDtypeOf(a.dtype)}</code>.{/if}</p>
			<p class="muted small">Like a NumPy view (chapter 02): two names, one block of numbers.</p>
		</section>
		<section class="card">
			<h3><code>torch.tensor(data)</code></h3>
			<div class="memory two" aria-label="a and t have separate memory">
				<span class="name mono">a</span><span class="name mono">t</span>
				<span class="block">block 1</span><span class="block">block 2 (copy)</span>
			</div>
			<p><strong>Copies</strong> the data: later changes to <code>a</code> do not reach <code>t</code>.</p>
			<p class="muted small">
				From a Python list PyTorch picks its own dtype ({fromList.int.replace('torch.', '')} for integers,
				{fromList.float.replace('torch.', '')} for floats). From an ndarray it keeps the array's dtype.
			</p>
		</section>
		<section class="card">
			<h3><code>t.numpy()</code></h3>
			<div class="memory" aria-label="t and the new array share memory">
				<span class="name mono">t</span><span class="name mono">b</span>
				<svg class="lines" viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true"><path d="M 25 0 L 48 14 M 75 0 L 52 14" /></svg>
				<span class="block">one shared block</span>
			</div>
			<p>Back to NumPy, again <strong>sharing memory</strong>. Works only for CPU tensors.</p>
			<p class="muted small">
				A tensor that requires grad must be detached first — otherwise PyTorch raises
				<span class="mono">{TORCH_REFERENCE.autograd.numpyOfGrad.split('. ')[0]}.</span> Use <code>t.detach().numpy()</code>.
			</p>
		</section>
	</div>
	<TorchCode
		code={`import numpy as np\nimport torch\n\n${t.how === 'tensor' ? t.code.replace(/^t = torch\.tensor\(/, 'a = np.array(') : `a = ${source.expr.trim()}`}\n\nt = torch.from_numpy(a)   # shares memory\nc = torch.tensor(a)       # copy\n\na[0, 0] = 100\nprint(t[0, 0])   # 100 — same memory\nprint(c[0, 0])   # unchanged — a copy\n\nb = t.numpy()    # back to NumPy, shares memory with t`}
		title="Try it with PyTorch"
	/>
	{#if ready && a.ndim !== 2}
		<p class="muted small">The snippet indexes with <code>[0, 0]</code>; with a {a.ndim}-D array use {a.ndim === 0 ? 'a 2-D array' : `${a.ndim} indices`}.</p>
	{/if}
{:else if s.view === 'ops' && a}
	<div class="op-picker" role="group" aria-label="Operation">
		{#each TORCH_OPS as o (o.id)}
			<button type="button" class="chip" aria-pressed={s.op === o.id} onclick={() => (s.op = o.id)}>{o.label}</button>
		{/each}
	</div>
	<div class="pair">
		<figure class="side">
			<figcaption><code>{op.numpy}</code> <span class="muted">NumPy · runs here</span></figcaption>
			{#if result}
				<ArrayGrid info={result} name="result" legend={false} />
				<p class="small mono">shape {formatShape(result.shape)} · dtype {result.dtype}</p>
			{:else if res?.error}
				<p class="small err">NumPy raised {res.error.type}: {res.error.message}</p>
			{/if}
		</figure>
		<div class="side">
			<TorchCode code={`${tensorCode}\n\nresult = ${op.torch}`} title="The same in PyTorch" />
			{#if opResult && 'error' in opResult}
				<p class="outcome err" role="note">
					<Icon name="alert" size={14} />
					<span>PyTorch raises <span class="mono">{opResult.error}</span></span>
				</p>
			{:else if opResult && result}
				<dl class="outcome-list">
					<dt>PyTorch result <span class="muted">(recorded)</span></dt>
					<dd>same values · shape <code>{torchSize(result.shape)}</code> · dtype <code>{opResult.dtype}</code></dd>
					{#if torchDtypeOf(result.dtype) !== opResult.dtype}
						<dd><span class="tag-diff">dtype differs: NumPy gave {result.dtype}</span></dd>
					{/if}
				</dl>
			{/if}
		</div>
	</div>
	{#if op.note}
		<Explain title="Note"><p><RichText text={op.note} /></p></Explain>
	{/if}
{:else if s.view === 'create'}
	<div class="op-picker" role="group" aria-label="Creation function">
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
				<figcaption><code>{preset.numpy}</code> <span class="muted">NumPy · runs here</span></figcaption>
				<ArrayGrid info={a} legend={false} />
				{#if preset.random}
					<p class="small warn">Random values come from NumPy's generator. <code>{preset.torch}</code> draws different numbers — only the shape and dtype carry over.</p>
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
								<span class="muted">· NumPy here: {a.dtype}{a.dtype !== preset.numpyDtype ? ` (desktop: ${preset.numpyDtype})` : ''}</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
		<Explain title="Defaults">
			<p>
				PyTorch creates floating-point tensors as <strong>float32</strong> by default (<code>torch.get_default_dtype()</code> →
				<code>{facts.defaultFloat}</code>); NumPy uses float64. Integer tensors are <strong>int64</strong>.
			</p>
			<p class="muted">PyTorch takes sizes as separate numbers (<code>torch.zeros(2, 3)</code>) or a tuple (<code>torch.zeros((2, 3))</code>); NumPy needs the tuple.</p>
		</Explain>
	{:else}
		<p class="muted">Pick a creation function to see the tensor it makes.</p>
	{/if}
{:else if s.view === 'device'}
	<div class="devices" aria-label="Where a tensor's numbers are stored">
		<section class="dev here">
			<h3>CPU <span class="muted">· main memory (RAM)</span></h3>
			<p class="mono">t.device → device(type='cpu')</p>
			<p class="small">Where every tensor starts, and where NumPy arrays always live. <strong>ArrayLab runs everything here</strong>, in your browser.</p>
		</section>
		<div class="moves" aria-hidden="true">
			<span>── t.to("cuda") ──▶</span>
			<span>◀── t.cpu() ──</span>
		</div>
		<section class="dev away">
			<h3>GPU <span class="muted">· its own memory</span></h3>
			<p class="mono">t.device → device(type='cuda', index=0)</p>
			<p class="small">Only with an NVIDIA GPU (<code>cuda</code>) or an Apple-silicon Mac (<code>mps</code>). <strong>Not available in ArrayLab</strong> — nothing here pretends to be a GPU.</p>
		</section>
	</div>
	<TorchCode
		code={`import torch\n\nt = torch.tensor([[1., 2., 3.], [4., 5., 6.]])\nprint(t.device)                  # cpu\n\ndevice = "cuda" if torch.cuda.is_available() else "cpu"\ng = t.to(device)                 # a copy in GPU memory (if there is a GPU)\nprint(g.device)\n\ny = g * 2                        # runs on the GPU\nback = y.cpu().numpy()           # .numpy() needs a CPU tensor`}
		title="Moving a tensor"
	/>
	<Explain title="Rules of thumb">
		<ul>
			<li><code>.to(device)</code> returns a <strong>copy</strong> on the other device; the original stays where it was.</li>
			<li>Tensors in one operation must be on the <strong>same device</strong>; mixing CPU and GPU tensors raises a RuntimeError.</li>
			<li>NumPy only understands CPU memory: move back with <code>.cpu()</code> before <code>.numpy()</code>.</li>
			<li>In Colab: <em>Runtime → Change runtime type → GPU</em>, then <code>torch.cuda.is_available()</code> returns True.</li>
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
