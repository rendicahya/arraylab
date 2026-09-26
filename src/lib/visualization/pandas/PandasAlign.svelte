<script lang="ts">
	import Explain from '../../components/Explain.svelte';
	import type { Lab } from '../../lab/lab.svelte';
	import { PANDAS_OPS } from '../../pandas/codegen';

	/** s1 + s2: pandas matches labels, NumPy matches positions. */
	let { lab }: { lab: Lab } = $props();

	const s = $derived(lab.settings.pandas);
	const res = $derived(lab.resultFor('pandas'));
	const ok = $derived(!!res && !res.error);
	const s1 = $derived(res ? lab.frame('s1') : null);
	const s2 = $derived(res ? lab.frame('s2') : null);
	const result = $derived(ok ? lab.frame('result') : null);
	const positional = $derived(ok ? lab.target('positional') : null);
	/** Each result label with the s1 and s2 values that carry the same label (labels are unique). */
	const aligned = $derived.by(() => {
		if (!result || !s1 || !s2) return [];
		const valueOf = (s: typeof s1, label: string) => {
			const i = s!.index.indexOf(label);
			return i >= 0 ? s!.values[i] : null;
		};
		return result.index.map((label, i) => ({
			label,
			l: valueOf(s1, label),
			r: valueOf(s2, label),
			out: result.values[i]
		}));
	});
	const firstMatch = $derived(aligned.find((row) => row.l !== null && row.r !== null)?.label);
	const unmatched = $derived(aligned.filter((row) => row.l === null || row.r === null).map((row) => row.label));
	const byPosition = $derived.by(() => {
		if (!s1 || !s2) return [];
		const n = Math.max(s1.shape[0], s2.shape[0]);
		return Array.from({ length: n }, (_, i) => ({
			l: s1.index[i] !== undefined ? { label: s1.index[i], value: s1.values[i] } : null,
			r: s2.index[i] !== undefined ? { label: s2.index[i], value: s2.values[i] } : null,
			out: positional?.values?.[i]
		}));
	});
	const sameOrder = $derived(!!s1 && !!s2 && s1.index.join('\u0000') === s2.index.join('\u0000'));
	const mismatchedPairs = $derived(byPosition.filter((p) => p.l && p.r && p.l.label !== p.r.label).length);
	const lengthsDiffer = $derived(!!s1 && !!s2 && s1.shape[0] !== s2.shape[0]);
	const q = (label: string) => (s1?.indexKind === 'O' || s2?.indexKind === 'O' ? `'${label}'` : label);
	const method = $derived(PANDAS_OPS.find((o) => o.op === s.op)?.method ?? 'add');
</script>

