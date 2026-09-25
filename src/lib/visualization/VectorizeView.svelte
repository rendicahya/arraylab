<script lang="ts">
	import ArrayGrid, { type CellDecor } from './ArrayGrid.svelte';
	import Explain from '../components/Explain.svelte';
	import Icon from '../components/Icon.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { Player } from '../lab/player.svelte';
	import { VECTOR_OPS, benchmarkCode } from '../lab/codegen';
	import { runtime } from '../runtime/executor.svelte';
	import { formatShape } from '../array/normalize';
	import { valueAt } from '../array/inspect';

	let { lab }: { lab: Lab } = $props();

	const MAX_STEPS = 12;
	const BENCH_N = 100_000;

	const s = $derived(lab.settings.vectorize);
	const op = $derived(VECTOR_OPS.find((o) => o.id === s.op) ?? VECTOR_OPS[0]);
	const res = $derived(lab.resultFor('vectorize'));
	const a = $derived(res ? lab.target('a') : null);
	const vec = $derived(res && !res.error ? lab.target('vec_result') : null);
	const equal = $derived(res?.result && 'repr' in res.result ? res.result.repr : null);

	const player = new Player(650);
	$effect(() => {
		void lab.spec.code;
		player.stop();
		bench = null;
		return () => player.stop();
	});

	const steps = $derived(
		a && vec
			? Array.from({ length: Math.min(a.size, MAX_STEPS) }, (_, i) => ({
					x: valueAt(a, i) ?? '…',
					y: valueAt(vec, i) ?? '…'
				}))
			: []
	);
	/** Step 0..n-1 = loop iterations; n = the single vectorized operation. */
	const loopStep = $derived(player.step !== null && player.step < steps.length ? player.step : null);
	const vecDone = $derived(player.step === null || player.step >= steps.length);

	function decorateA(flat: number): CellDecor | undefined {
		if (loopStep === null) return undefined;
		return { state: flat === loopStep ? 'focus' : flat < loopStep ? undefined : 'dim', group: flat === loopStep ? 1 : undefined };
	}

	let bench = $state<{ loop: number; vec: number } | null>(null);
	let benchError = $state<string | null>(null);
	let benchRunning = $state(false);

	async function runBenchmark() {
		benchRunning = true;
		benchError = null;
		try {
			const r = await runtime.run({ code: benchmarkCode(s.op, BENCH_N), namespace: `${lab.namespace}-bench` });
			if (r.error) benchError = `${r.error.type}: ${r.error.message}`;
			const v = r.result && 'values' in r.result ? r.result.values : undefined;
			if (v) bench = { loop: Number(v[0]), vec: Number(v[1]) };
		} catch (e) {
			benchError = (e as Error).message;
		} finally {
			benchRunning = false;
		}
	}
	const ratio = $derived(bench ? bench.loop / Math.max(bench.vec, 1e-3) : 0);
</script>

