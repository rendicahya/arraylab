<script lang="ts">
	import ArrayGrid from '../ArrayGrid.svelte';
	import FrameTable from '../FrameTable.svelte';
	import Explain from '../../components/Explain.svelte';
	import type { CellDecor } from '../ArrayGrid.svelte';
	import type { Lab } from '../../lab/lab.svelte';
	import type { PandasAccessor } from '../../lab/types';
	import type { FrameInfo } from '../../array/types';
	import { accessorText, isSimpleSelection } from '../../pandas/codegen';
	import { idMap } from '../../array/inspect';
	import { formatShape } from '../../array/normalize';

	/** df[…], df.loc[…] (labels) and df.iloc[…] (positions). */
	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.pandas);
	const res = $derived(lab.resultFor('pandas'));
	const ok = $derived(!!res && !res.error);
	const df = $derived(res ? lab.frame('df') : null);
	const frameResult = $derived(ok ? lab.frame('result') : null);
	const scalarResult = $derived(ok ? lab.target('result') : null);
	const src = $derived(ok ? lab.target('__src') : null);

	const ACCESSORS: { id: PandasAccessor; label: string; help: string }[] = [
		{ id: '', label: 'df[ ]', help: 'Columns by label (or rows by a mask / slice)' },
		{ id: 'loc', label: 'df.loc[ ]', help: 'Rows, columns by label' },
		{ id: 'iloc', label: 'df.iloc[ ]', help: 'Rows, columns by position' }
	];

	let draft = $state('');
	$effect.pre(() => {
		draft = s.select;
	});
	const pending = $derived(draft.trim() !== s.select.trim());
	function onInput() {
		if (isSimpleSelection(draft)) s.select = draft;
	}
	function apply(event: SubmitEvent) {
		event.preventDefault();
		s.select = draft;
	}
	function choose(expr: string, accessor = s.accessor) {
		s.accessor = accessor;
		draft = expr;
		s.select = expr;
	}

	const q = (label: string, kind: string) => (kind === 'O' ? `'${label}'` : label);
	const rowLabel = (i: number) => (df ? q(df.index[i], df.indexKind) : String(i));
	const colLabel = (j: number) => (df ? q(df.columns[j], df.columnsKind) : String(j));

	const presets = $derived.by((): string[] => {
		if (!df) return [];
		const [nr, nc] = df.shape;
		const r0 = rowLabel(0);
		const r1 = rowLabel(Math.min(1, nr - 1));
		const c0 = colLabel(0);
		const c1 = colLabel(Math.min(1, nc - 1));
		const firstCol = `df[${c0}]`;
		if (s.accessor === 'loc') return [`${r0}, ${c1}`, r0, `:, ${c1}`, `${r0}:${r1}, ${c0}:${c1}`, `[${r1}, ${r0}]`, `${firstCol} > 2`];
		if (s.accessor === 'iloc') return ['0, 1', '0', ':, 1', '0:1, 0:2', '-1', '[1, 0]'];
		return [c1, `[${c0}, ${colLabel(nc - 1)}]`, `${firstCol} > 2`, '0:1'];
	});

	/** source element id → selected */
	const selected = $derived(new Set(idMap(src).values()));
	const cols = $derived(df?.previewShape[1] ?? 1);
	const hitRows = $derived(new Set([...selected].map((id) => Math.floor(id / (df?.shape[1] ?? 1)))));
	const hitCols = $derived(new Set([...selected].map((id) => id % (df?.shape[1] ?? 1))));

	function decorate(i: number, j: number): CellDecor | undefined {
		const id = i * (df?.shape[1] ?? cols) + j;
		if (!src) return undefined;
		return selected.has(id) ? { state: 'selected', title: 'selected' } : { state: 'dim' };
	}

	function pick(i: number, j: number) {
		if (s.accessor === 'iloc') choose(`${i}, ${j}`);
		else if (s.accessor === 'loc') choose(`${rowLabel(i)}, ${colLabel(j)}`);
		else choose(colLabel(j));
	}

	const expr = $derived(s.select.trim());
	const call = $derived(`${accessorText(s.accessor)}[${expr}]`);
	const sliced = $derived(/:/.test(expr.replace(/'[^']*'|"[^"]*"/g, '')) && /\w:|:\w|'\s*:|:\s*'/.test(expr));
	const intLabels = $derived(df?.indexKind === 'i' && df.indexType !== 'RangeIndex');

	function kindOf(r: FrameInfo | null): string {
		if (!r) return 'a single value (scalar)';
		return r.kind === 'series' ? 'a Series' : 'a DataFrame';
	}
</script>

<div class="pd-row">
	<div class="pd-field">
		<span class="eyebrow" id="pd-acc">Select with</span>
		<span class="segmented" role="group" aria-labelledby="pd-acc">
			{#each ACCESSORS as acc (acc.id)}
				<button type="button" title={acc.help} aria-pressed={s.accessor === acc.id} onclick={() => (s.accessor = acc.id)}>{acc.label}</button>
			{/each}
		</span>
	</div>
	<form class="expr" onsubmit={apply}>
		<label class="mono">
			<span>{accessorText(s.accessor)}[</span>
			<input
				class="pd-input"
				bind:value={draft}
				oninput={onInput}
				spellcheck="false"
				autocomplete="off"
				aria-label="Selection inside {accessorText(s.accessor)}[ ]"
				size={Math.max(8, draft.length + 1)}
			/>
			<span>]</span>
		</label>
		<button class="btn" type="submit" class:primary={pending}>Apply</button>
	</form>
</div>
<div class="pd-chips" role="group" aria-label="Example selections">
	{#each presets as p (p)}
		<button type="button" class="pd-chip" aria-pressed={s.select === p} onclick={() => choose(p)}>{accessorText(s.accessor)}[{p}]</button>
	{/each}
</div>

{#if df}
	<div class="pd-stage">
		<figure>
			<figcaption><code>df</code> <span class="muted">{formatShape(df.shape)} · click a value to select it</span></figcaption>
			<FrameTable info={df} {decorate} onselect={pick} hitRows={src ? hitRows : undefined} hitCols={src ? hitCols : undefined} />
		</figure>
		{#if frameResult || scalarResult}
			<div class="pd-op" aria-hidden="true"><code>{call}</code><span class="pd-arrow">⟶</span></div>
			<figure>
				<figcaption>
					<code>result</code>
					<span class="muted">
						{#if frameResult}{frameResult.kind === 'series' ? 'Series' : 'DataFrame'} {formatShape(frameResult.shape)}{:else if scalarResult}scalar · {scalarResult.pythonType ?? scalarResult.dtype}{/if}
					</span>
				</figcaption>
				{#if frameResult}
					<FrameTable info={frameResult} name="result" />
				{:else if scalarResult}
					<ArrayGrid info={scalarResult} name="result" legend={false} />
				{/if}
			</figure>
		{/if}
	</div>

	{#if ok}
		<Explain>
			{#if s.accessor === 'loc'}
				<p><code>.loc</code> selects by <strong>label</strong>: the names in the shaded boxes. Rows first, then columns.</p>
				{#if sliced}
					<p><strong>A label slice includes its end:</strong> <code>{rowLabel(0)}:{rowLabel(Math.min(1, df.shape[0] - 1))}</code> contains both rows. There is no “one past the end” label to stop at.</p>
				{/if}
			{:else if s.accessor === 'iloc'}
				<p><code>.iloc</code> selects by <strong>position</strong> (the small grey numbers), exactly like NumPy indexing: <code>df.iloc[i, j]</code> ↔ <code>df.to_numpy()[i, j]</code>.</p>
				{#if sliced}
					<p><strong>A position slice excludes its end</strong>, like Python and NumPy: <code>0:1</code> is only position 0.</p>
				{/if}
			{:else}
				<p>
					Plain <code>df[…]</code> selects <strong>columns</strong> by label — unlike NumPy, where <code>a[0]</code> is the first
					<em>row</em>. A boolean mask (<code>df[df['A'] > 2]</code>) or a slice (<code>df[0:1]</code>) selects rows instead.
				</p>
			{/if}
			<p>
				Selected <strong>{selected.size}</strong> of {df.size} values → {kindOf(frameResult)}{frameResult ? ` of shape ${formatShape(frameResult.shape)}` : ''}.
				{#if frameResult?.kind === 'series'}
					One axis was fixed by a single label or position, so one set of labels remains.
				{:else if !frameResult}
					One label (or position) per axis picks one value.
				{/if}
			</p>
			{#if intLabels}
				<p class="warn">
					The row labels are numbers. <code>df.loc[{df.index[0]}]</code> means the <em>label</em> {df.index[0]}, <code>df.iloc[0]</code> the first
					<em>position</em> — and <code>df.loc[0]</code> is a KeyError unless some row is labeled 0.
				</p>
			{/if}
		</Explain>
	{/if}
{/if}

<style>
	.expr {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.expr label {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		font-size: 1.05rem;
	}
	.expr input {
		min-width: 6rem;
		max-width: 22rem;
	}
	.warn {
		border-left: 3px solid var(--warning);
		padding-left: 0.5rem;
	}
</style>
