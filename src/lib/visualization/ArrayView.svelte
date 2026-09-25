<script lang="ts">
	import ArrayGrid from './ArrayGrid.svelte';
	import ShapeView from './ShapeView.svelte';
	import Explain from '../components/Explain.svelte';
	import RunStatus from '../components/RunStatus.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { axisRoles, formatIndex, ordinal, unravel } from '../array/normalize';
	import { valueAt } from '../array/inspect';

	let { lab }: { lab: Lab } = $props();

	const a = $derived(lab.resultFor('array') ? lab.target('a') : lab.provisional);
	let hover = $state<number | null>(null);
	let hoverAxis = $state<number | null>(null);
	const hoverIndex = $derived(a && hover !== null ? unravel(hover, a.shape) : null);
</script>

<RunStatus {lab} />

{#if a}
	<div class="stack">
		<div class="main">
			<ShapeView info={a} highlightAxis={hoverAxis} />
			<div class="stage">
				<ArrayGrid info={a} onhover={(f) => (hover = f)} decorate={(f) => (f === hover ? { state: 'selected' } : undefined)} />
			</div>
			<p class="hover-line mono" aria-live="polite">
				{#if hoverIndex && a}
					{formatIndex('a', hoverIndex)} = {valueAt(a, hover!)}
					{#each hoverIndex as i, axis (axis)}
						<span
							class="chip"
							role="presentation"
							onmouseenter={() => (hoverAxis = axis)}
							onmouseleave={() => (hoverAxis = null)}>axis {axis}: {i}</span
						>
					{/each}
				{:else}
					<span class="muted">Hover or focus a cell to see its index.</span>
				{/if}
			</p>
		</div>
		<Explain title="Reading the array">
			{#if a.ndim === 0}
				<p>
					A single value makes a <strong>0-d array</strong>: shape <code>()</code>, ndim 0, size 1. It
					has no axes to move along.
				</p>
			{:else}
				<p>
					Every element has one index per axis — {a.ndim}
					{a.ndim === 1 ? 'number' : 'numbers'}, because ndim is {a.ndim}. The shape lists how long
					each axis is.
				</p>
				<ul>
					{#each axisRoles(a.ndim) as role, axis (axis)}
						<li>
							<code>axis {axis}</code> has length {a.shape[axis]}: moving along it changes the {ordinal(
								axis + 1
							)} index{a.ndim > 1 ? ` — you step between ${role}` : ''}.
						</li>
					{/each}
				</ul>
				{#if a.ndim >= 3}
					<p class="muted">
						Rows and columns are only names for the last two axes. With more dimensions, count axes from
						the outside in: axis 0 selects the outermost block.
					</p>
				{/if}
			{/if}
		</Explain>
	</div>
{/if}

<style>
	.stack,
	.main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	/* Wide screens: the explanation sits beside the array instead of below the fold. */
	@container center (min-width: 820px) {
		.stack {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(15rem, 24rem);
			gap: 1.5rem;
			align-items: start;
		}
	}
	.stage {
		overflow: auto;
		padding: 0.6rem 0.2rem;
	}
	.hover-line {
		margin: 0;
		min-height: 1.6em;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.chip {
		font-size: 0.78rem;
		padding: 0.05rem 0.4rem;
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		color: var(--muted);
	}
</style>