<div class="pd-row" role="group" aria-label="Two Series">
	<label class="pd-field">
		<span class="eyebrow">s1 · label:value</span>
		<input class="pd-input" bind:value={s.left} spellcheck="false" autocomplete="off" size="18" />
	</label>
	<div class="pd-field">
		<span class="eyebrow" id="pd-op">op</span>
		<span class="segmented" role="group" aria-labelledby="pd-op">
			{#each PANDAS_OPS as o (o.op)}
				<button type="button" aria-pressed={s.op === o.op} onclick={() => (s.op = o.op)}>{o.op}</button>
			{/each}
		</span>
	</div>
	<label class="pd-field">
		<span class="eyebrow">s2 · label:value</span>
		<input class="pd-input" bind:value={s.right} spellcheck="false" autocomplete="off" size="18" />
	</label>
	<label class="check">
		<input type="checkbox" bind:checked={s.fill} />
		<code>s1.{method}(s2, fill_value=0)</code>
	</label>
</div>

{#if result && s1 && s2}
	<div class="compare">
		<section class="panel" aria-labelledby="by-label">
			<h3 id="by-label">pandas · matched by <strong>label</strong></h3>
			<table class="aligned">
				<thead>
					<tr><th scope="col">label</th><th scope="col">s1</th><th></th><th scope="col">s2</th><th></th><th scope="col">result</th></tr>
				</thead>
				<tbody>
					{#each aligned as row (row.label)}
						{@const gap = row.l === null || row.r === null}
						<tr class:gap>
							<th scope="row" class="lab mono">{row.label}</th>
							<td class="val mono" class:absent={row.l === null}>{row.l ?? '—'}</td>
							<td class="op mono" aria-hidden="true">{s.op}</td>
							<td class="val mono" class:absent={row.r === null}>{row.r ?? '—'}</td>
							<td class="op mono" aria-hidden="true">=</td>
							<td class="val mono out" class:nan={row.out === 'NaN'}>
								{row.out}
								{#if gap}<span class="note">{row.l === null ? 'not in s1' : 'not in s2'}</span>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>

		<section class="panel" aria-labelledby="by-pos">
			<h3 id="by-pos">NumPy · matched by <strong>position</strong></h3>
			<table class="aligned">
				<thead>
					<tr><th scope="col">pos</th><th scope="col">s1</th><th></th><th scope="col">s2</th><th></th><th scope="col">positional</th></tr>
				</thead>
				<tbody>
					{#each byPosition as p, i (i)}
						{@const clash = !!p.l && !!p.r && p.l.label !== p.r.label}
						<tr class:clash>
							<th scope="row" class="mono pos">{i}</th>
							<td class="val mono" class:absent={!p.l}>{p.l?.value ?? '—'}{#if p.l}<span class="from">{p.l.label}</span>{/if}</td>
							<td class="op mono" aria-hidden="true">{s.op}</td>
							<td class="val mono" class:absent={!p.r}>{p.r?.value ?? '—'}{#if p.r}<span class="from">{p.r.label}</span>{/if}</td>
							<td class="op mono" aria-hidden="true">=</td>
							<td class="val mono out">
								{p.out ?? '✕'}
								{#if clash}<span class="note warn-note">{p.l?.label} ≠ {p.r?.label}</span>{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if !positional}
				<p class="pd-small err">NumPy cannot combine lengths {s1.shape[0]} and {s2.shape[0]}: they do not broadcast.</p>
			{/if}
		</section>
	</div>

	<Explain>
		<p>
			pandas lines the two Series up by <strong>label</strong> before computing{#if firstMatch !== undefined}:
				<code>s1[{q(firstMatch)}]</code> meets <code>s2[{q(firstMatch)}]</code>, whatever their positions{/if}. The result has the
			<strong>union</strong> of the labels.
		</p>
		{#if unmatched.length}
			{#if s.fill}
				<p>
					With <code>fill_value=0</code> a label that exists on only one side is combined with 0 instead — no NaN, but only
					because you said what “missing” should mean.
				</p>
			{:else}
				<p>
					{unmatched.map(q).join(', ')} {unmatched.length === 1 ? 'exists' : 'exist'} on only one side, so the result there is
					<strong>NaN</strong> (and the dtype becomes {result.dtypes[0]}). Nothing is silently paired with the wrong value.
				</p>
			{/if}
		{:else}
			<p>Every label exists in both Series, so every value has a partner.</p>
		{/if}
		{#if lengthsDiffer}
			<p>NumPy only has positions, and arrays of lengths {s1.shape[0]} and {s2.shape[0]} cannot be combined at all.</p>
		{:else if !sameOrder && mismatchedPairs}
			<p>
				<strong>NumPy pairs by position</strong>, so {mismatchedPairs} of the pairs combine values with different labels (⚠ rows) —
				a silent mistake that alignment prevents.
			</p>
		{:else}
			<p>The labels are in the same order, so here position and label agree and both give the same numbers.</p>
		{/if}
		<p class="muted">Broadcasting (chapter 06) is about <em>shapes</em>; alignment is about <em>labels</em>. pandas aligns first, then computes like NumPy.</p>
	</Explain>
{/if}

<style>
	.check {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.88rem;
		padding-bottom: 0.3rem;
	}
	.compare {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
		gap: 1rem 1.5rem;
		align-items: start;
	}
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		min-width: 0;
		overflow-x: auto;
	}
	.panel h3 {
		font-size: 0.88rem;
		font-weight: 500;
	}
	.aligned {
		border-collapse: separate;
		border-spacing: 3px;
	}
	.aligned thead th {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--muted);
		text-align: center;
	}
	.lab {
		font-size: 0.8rem;
		font-weight: 700;
		background: var(--surface-sunken);
		border: 1.5px solid var(--border-strong);
		border-radius: 4px;
		padding: 0 0.5rem;
		text-align: center;
	}
	.pos {
		font-size: 0.75rem;
		color: var(--subtle);
		text-align: center;
	}
	.val {
		position: relative;
		min-width: var(--cell-min);
		height: var(--cell-h);
		padding: 0 0.55rem;
		text-align: center;
		font-size: var(--cell-font);
		font-variant-numeric: tabular-nums;
		background: var(--array-cell);
		border: 1.5px solid var(--array-cell-border);
		border-radius: 4px;
		white-space: nowrap;
	}
	.val.absent {
		background: transparent;
		border-style: dashed;
		color: var(--muted);
	}
	.val.out {
		font-weight: 600;
	}
	.val.nan {
		border: 2px dashed var(--axis-mark);
		color: var(--muted);
		font-style: italic;
	}
	.op {
		color: var(--muted);
		text-align: center;
		padding: 0 0.1rem;
	}
	.from {
		position: absolute;
		top: -0.55em;
		right: -0.35em;
		font-size: 0.6rem;
		line-height: 1;
		padding: 0.12em 0.3em;
		border-radius: 3px;
		background: var(--surface-elevated);
		border: 1px solid var(--border-strong);
		color: var(--muted);
		font-style: normal;
	}
	.note {
		display: block;
		font-size: 0.62rem;
		font-weight: 500;
		color: var(--axis-mark);
		font-style: normal;
		line-height: 1;
		margin-top: -0.1rem;
	}
	.warn-note {
		color: var(--warning);
	}
	tr.clash .val.out {
		border: 2px dashed var(--warning);
	}
	tr.clash .val.out::before {
		content: '⚠ ';
		color: var(--warning);
	}
	.err {
		color: var(--error);
	}
</style>
