<script lang="ts">
	import ArrayGrid, { type CellDecor } from './ArrayGrid.svelte';
	import Explain from '../components/Explain.svelte';
	import Tag from '../components/Tag.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import type { CombineOp } from '../lab/types';
	import { MAX_PARTS } from '../lab/codegen';
	import { formatIndex, formatShape, unravel } from '../array/normalize';
	import { idMap } from '../array/inspect';
	import { concatenatePlan, normalizeAxis, stackPlan } from '../array/combine';

	/** np.concatenate / np.stack of a and b, and np.split of a. */
	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.combine);
	const res = $derived(lab.resultFor('combine'));
	const ok = $derived(!!res && !res.error);
	const a = $derived(res ? lab.target('a') : null);
	const b = $derived(res && s.op !== 'split' ? lab.target('b') : null);
	const result = $derived(ok && s.op !== 'split' ? lab.target('result') : null);
	const src = $derived(ok ? lab.target('__src') : null);
	const partOf = $derived(ok && s.op === 'split' ? idMap(lab.target('__part')) : new Map<number, number>());
	const views = $derived(lab.target('__views')?.values ?? []);
	const parts = $derived.by(() => {
		if (!ok || s.op !== 'split') return [];
		const out = [];
		for (let i = 0; i < MAX_PARTS; i++) {
			const p = lab.target(`__p${i}`);
			if (p) out.push(p);
		}
		return out;
	});

	const ndim = $derived(a?.ndim ?? lab.provisional?.ndim ?? 2);
	const shape = $derived(a?.shape ?? lab.provisional?.shape ?? [2, 3]);
	/** stack adds an axis, so it has one more place to put it. */
	const axes = $derived(Array.from({ length: s.op === 'stack' ? ndim + 1 : Math.max(1, ndim) }, (_, i) => i));

	const OPS: { id: CombineOp; label: string; title: string }[] = [
		{ id: 'concatenate', label: 'np.concatenate', title: 'Join along an existing axis' },
		{ id: 'stack', label: 'np.stack', title: 'Join along a new axis' },
		{ id: 'split', label: 'np.split', title: 'Cut a into equal pieces' }
	];

	function setOp(op: CombineOp) {
		s.op = op;
		const n = op === 'stack' ? ndim + 1 : ndim;
		if (s.axis >= n) s.axis = 0;
	}

	const presets = $derived.by(() => {
		const size = shape.reduce((x, y) => x * y, 1);
		const count = (n: number) => Array.from({ length: n }, (_, i) => size + 1 + i);
		if (shape.length === 2) {
			const [r, c] = shape;
			const same = count(r * c);
			return [
				{ label: 'same shape', text: Array.from({ length: r }, (_, i) => same.slice(i * c, i * c + c).join(' ')).join('\n'), shape: [r, c] },
				{ label: 'one row', text: `[[${count(c).join(', ')}]]`, shape: [1, c] },
				{ label: 'one column', text: count(r).join('\n'), shape: [r, 1] },
				{ label: '1-D', text: count(c).join(' '), shape: [c] }
			];
		}
		if (shape.length === 1) {
			return [
				{ label: 'same shape', text: count(shape[0]).join(' '), shape: [shape[0]] },
				{ label: 'shorter', text: count(2).join(' '), shape: [2] }
			];
		}
		return [];
	});

	const plan = $derived(
		a && b && s.op !== 'split' ? (s.op === 'stack' ? stackPlan(a.shape, b.shape, s.axis) : concatenatePlan(a.shape, b.shape, s.axis)) : null
	);

	// ---- provenance: ids below a.size came from a, the rest from b ----
	const provenance = $derived(idMap(src));
	let hover = $state<number | null>(null);
	const focusId = $derived(hover !== null ? (provenance.get(hover) ?? null) : null);
	const badges = $derived(!!result && result.size <= 48);

	function origin(id: number): { name: 'a' | 'b'; index: number[] } | null {
		if (!a || !b) return null;
		return id < a.size ? { name: 'a', index: unravel(id, a.shape) } : { name: 'b', index: unravel(id - a.size, b.shape) };
	}
	function decorateResult(pos: number): CellDecor | undefined {
		const id = provenance.get(pos);
		if (id === undefined) return undefined;
		const o = origin(id);
		if (!o) return undefined;
		return {
			group: o.name === 'a' ? 0 : 1,
			state: focusId !== null ? (id === focusId ? 'focus' : 'dim') : undefined,
			badge: badges ? o.name : undefined,
			title: `from ${formatIndex(o.name, o.index)}`
		};
	}
	function decorateInput(name: 'a' | 'b') {
		return (flat: number): CellDecor => {
			const id = name === 'a' ? flat : flat + (a?.size ?? 0);
			return { group: name === 'a' ? 0 : 1, state: focusId !== null ? (id === focusId ? 'focus' : 'dim') : undefined };
		};
	}
	function decorateSplit(flat: number): CellDecor | undefined {
		const p = partOf.get(flat);
		return p === undefined ? undefined : { group: p, badge: shape.length <= 2 && (a?.size ?? 99) <= 48 ? `p${p}` : undefined, title: `goes to parts[${p}]` };
	}

	const call = $derived(
		s.op === 'split' ? `np.split(a, ${s.parts}, axis=${s.axis})` : `np.${s.op}([a, b], axis=${s.axis})`
	);
	const k = $derived(normalizeAxis(s.axis, s.op === 'stack' ? ndim + 1 : ndim));
	const expanded = $derived(k === null ? '' : formatShape([...shape.slice(0, k), 1, ...shape.slice(k)]));
