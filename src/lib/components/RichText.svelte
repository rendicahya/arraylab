<script lang="ts">
	/** Renders lesson prose with `code` and **bold** — no raw HTML. */
	let { text }: { text: string } = $props();

	type Part = { kind: 'text' | 'code' | 'bold'; value: string };

	const parts = $derived.by(() => {
		const out: Part[] = [];
		const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
		let last = 0;
		for (const m of text.matchAll(re)) {
			if (m.index > last) out.push({ kind: 'text', value: text.slice(last, m.index) });
			out.push(m[1] !== undefined ? { kind: 'code', value: m[1] } : { kind: 'bold', value: m[2] });
			last = m.index + m[0].length;
		}
		if (last < text.length) out.push({ kind: 'text', value: text.slice(last) });
		return out;
	});
</script>

{#each parts as part, i (i)}{#if part.kind === 'code'}<code>{part.value}</code>{:else if part.kind === 'bold'}<strong>{part.value}</strong>{:else}{part.value}{/if}{/each}
