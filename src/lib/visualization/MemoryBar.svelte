<script lang="ts">
	import type { ArrayInfo } from '../array/types';

	/** Bytes-per-element strip: one box per byte for the first few elements. */
	let { info, maxElements = 6 }: { info: ArrayInfo; maxElements?: number } = $props();

	const shown = $derived(Math.min(info.size, maxElements));
</script>

<div class="memory" aria-label="{info.size} elements × {info.itemsize} bytes = {info.nbytes} bytes">
	<div class="strip" aria-hidden="true">
		{#each Array.from({ length: shown }, (_, i) => i) as el (el)}
			<span class="element" title="element {el}: {info.itemsize} bytes">
				{#each Array.from({ length: info.itemsize }, (_, i) => i) as b (b)}<span class="byte"></span>{/each}
			</span>
		{/each}
		{#if info.size > shown}<span class="more">…</span>{/if}
	</div>
	<div class="caption mono">
		{info.size} × {info.itemsize} B = <strong>{info.nbytes} bytes</strong>
	</div>
</div>

<style>
	.memory {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.strip {
		display: flex;
		align-items: center;
		gap: 3px;
		flex-wrap: wrap;
		max-width: 22rem;
	}
	.element {
		display: inline-flex;
		gap: 1px;
		padding: 2px;
		border: 1px solid var(--accent);
		border-radius: 3px;
	}
	.byte {
		width: 6px;
		height: 12px;
		background: var(--accent);
		opacity: 0.55;
		border-radius: 1px;
	}
	.more {
		color: var(--muted);
	}
	.caption {
		font-size: 0.78rem;
		color: var(--muted);
	}
</style>
