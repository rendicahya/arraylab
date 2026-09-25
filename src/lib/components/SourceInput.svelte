<script lang="ts">
	import type { Lab } from '../lab/lab.svelte';
	import { DTYPES } from '../lab/codegen';
	import { formatShape } from '../array/normalize';

	/** Defines the array `a`: typed numbers (live) or a NumPy expression (applied on Enter). */
	let { lab, compact = false }: { lab: Lab; compact?: boolean } = $props();

	const src = $derived(lab.settings.source);
	let exprDraft = $state('');
	$effect.pre(() => {
		exprDraft = src.expr;
	});

	const EXPR_PRESETS = [
		'np.arange(12).reshape(3, 4)',
		'np.arange(24).reshape(2, 3, 4)',
		'np.zeros((2, 3))',
		'np.linspace(0, 1, 5)',
		'np.eye(3)',
		'np.random.default_rng(0).integers(0, 10, size=(3, 4))',
		'np.arange(1_000_000).reshape(1000, 1000)'
	];

	const shape = $derived(lab.provisional?.shape ?? null);

	function applyExpr(event: SubmitEvent) {
		event.preventDefault();
		src.expr = exprDraft;
	}
</script>

<div class="source" class:compact>
	<div class="head">
		<span class="label mono">a =</span>
		<span class="segmented" role="group" aria-label="How to create a">
			<button type="button" aria-pressed={src.mode === 'literal'} onclick={() => (src.mode = 'literal')}>Type numbers</button>
			<button type="button" aria-pressed={src.mode === 'expr'} onclick={() => (src.mode = 'expr')}>NumPy function</button>
		</span>
		{#if src.mode === 'literal'}
			<label class="dtype">
				<span class="muted">dtype</span>
				<select bind:value={src.dtype} aria-label="dtype for the typed numbers">
					<option value="">auto (NumPy decides)</option>
					{#each DTYPES as t (t)}<option value={t}>{t}</option>{/each}
				</select>
			</label>
			{#if shape}<span class="shape mono" aria-live="polite">shape {formatShape(shape)}</span>{/if}
		{/if}
	</div>

	{#if src.mode === 'literal'}
		<textarea
			class="mono numbers"
			bind:value={src.text}
			rows={Math.min(8, Math.max(2, src.text.split('\n').length))}
			spellcheck="false"
			aria-label="Numbers for array a"
			aria-describedby="source-help"
		></textarea>
		<p id="source-help" class="help">
			Spaces or commas between values · new line = new row · blank line = new 2-D layer (3-D array).
		</p>
	{:else}
		<form class="expr" onsubmit={applyExpr}>
			<span class="mono muted">a =</span>
			<input class="mono" bind:value={exprDraft} spellcheck="false" aria-label="NumPy expression for a" />
			<button class="btn" class:primary={exprDraft !== src.expr} type="submit">Run</button>
		</form>
		<div class="presets" role="group" aria-label="Example expressions">
			{#each EXPR_PRESETS as p (p)}
				<button type="button" class="chip mono" aria-pressed={src.expr === p} onclick={() => ((exprDraft = p), (src.expr = p))}>{p}</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.source {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.head {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem 0.8rem;
	}
	.label {
		font-weight: 700;
		font-size: 1.05rem;
	}
	.dtype {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
	}
	.dtype select {
		padding: 0.2rem 0.35rem;
		font-size: 0.85rem;
	}
	.shape {
		font-size: 0.85rem;
		color: var(--accent);
	}
	.numbers {
		width: min(100%, 34rem);
		resize: vertical;
		font-size: 1rem;
		line-height: 1.45;
	}
	.help {
		margin: 0;
		font-size: 0.78rem;
		color: var(--muted);
	}
	.expr {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}
	.expr input {
		flex: 1;
		max-width: 34rem;
	}
	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}
	.chip {
		border: 1px solid var(--border-strong);
		background: var(--surface);
		border-radius: 999px;
		padding: 0.05rem 0.55rem;
		font-size: 0.76rem;
		cursor: pointer;
	}
	.chip[aria-pressed='true'] {
		background: var(--accent-soft);
		border-color: var(--accent);
	}
	.compact .help {
		display: none;
	}
</style>