</script>

<div class="controls">
	<span class="segmented" role="group" aria-label="Operation">
		{#each OPS as op (op.id)}
			<button type="button" class="mono" aria-pressed={s.op === op.id} title={op.title} onclick={() => setOp(op.id)}>{op.label}</button>
		{/each}
	</span>
	<span class="field">
		<span class="eyebrow" id="cb-axis">axis</span>
		<span class="segmented" role="group" aria-labelledby="cb-axis">
			{#each axes as ax (ax)}
				<button type="button" aria-pressed={s.axis === ax} onclick={() => (s.axis = ax)}>{ax}</button>
			{/each}
			<button type="button" aria-pressed={s.axis === -1} onclick={() => (s.axis = -1)} title="the last axis">−1</button>
		</span>
	</span>
	{#if s.op === 'split'}
		<span class="field">
			<span class="eyebrow" id="cb-parts">pieces</span>
			<span class="segmented" role="group" aria-labelledby="cb-parts">
				{#each Array.from({ length: MAX_PARTS }, (_, i) => i + 1) as n (n)}
					<button type="button" aria-pressed={s.parts === n} onclick={() => (s.parts = n)}>{n}</button>
				{/each}
			</span>
		</span>
	{/if}
</div>

{#if s.op !== 'split'}
	<div class="b-row">
		<label class="b-input">
			<span class="eyebrow">b — type numbers (new line = new row, [[…]] for one row)</span>
			<textarea bind:value={s.b} rows={Math.min(5, Math.max(2, s.b.split('\n').length))} spellcheck="false" class="mono"></textarea>
		</label>
		<div class="presets" role="group" aria-label="Example shapes for b">
			{#each presets as p (p.label)}
				<button type="button" class="chip" aria-pressed={s.b === p.text} onclick={() => (s.b = p.text)}>
					{p.label} <span class="mono muted">{formatShape(p.shape)}</span>
				</button>
			{/each}
		</div>
	</div>
{/if}

<RunStatus {lab} />

{#if plan?.columns.length && a && b}
	<table class="plan" aria-label="Shapes along each axis">
		<thead>
			<tr>
				<th></th>
				{#each plan.columns as c (c.axis)}
					<th scope="col" class:joined={c.status === 'add' || c.status === 'new'}>axis {c.axis}</th>
				{/each}
				<th></th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<th scope="row"><code>a</code> {formatShape(a.shape)}</th>
				{#each plan.columns as c (c.axis)}<td class:joined={c.status === 'add' || c.status === 'new'}>{c.status === 'new' ? '·' : c.a ?? '—'}</td>{/each}
				<td></td>
			</tr>
			<tr>
				<th scope="row"><code>b</code> {formatShape(b.shape)}</th>
				{#each plan.columns as c (c.axis)}<td class:joined={c.status === 'add' || c.status === 'new'}>{c.status === 'new' ? '·' : c.b ?? '—'}</td>{/each}
				<td></td>
			</tr>
			<tr class="out">
				<th scope="row"><code>result</code></th>
				{#each plan.columns as c (c.axis)}
					<td class:joined={c.status === 'add' || c.status === 'new'} class:bad={c.status === 'conflict'}>
						{#if c.status === 'add'}{c.a} + {c.b} = <strong>{c.out}</strong>
						{:else if c.status === 'new'}<strong>2</strong> <span class="note">new</span>
						{:else if c.status === 'conflict'}✕ {c.a} ≠ {c.b}
						{:else}{c.out} ✓{/if}
					</td>
				{/each}
				<td>{plan.shape ? formatShape(plan.shape) : ''}</td>
			</tr>
		</tbody>
	</table>
{/if}

{#if a && s.op !== 'split'}
	<div class="stage">
		<figure>
			<figcaption><code>a</code> <span class="muted">{formatShape(a.shape)}</span></figcaption>
			<ArrayGrid info={a} name="a" decorate={decorateInput('a')} legend={false} size="small" />
		</figure>
		{#if b}
			<div class="op mono" aria-hidden="true">,</div>
			<figure>
				<figcaption><code>b</code> <span class="muted">{formatShape(b.shape)}</span></figcaption>
				<ArrayGrid info={b} name="b" decorate={decorateInput('b')} legend={false} size="small" />
			</figure>
		{/if}
		{#if result}
			<div class="op" aria-hidden="true"><code>{call}</code><span class="big-arrow">⟶</span></div>
			<figure>
				<figcaption>
					<code>result</code> <span class="muted">{formatShape(result.shape)} · {result.dtype}</span>
					<Tag title="np.concatenate and np.stack always write into new memory">new memory (copy)</Tag>
				</figcaption>
				<ArrayGrid info={result} name="result" decorate={decorateResult} onhover={(f) => (hover = f)} size="small" />
			</figure>
		{/if}
	</div>
{/if}

{#if a && s.op === 'split'}
	<div class="stage">
		<figure>
			<figcaption><code>a</code> <span class="muted">{formatShape(a.shape)} · cut along axis {s.axis}</span></figcaption>
			<ArrayGrid info={a} name="a" decorate={decorateSplit} />
		</figure>
		{#if parts.length}
			<div class="op" aria-hidden="true"><code>{call}</code><span class="big-arrow">⟶</span></div>
			<div class="parts">
				{#each parts as p, i (i)}
					<figure>
						<figcaption>
							<code>parts[{i}]</code> <span class="muted">{formatShape(p.shape)}</span>
							<Tag tone={views[i] === 'True' ? 'accent' : 'neutral'} title="np.shares_memory(parts[{i}], a)">{views[i] === 'True' ? 'view of a' : 'copy'}</Tag>
						</figcaption>
						<ArrayGrid info={p} name="parts[{i}]" decorate={() => ({ group: i })} legend={false} size="small" />
					</figure>
				{/each}
			</div>
		{/if}
	</div>
{/if}

{#if a && (result || parts.length)}
	<Explain>
		{#if s.op === 'concatenate' && result && b}
			<p>
				<code>np.concatenate</code> joins along an <strong>existing</strong> axis: along axis {k} the sizes add up
				({plan?.columns[k ?? 0]?.a} + {plan?.columns[k ?? 0]?.b}); every other axis must already match. ndim stays {a.ndim}.
			</p>
			<p class="muted">Hover a result cell to see where it came from. The result is new memory: changing it does not change <code>a</code> or <code>b</code>.</p>
		{:else if s.op === 'stack' && result}
			<p>
				<code>np.stack</code> joins along a <strong>new</strong> axis {k}: ndim goes from {a.ndim} to {result.ndim}.
				It is the same as giving each array that axis first and then concatenating:
			</p>
			<p><code>np.concatenate([np.expand_dims(a, {k}), np.expand_dims(b, {k})], axis={k})</code> — each input becomes <code>{expanded}</code>.</p>
			{#if k === 0}<p class="muted"><code>np.expand_dims(a, 0)</code> is the same as <code>a[np.newaxis]</code>.</p>{/if}
		{:else if s.op === 'split'}
			<p>
				<code>np.split</code> cuts <code>a</code> into {parts.length} equal pieces along axis {s.axis} and returns a <strong>list</strong>.
				The pieces are <strong>views</strong>: they share memory with <code>a</code> (chapter 08).
			</p>
			<p class="muted">Pieces must be equal. For uneven pieces use <code>np.array_split</code>.</p>
		{/if}
	</Explain>
{/if}

<style>
	.controls {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
	}
	.field {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.b-row {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.5rem 1rem;
	}
	.b-input {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.b-input textarea {
		min-width: 14rem;
		font-size: 0.95rem;
		resize: vertical;
	}
	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.chip {
		border: 1px solid var(--border-strong);
		background: var(--surface);
		border-radius: 999px;
		padding: 0.1rem 0.55rem;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.chip[aria-pressed='true'] {
		background: var(--accent-soft);
		border-color: var(--accent);
	}
	.plan {
		border-collapse: collapse;
		font-size: 0.85rem;
		font-family: var(--font-mono);
		width: max-content;
		max-width: 100%;
	}
	.plan th,
	.plan td {
		padding: 0.2rem 0.7rem;
		text-align: center;
		border-bottom: 1px solid var(--border);
		white-space: nowrap;
	}
	.plan th[scope='row'] {
		text-align: left;
		font-weight: 500;
	}
	.plan thead th {
		font-size: 0.75rem;
		color: var(--muted);
		font-weight: 600;
	}
	.plan .joined {
		background: var(--accent-soft);
	}
	.plan thead .joined {
		color: var(--accent);
	}
	.plan .out td {
		border-bottom: none;
	}
	.plan .bad {
		color: var(--error);
		font-weight: 700;
	}
	.note {
		font-size: 0.7rem;
		color: var(--accent);
	}
	.stage {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem 1.4rem;
		overflow: auto;
		padding: 0.5rem 0.2rem;
	}
	.parts {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: flex-start;
	}
	figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	figcaption {
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}
	.op {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: 0.8rem;
		color: var(--muted);
	}
	.op.mono {
		font-size: 1.4rem;
	}
	.big-arrow {
		font-size: 1.6rem;
		color: var(--array-cell-highlight-border);
	}
</style>
