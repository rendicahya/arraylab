<script lang="ts">
	import ArrayGrid, { type CellDecor } from './ArrayGrid.svelte';
	import Explain from '../components/Explain.svelte';
	import Tag from '../components/Tag.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { isSimpleIndex } from '../lab/codegen';
	import { formatIndex, formatShape, unravel } from '../array/normalize';
	import { idMap } from '../array/inspect';
	import { describeIndex } from '../array/indexing';

	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.index);
	const res = $derived(lab.resultFor('index'));
	const a = $derived(res ? lab.target('a') : null);
	const result = $derived(res && !res.error ? lab.target('result') : null);
	const src = $derived(res && !res.error ? lab.target('__src') : null);
	const isView = $derived(lab.target('__view')?.values?.[0] === 'True');
	const ndim = $derived(a?.ndim ?? lab.provisional?.ndim ?? 2);

	let draft = $state('');
	$effect.pre(() => {
		draft = s.expr;
	});
	const pending = $derived(draft.trim() !== s.expr.trim());

	function onInput() {
		if (isSimpleIndex(draft)) s.expr = draft;
	}
	function apply(event: SubmitEvent) {
		event.preventDefault();
		s.expr = draft;
	}

	const presets = $derived(
		ndim <= 1
			? ['2', '-1', '1:4', '::2', '::-1', 'a > 3', '[0, 2, 2]']
			: ndim === 2
				? ['0, 1', '0', '0, :', ':, 1', '1:, ::2', '-1, -1', 'a > 3', 'a % 2 == 0', '[1, 0], [2, 0]', ':, None']
				: ['0', '0, 1', '0, 1, 2', ':, :, 0', '..., 0', ':, 1:, ::2', 'a > 10']
	);

	/** result flat position → source flat id */
	const provenance = $derived(idMap(src));
	/** source flat id → result positions (several with fancy indexing) */
	const selected = $derived.by(() => {
		const m = new Map<number, number[]>();
		for (const [pos, id] of provenance) m.set(id, [...(m.get(id) ?? []), pos]);
		return m;
	});
	const scalarResult = $derived(!!result && result.kind === 'scalar');

	let hoverSource = $state<number | null>(null);
	let hoverResult = $state<number | null>(null);
	const focusId = $derived(
		hoverResult !== null ? (provenance.get(hoverResult) ?? null) : hoverSource
	);

	const advanced = $derived(/[[\]<>=]|\ba\b/.test(s.expr));

	function decorateSource(flat: number): CellDecor | undefined {
		const hit = selected.get(flat);
		if (!hit) return focusId !== null ? { state: 'dim' } : undefined;
		return {
			state: focusId === null || focusId === flat ? 'selected' : 'dim',
			badge: advanced && result && result.ndim === 1 && result.size <= 30 ? hit.join(',') : undefined,
			title: `selected → result position ${hit.join(', ')}`
		};
	}

	function decorateResult(pos: number): CellDecor {
		const id = provenance.get(pos);
		const from = id !== undefined && a ? formatIndex('a', unravel(id, a.shape)) : '';
		return {
			state: focusId !== null && id !== focusId ? 'dim' : focusId !== null ? 'selected' : undefined,
			title: from ? `copied from ${from}` : undefined
		};
	}

	function pick(_flat: number, index: number[]) {
		const expr = index.join(', ');
		draft = expr;
		s.expr = expr;
	}

	const parts = $derived(a ? describeIndex(s.expr, a.ndim) : []);
</script>

<form class="controls" onsubmit={apply}>
	<label class="expr mono">
		<span>a[</span>
		<input
			bind:value={draft}
			oninput={onInput}
			spellcheck="false"
			autocomplete="off"
			aria-label="Index expression inside a[ ]"
			size={Math.max(8, draft.length + 1)}
		/>
		<span>]</span>
	</label>
	<button class="btn" type="submit" class:primary={pending}>Apply</button>
	{#if pending}<span class="muted small">Press Enter to run this expression.</span>{/if}
</form>
<div class="presets" role="group" aria-label="Example indices">
	{#each presets as p (p)}
		<button type="button" class="chip mono" aria-pressed={s.expr === p} onclick={() => ((draft = p), (s.expr = p))}>a[{p}]</button>
	{/each}
</div>

<RunStatus {lab} />

{#if a}
	<div class="stage">
		<figure>
			<figcaption><code>a</code> <span class="muted">{formatShape(a.shape)} · click a cell to index it</span></figcaption>
			<ArrayGrid info={a} decorate={decorateSource} onselect={pick} onhover={(f) => (hoverSource = f)} />
		</figure>
		{#if result}
			<div class="op" aria-hidden="true"><code>a[{s.expr}]</code><span class="big-arrow">⟶</span></div>
			<figure>
				<figcaption>
					<code>result</code>
					<span class="muted">{scalarResult ? `scalar · ${result.pythonType}` : `${formatShape(result.shape)} · ${result.dtype}`}</span>
					{#if !scalarResult}
						<Tag tone={isView ? 'accent' : 'neutral'} title="np.shares_memory(result, a)">
							{isView ? 'view of a' : 'copy'}
						</Tag>
					{/if}
				</figcaption>
				<ArrayGrid info={result} name="result" decorate={decorateResult} onhover={(f) => (hoverResult = f)} legend={false} />
			</figure>
		{/if}
	</div>

	{#if result}
		<Explain>
			<ul>
				{#each parts as part, i (i)}
					<li><code>{part.text}</code> — {part.meaning}</li>
				{/each}
			</ul>
			<p>
				Selected <strong>{selected.size}</strong> of {a.size} elements.
				{#if scalarResult}
					With an integer for every axis you get <strong>one element</strong> — a NumPy scalar
					(<code>{result.pythonType}</code>), not an array.
				{:else}
					Result shape <code>{formatShape(result.shape)}</code>, ndim {result.ndim}.
					{#if isView}
						It is a <strong>view</strong>: it shares memory with <code>a</code>, so writing to it changes <code>a</code>.
					{:else}
						It is a <strong>copy</strong>: changing it does not change <code>a</code>.
					{/if}
				{/if}
			</p>
		</Explain>
	{/if}
{/if}

<style>
	.controls {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.expr {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		font-size: 1.1rem;
	}
	.expr input {
		font-family: var(--font-mono);
		font-size: 1rem;
		min-width: 6rem;
		max-width: 22rem;
	}
	.small {
		font-size: 0.82rem;
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
	.chip:hover {
		border-color: var(--accent);
	}
	.chip[aria-pressed='true'] {
		background: var(--accent-soft);
		border-color: var(--accent);
		color: var(--accent);
	}
	.stage {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem 1.5rem;
		overflow: auto;
		padding: 0.5rem 0.2rem;
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
	.big-arrow {
		font-size: 1.6rem;
		color: var(--array-cell-highlight-border);
	}
</style>
