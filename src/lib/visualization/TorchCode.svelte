<script lang="ts">
	import Icon from '../components/Icon.svelte';

	/**
	 * PyTorch code that ArrayLab shows but does not run (PyTorch is not available in
	 * the browser). Always labeled as such, with a copy button.
	 */
	let { code, title = 'PyTorch' }: { code: string; title?: string } = $props();

	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			setTimeout(() => (copied = false), 1200);
		} catch {
			/* clipboard unavailable */
		}
	}
</script>

<figure class="torch-code">
	<figcaption>
		<span class="title">{title}</span>
		<span class="tag" title="PyTorch does not run in the browser. Copy the code or open the Colab notebook to run it.">
			not run here
		</span>
		<button class="btn ghost copy" type="button" onclick={copy} aria-label="Copy PyTorch code">
			<Icon name={copied ? 'check' : 'copy'} size={13} />
		</button>
	</figcaption>
	<pre class="mono">{code}</pre>
</figure>

<style>
	.torch-code {
		margin: 0;
		border: 1px dashed var(--border-strong);
		border-radius: var(--radius-sm);
		background: var(--code-bg);
		min-width: 0;
	}
	figcaption {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.2rem 0.3rem 0.2rem 0.6rem;
		border-bottom: 1px dashed var(--border);
		font-size: 0.78rem;
	}
	.title {
		font-weight: 600;
	}
	.tag {
		color: var(--muted);
		border: 1px solid var(--border-strong);
		border-radius: 999px;
		padding: 0 0.4rem;
		font-size: 0.7rem;
		white-space: nowrap;
	}
	.copy {
		margin-left: auto;
		padding: 0.15rem 0.35rem;
	}
	pre {
		margin: 0;
		padding: 0.5rem 0.7rem;
		font-size: 0.86rem;
		overflow-x: auto;
		white-space: pre;
	}
</style>
