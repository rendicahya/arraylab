<script lang="ts">
	import ArrayGrid, { type CellDecor } from './ArrayGrid.svelte';
	import Explain from '../components/Explain.svelte';
	import RichText from '../components/RichText.svelte';
	import Tag from '../components/Tag.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { VIEW_SUFFIX } from '../lab/codegen';
	import { formatIndex, formatShape, unravel } from '../array/normalize';
	import { idMap } from '../array/inspect';
	import { copyReason, strideSteps, type ViewKind } from '../array/views';

	/** b = a<suffix>: same object, view or copy? Write into b and watch a. */
	let { lab }: { lab: Lab } = $props();

	const MAX_STRIP = 40;

	const s = $derived(lab.settings.views);
	const res = $derived(lab.resultFor('views'));
	const ok = $derived(!!res && !res.error);
	const a = $derived(res ? lab.target('a') : null);
	const a0 = $derived(ok ? lab.target('__a0') : null);
	const b0 = $derived(ok ? lab.target('__b0') : null);
	const b = $derived(ok ? lab.target('b') : null);
	const src = $derived(ok ? lab.target('__src') : null);
	const shared = $derived(lab.target('__shared')?.values?.[0] === 'True');
	const same = $derived(lab.target('__same')?.values?.[0] === 'True');
	const kind = $derived<ViewKind | null>(
		!b ? null : same ? 'same' : b.kind === 'scalar' ? 'scalar' : shared ? 'view' : 'copy'
	);
	const shape = $derived(a?.shape ?? lab.provisional?.shape ?? [2, 3]);

	let draft = $state('');
	$effect.pre(() => {
		draft = s.suffix;
	});
	const pending = $derived(draft.trim() !== s.suffix.trim());
	function apply(event: SubmitEvent) {
		event.preventDefault();
		s.suffix = draft.trim();
	}
	function pick(suffix: string) {
		draft = suffix;
		s.suffix = suffix;
	}

	const presets = $derived.by((): { suffix: string; note: string }[] => {
		if (shape.length === 1) {
			return [
				{ suffix: '', note: 'same' },
				{ suffix: '[1:]', note: 'slice' },
				{ suffix: '[::2]', note: 'slice' },
				{ suffix: '[::-1]', note: 'slice' },
				{ suffix: '.reshape(-1, 1)', note: 'reshape' },
				{ suffix: '[[0, 1]]', note: 'list' },
				{ suffix: '[a > 2]', note: 'mask' },
				{ suffix: '.copy()', note: 'copy' }
			];
		}
		if (shape.length === 2) {
			const [r, c] = shape;
			return [
				{ suffix: '', note: 'same' },
				{ suffix: '[0]', note: 'row' },
				{ suffix: '[:, 1]', note: 'column' },
				{ suffix: '[:, ::2]', note: 'slice' },
				{ suffix: '.T', note: 'transpose' },
				{ suffix: `.reshape(${c}, ${r})`, note: 'reshape' },
				{ suffix: '.ravel()', note: 'ravel' },
				{ suffix: '.flatten()', note: 'flatten' },
				{ suffix: r >= 2 ? '[[0, 1]]' : '[[0, 0]]', note: 'list' },
				{ suffix: '[a > 2]', note: 'mask' },
				{ suffix: '.copy()', note: 'copy' },
				{ suffix: '.T.ravel()', note: 'T then ravel' }
			];
		}
		return [
			{ suffix: '', note: 'same' },
			{ suffix: '[0]', note: 'block' },
			{ suffix: '[..., 0]', note: 'slice' },
			{ suffix: '.T', note: 'transpose' },
			{ suffix: '.ravel()', note: 'ravel' },
			{ suffix: '[a > 2]', note: 'mask' },
			{ suffix: '.copy()', note: 'copy' }
		];
	});

	/** b's flat position → id of the element of a it came from. */
	const provenance = $derived(idMap(src));
	/** a's flat id → b positions that read it. */
	const used = $derived.by(() => {
		const m = new Map<number, number[]>();
		for (const [pos, id] of provenance) m.set(id, [...(m.get(id) ?? []), pos]);
		return m;
	});

	let hoverB = $state<number | null>(null);
	let hoverA = $state<number | null>(null);
	const focusId = $derived(hoverB !== null ? (provenance.get(hoverB) ?? null) : hoverA);
	const smallB = $derived(!!b && b.size <= 24);
	const linked = $derived(kind === 'same' || kind === 'view');

	function decorateA(flat: number): CellDecor | undefined {
		const hit = used.get(flat);
		if (!hit) return focusId !== null ? { state: 'dim' } : undefined;
		const where = hit.map((p) => (b ? formatIndex('b', unravel(p, b.shape)) : '')).join(', ');
		return {
			state: focusId === null || focusId === flat ? 'selected' : 'dim',
			badge: smallB && kind !== 'same' ? hit.join(',') : undefined,
			title: linked ? `the same memory as ${where}` : `copied into ${where}`
		};
	}
	function decorateB(pos: number): CellDecor | undefined {
		const id = provenance.get(pos);
		if (focusId !== null) return { state: id === focusId ? 'selected' : 'dim' };
		return {
			badge: smallB && kind !== 'same' ? String(pos) : undefined,
			title: id !== undefined && a ? `${linked ? 'is' : 'copied from'} ${formatIndex('a', unravel(id, a.shape))}` : undefined
		};
	}

	/** a's memory as one row, in the order the bytes are stored. */
	const strip = $derived(
		a0 && a && a.cContiguous && !a0.truncated && a0.size <= MAX_STRIP ? (a0.values ?? []) : null
	);
	const bStrip = $derived(b0 && !b0.truncated && b0.size <= MAX_STRIP && kind === 'copy' ? (b0.values ?? []) : null);
	const steps = $derived(b && kind === 'view' ? strideSteps(b.strides, b.itemsize) : []);

	/** Elements of a that the write changed (compared with a fresh copy made before). */
	const changed = $derived.by(() => {
		const out = new Set<number>();
		if (!s.write || !a || !a0?.values || !a.values) return out;
		a.values.forEach((v, i) => {
			if (v !== a0.values![i]) out.add(i);
		});
		return out;
	});
	function decorateAfter(flat: number): CellDecor | undefined {
		return changed.has(flat) ? { state: 'changed', title: 'changed by writing into b' } : undefined;
	}

	const code = $derived(`b = a${s.suffix}`);
	const valid = $derived(VIEW_SUFFIX.test(draft.trim()));
