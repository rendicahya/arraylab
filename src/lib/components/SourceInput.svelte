<script lang="ts">
	import type { Lab } from '../lab/lab.svelte';
	import { DTYPES } from '../lab/codegen';
	import { formatShape } from '../array/normalize';
	import { t } from '../i18n/strings';

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

	/** One-click starting points for typed numbers: different ndim and dtypes. */
	const LITERAL_PRESETS: { label: string; text: string }[] = [
		{ label: '1-D', text: '1 2 3 4 5 6' },
		{ label: '2-D', text: '1 2 3\n4 5 6' },
		{ label: '3-D', text: '1 2 3\n4 5 6\n\n7 8 9\n10 11 12' },
		{ label: 'column', text: '1\n2\n3' },
		{ label: 'floats', text: '0.5 1.5 2.5\n3.5 4.5 5.5' },
		{ label: 'booleans', text: 'True False True\nFalse True False' }
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
		<span class="segmented" role="group" aria-label={t('sourceInput').howToCreate}>
			<button type="button" aria-pressed={src.mode === 'literal'} onclick={() => (src.mode = 'literal')}>{t('sourceInput').typeNumbers}</button>
			<button type="button" aria-pressed={src.mode === 'expr'} onclick={() => (src.mode = 'expr')}>{t('sourceInput').numpyFunction}</button>
		</span>
		{#if src.mode === 'literal'}
			<label class="dtype">
				<span class="muted">{t('sourceInput').dtype}</span>
				<select bind:value={src.dtype} aria-label={t('sourceInput').dtypeAria}>
					<option value="">{t('sourceInput').auto}</option>
					{#each DTYPES as dt (dt)}<option value={dt}>{dt}</option>{/each}
				</select>
			</label>
			{#if shape}<span class="shape mono" aria-live="polite">shape {formatShape(shape)}</span>{/if}
		{/if}
	</div>

	{#if src.mode === 'literal'}
		<div class="entry">
			<textarea
				class="mono numbers"
				bind:value={src.text}
				rows={Math.min(8, Math.max(2, src.text.split('\n').length))}
				spellcheck="false"
				aria-label={t('sourceInput').numbersAria}
				aria-describedby="source-help"
			></textarea>
			<div class="side">
				<div class="presets" role="group" aria-label={t('sourceInput').exampleNumbers}>
					<span class="eyebrow">{t('sourceInput').try}</span>
					{#each LITERAL_PRESETS as p (p.label)}
						<button
							type="button"
							class="chip"
							aria-pressed={src.text === p.text}
							title={p.text.replaceAll('\n', ' ⏎ ')}
							onclick={() => (src.text = p.text)}>{(t('sourceInput').presets as Record<string, string>)[p.label]}</button
						>
					{/each}
				</div>
				<p id="source-help" class="help">{t('sourceInput').help}</p>
			</div>
		</div>
	{:else}
		<form class="expr" onsubmit={applyExpr}>
			<span class="mono muted">a =</span>
			<input class="mono" bind:value={exprDraft} spellcheck="false" aria-label={t('sourceInput').exprAria} />
			<button class="btn" class:primary={exprDraft !== src.expr} type="submit">{t('sourceInput').run}</button>
		</form>
		<div class="presets" role="group" aria-label={t('sourceInput').exampleExpressions}>
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
	.entry {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 0.4rem 1rem;
	}
	.side {
		flex: 1 1 14rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding-top: 0.15rem;
	}
	.presets .eyebrow {
		margin-right: 0.15rem;
	}
	.numbers {
		flex: 1 1 18rem;
		max-width: 34rem;
		min-width: min(100%, 14rem);
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
		align-items: center;
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
