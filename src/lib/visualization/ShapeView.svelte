<script lang="ts">
	import type { ArrayInfo } from '../array/types';
	import { axisRoles, formatCount } from '../array/normalize';

	let {
		info,
		name = info.name ?? 'a',
		highlightAxis = null
	}: { info: ArrayInfo; name?: string; highlightAxis?: number | null } = $props();

	const roles = $derived(axisRoles(info.ndim));
</script>

<div class="shape-view" aria-label="Shape of {name}">
	<div class="tuple mono">
		<span class="lhs">{name}.shape = (</span>
		{#each info.shape as n, axis (axis)}
			<span class="dim" class:hl={highlightAxis === axis} style:--g="var(--g{axis % 6}-strong)">
				<span class="n">{n}</span>
				<span class="axis">axis {axis}</span>
				<span class="role">{roles[axis]}</span>
			</span>{#if axis < info.ndim - 1 || info.ndim === 1}<span class="comma">,</span>{/if}
		{/each}
		<span class="lhs">)</span>
	</div>
	<dl class="facts">
		<div>
			<dt class="mono">ndim</dt>
			<dd>
				<strong class="mono">{info.ndim}</strong>
				<span class="muted">— number of entries in the shape (number of axes)</span>
			</dd>
		</div>
		<div>
			<dt class="mono">size</dt>
			<dd>
				<strong class="mono">{formatCount(info.size)}</strong>
				<span class="muted">
					— total elements{#if info.ndim > 1}: {info.shape.join(' × ')} = {formatCount(info.size)}{:else if info.ndim === 0}: a 0-d array holds exactly one value{/if}
				</span>
			</dd>
		</div>
	</dl>
</div>

<style>
	.shape-view {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.tuple {
		display: flex;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 0.15rem;
		font-size: 1.05rem;
	}
	.lhs,
	.comma {
		padding-top: 0.15rem;
	}
	.dim {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.1rem 0.45rem 0.25rem;
		border-radius: var(--radius-sm);
		border-top: 3px solid var(--g);
		background: var(--surface-sunken);
	}
	.dim.hl {
		outline: 2px solid var(--axis-mark);
	}
	.n {
		font-weight: 700;
		font-size: 1.15rem;
	}
	.axis {
		font-size: 0.68rem;
		color: var(--g);
		font-weight: 700;
	}
	.role {
		font-size: 0.66rem;
		color: var(--muted);
		font-family: var(--font-sans);
	}
	.facts {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.88rem;
	}
	.facts div {
		display: flex;
		gap: 0.6rem;
	}
	.facts dt {
		min-width: 3rem;
		color: var(--muted);
	}
	.facts dd {
		margin: 0;
	}
</style>