<div class="controls">
	<div class="field">
		<span class="eyebrow" id="vop">Operation on each element x</span>
		<span class="segmented" role="group" aria-labelledby="vop">
			{#each VECTOR_OPS as o (o.id)}
				<button type="button" aria-pressed={s.op === o.id} onclick={() => (s.op = o.id)}>{o.label}</button>
			{/each}
		</span>
	</div>
	<button class="btn" type="button" onclick={() => player.toggle(steps.length + 1)} disabled={!vec}>
		<Icon name={player.playing ? 'pause' : 'play'} size={15} />
		{player.playing ? 'Stop' : 'Animate loop vs vectorized'}
	</button>
</div>

<RunStatus {lab} />

{#if a && vec}
	<div class="compare">
		<section class="panel" aria-label="Python loop">
			<h3>Python loop <span class="muted">— one element at a time</span></h3>
			<pre class="snippet">for x in a.ravel():
    out.append({op.loop})</pre>
			<ol class="steps mono">
				{#each steps as step, i (i)}
					<li class:current={loopStep === i} class:pending={loopStep !== null && i > loopStep}>
						<span class="x">{step.x}</span>
						<span class="arrow">→ {op.loop.replace('x', '□')} →</span>
						<span class="y">{loopStep === null || i <= loopStep ? step.y : '?'}</span>
					</li>
				{/each}
				{#if a.size > MAX_STEPS}<li class="muted">… {a.size - MAX_STEPS} more iterations</li>{/if}
			</ol>
			<p class="note">{a.size} separate Python operations, each on one number.</p>
		</section>

		<section class="panel" aria-label="Vectorized">
			<h3>Vectorized <span class="muted">— the whole array at once</span></h3>
			<pre class="snippet">vec_result = {op.vector}   # ufunc: {op.ufunc}</pre>
			<div class="vec-stage">
				<ArrayGrid info={a} decorate={decorateA} size="small" legend={false} />
				<span class="big-arrow" class:lit={vecDone}>⟶ <code>{op.vector}</code> ⟶</span>
				{#if vecDone}
					<ArrayGrid info={vec} name="vec_result" size="small" legend={false} />
				{:else}
					<span class="muted waiting">waiting for the loop…</span>
				{/if}
			</div>
			<p class="note">One NumPy call; the loop over elements happens inside compiled code.</p>
		</section>
	</div>

	{#if equal}
		<p class="check mono">np.array_equal(loop_result, vec_result) → <strong>{equal}</strong></p>
	{/if}

	<div class="bench">
		<button class="btn" type="button" onclick={runBenchmark} disabled={benchRunning}>
			<Icon name="timer" size={15} />
			{benchRunning ? 'Measuring…' : `Measure speed on ${BENCH_N.toLocaleString('en-US')} elements`}
		</button>
		{#if bench}
			<div class="bars" role="img" aria-label="Loop {bench.loop.toFixed(1)} ms, vectorized {bench.vec.toFixed(2)} ms">
				<div class="bar-row"><span>loop</span><span class="bar loop" style:width="100%"></span><span class="mono">{bench.loop.toFixed(1)} ms</span></div>
				<div class="bar-row">
					<span>vectorized</span>
					<span class="bar vec" style:width="{Math.max(0.5, (bench.vec / bench.loop) * 100)}%"></span>
					<span class="mono">{bench.vec.toFixed(2)} ms</span>
				</div>
				<p class="muted small">
					≈ {ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× faster here. Measured live in your browser (Python compiled to
					WebAssembly); exact numbers differ on a desktop Python, the gap is typically similar or larger.
				</p>
			</div>
		{/if}
		{#if benchError}<p class="error small">{benchError}</p>{/if}
	</div>

	<Explain>
		<p>
			Both versions compute the same values of shape <code>{formatShape(vec.shape)}</code>. The loop runs Python code
			{a.size} times; <code>{op.vector}</code> hands the whole array to a NumPy <strong>ufunc</strong>
			(<code>{op.ufunc}</code>) that loops in compiled code.
		</p>
		<p class="muted">
			The animation is a conceptual model: NumPy does not literally process elements in this visual sequence
			(it may use SIMD instructions and other optimizations), but the result is the same.
		</p>
	</Explain>
{/if}

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.75rem 1.25rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.compare {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}
	.panel {
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.7rem 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
	}
	h3 {
		font-size: 0.95rem;
	}
	h3 .muted {
		font-weight: 400;
		font-size: 0.85rem;
	}
	.snippet {
		margin: 0;
		background: var(--code-bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.4rem 0.55rem;
		font-size: 0.82rem;
		overflow-x: auto;
	}
	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		font-size: 0.85rem;
	}
	.steps li {
		display: flex;
		gap: 0.5rem;
		padding: 0.05rem 0.35rem;
		border-radius: 4px;
		border: 1.5px solid transparent;
	}
	.steps li.current {
		background: var(--g1);
		border-color: var(--g1-strong);
		font-weight: 700;
	}
	.steps li.pending {
		opacity: 0.4;
	}
	.x,
	.y {
		min-width: 3.5rem;
		text-align: right;
	}
	.y {
		text-align: left;
	}
	.arrow {
		color: var(--muted);
	}
	.vec-stage {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		overflow-x: auto;
	}
	.big-arrow {
		color: var(--subtle);
		font-size: 0.85rem;
	}
	.big-arrow.lit {
		color: var(--accent);
		font-weight: 600;
	}
	.waiting {
		font-size: 0.85rem;
	}
	.note {
		margin: 0;
		font-size: 0.82rem;
		color: var(--muted);
	}
	.check {
		margin: 0;
	}
	.bench {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-start;
	}
	.bars {
		width: min(100%, 36rem);
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.bar-row {
		display: grid;
		grid-template-columns: 6rem 1fr 6rem;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
	}
	.bar {
		height: 0.9rem;
		border-radius: 3px;
	}
	.bar.loop {
		background: var(--g1-strong);
	}
	.bar.vec {
		background: var(--accent);
	}
	.small {
		font-size: 0.8rem;
		margin: 0;
	}
	.error {
		color: var(--error);
	}
</style>