</script>

<form class="controls" onsubmit={apply}>
	<label class="expr mono">
		<span>b = a</span>
		<input
			bind:value={draft}
			spellcheck="false"
			autocomplete="off"
			aria-label="What follows a, e.g. [:, 1] or .T (empty: b = a)"
			placeholder="(nothing)"
			size={Math.max(8, draft.length + 1)}
		/>
	</label>
	<button class="btn" type="submit" class:primary={pending} disabled={!valid}>Apply</button>
	<label class="check">
		<input type="checkbox" bind:checked={s.write} />
		<span>then write into b: <code>b[...] = 99</code></span>
	</label>
</form>
<div class="presets" role="group" aria-label="Ways to make b from a">
	{#each presets as p (p.suffix)}
		<button type="button" class="chip mono" aria-pressed={s.suffix === p.suffix} title={p.note} onclick={() => pick(p.suffix)}>
			b = a{p.suffix}
		</button>
	{/each}
</div>

<RunStatus {lab} />

{#if a && a0 && b0 && kind}
	<div class="stage">
		<figure>
			<figcaption><code>a</code> <span class="muted">{formatShape(a0.shape)}{s.write ? ' · before the write' : ''}</span></figcaption>
			<ArrayGrid info={a0} name="a" decorate={decorateA} onhover={(f) => (hoverA = f)} legend={false} />
		</figure>
		<div class="op" aria-hidden="true"><code>{code}</code><span class="big-arrow">⟶</span></div>
		<figure>
			<figcaption>
				<code>b</code>
				<span class="muted">{b0.kind === 'scalar' ? `scalar · ${b0.pythonType}` : `${formatShape(b0.shape)} · ${b0.dtype}`}</span>
				<Tag tone={linked ? 'accent' : 'neutral'} title="np.shares_memory(a, b) → {shared ? 'True' : 'False'}">
					{kind === 'same' ? 'the same array (b is a)' : kind === 'view' ? 'view of a' : kind === 'scalar' ? 'scalar (copied value)' : 'copy'}
				</Tag>
			</figcaption>
			<ArrayGrid info={b0} name="b" decorate={decorateB} onhover={(f) => (hoverB = f)} legend={false} />
		</figure>
	</div>

	{#if strip}
		<section class="memory" aria-label="Memory">
			<h3 class="eyebrow">Memory · one row of bytes, {a0.itemsize} per element</h3>
			<div class="strip-row">
				<span class="who mono">{kind === 'same' ? 'a, b' : kind === 'view' ? 'a (b looks into it)' : 'a'}</span>
				<ol class="strip" aria-label="a's elements in memory order">
					{#each strip as v, i (i)}
						{@const hit = used.get(i)}
						<li
							class="slot"
							class:hit={!!hit && linked}
							class:copied={!!hit && !linked}
							class:focus={focusId === i}
							title={hit ? `${linked ? 'shared with' : 'copied to'} b position ${hit.join(', ')}` : undefined}
						>
							<span class="v mono">{v}</span>
							{#if hit && linked && kind === 'view'}<span class="pos mono">b{hit.length === 1 ? `·${hit[0]}` : ''}</span>{/if}
						</li>
					{/each}
				</ol>
			</div>
			{#if bStrip}
				<div class="strip-row">
					<span class="who mono">b</span>
					<ol class="strip own" aria-label="b's own memory">
						{#each bStrip as v, i (i)}
							<li class="slot own" class:focus={hoverB === i}><span class="v mono">{v}</span></li>
						{/each}
					</ol>
					<span class="muted small">separate block</span>
				</div>
			{/if}
			{#if kind === 'view' && steps.length}
				<p class="small muted">
					<code>b.strides = ({b?.strides.join(', ')}{b?.strides.length === 1 ? ',' : ''})</code> — to move along
					{#each steps as st, ax (ax)}
						{ax ? '; ' : ''}axis {ax} of b: <strong>{st}</strong>
					{/each}
					in <code>a</code>’s memory.
				</p>
			{/if}
		</section>
	{/if}

	{#if s.write && b && a}
		<div class="stage after" aria-label="After the write">
			<figure>
				<figcaption><code>b</code> <span class="muted">after <code>b[...] = 99</code></span></figcaption>
				<ArrayGrid info={b} name="b" legend={false} size="small" />
			</figure>
			<figure>
				<figcaption>
					<code>a</code> <span class="muted">after</span>
					<Tag tone={changed.size ? 'warning' : 'success'}>
						{changed.size ? `${changed.size} element${changed.size === 1 ? '' : 's'} changed` : 'unchanged'}
					</Tag>
				</figcaption>
				<ArrayGrid info={a} name="a" decorate={decorateAfter} legend={false} size="small" />
			</figure>
		</div>
	{/if}

	<Explain>
		{#if kind === 'same'}
			<p>
				<code>b = a</code> copies <strong>nothing</strong>: <code>b</code> is a second name for the same array
				(<code>b is a</code> → True).
				{#if s.write}Writing into <code>b</code> is writing into <code>a</code>.{/if}
			</p>
		{:else if kind === 'view'}
			<p>
				<code>b</code> is a <strong>view</strong>: a new array object that looks into <code>a</code>’s memory
				(<code>np.shares_memory(a, b)</code> → True). Nothing was copied — only a new shape and strides.
			</p>
			{#if s.write}
				<p>Writing into <code>b</code> changed <strong>{changed.size}</strong> element{changed.size === 1 ? '' : 's'} of <code>a</code> (dashed).</p>
			{:else}
				<p>Tick <em>write into b</em> to see what that means for <code>a</code>.</p>
			{/if}
		{:else if kind === 'scalar'}
			<p>
				One integer per axis gives a single element: a NumPy scalar, not an array. Its value is <strong>copied out</strong>, so it is
				not linked to <code>a</code>{#if s.write} — and a scalar cannot be written into{/if}.
			</p>
		{:else}
			<p>
				<code>b</code> is a <strong>copy</strong> with its own memory (<code>np.shares_memory(a, b)</code> → False).
				<RichText text={copyReason(s.suffix)} />
			</p>
			<p>{s.write ? 'Writing into b left a unchanged.' : 'Writing into b will not change a.'}</p>
		{/if}
		{#if kind === 'view' || kind === 'same'}
			<p class="muted">Need an independent array? <code>b = a{s.suffix}.copy()</code></p>
		{/if}
	</Explain>
{/if}

<style>
	.controls {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem 0.8rem;
	}
	.expr {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 1.1rem;
	}
	.expr input {
		font-family: var(--font-mono);
		font-size: 1rem;
		min-width: 6rem;
		max-width: 22rem;
	}
	.check {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.9rem;
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
	.stage.after {
		border-top: 1px dashed var(--border);
		padding-top: 0.8rem;
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
	.big-arrow {
		font-size: 1.6rem;
		color: var(--array-cell-highlight-border);
	}
	.memory {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}
	.strip-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		flex-wrap: wrap;
	}
	.who {
		font-size: 0.8rem;
		color: var(--muted);
		min-width: 9.5rem;
	}
	.strip {
		display: flex;
		flex-wrap: wrap;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1.5px solid var(--border-strong);
		border-radius: 4px;
		overflow: hidden;
	}
	.slot {
		position: relative;
		min-width: 2.3rem;
		height: 2.1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--array-cell);
		border-right: 1px solid var(--array-cell-border);
		font-size: 0.85rem;
		line-height: 1.1;
	}
	.slot:last-child {
		border-right: none;
	}
	.slot.hit {
		background: var(--array-cell-highlight);
		font-weight: 700;
		box-shadow: inset 0 -3px 0 var(--array-cell-highlight-border);
	}
	.slot.copied {
		box-shadow: inset 0 -3px 0 var(--border-strong);
	}
	.slot.focus {
		outline: 2.5px solid var(--accent);
		outline-offset: -2.5px;
	}
	.slot .pos {
		font-size: 0.6rem;
		color: var(--array-cell-highlight-border);
		font-weight: 600;
	}
	.strip.own {
		border-style: dashed;
	}
	.small {
		font-size: 0.82rem;
	}
	p.small {
		margin: 0;
	}
</style>
