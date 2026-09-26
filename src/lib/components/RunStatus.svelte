<script lang="ts">
	import ErrorCard from './ErrorCard.svelte';
	import Icon from './Icon.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import { runtime } from '../runtime/executor.svelte';

	/** Loading / input / Python error notices for the active tool. */
	let { lab, hideDiagram = false }: { lab: Lab; hideDiagram?: boolean } = $props();

	const result = $derived(lab.resultFor(lab.settings.tool));
	const warnings = $derived(
		result?.stderr
			?.split('\n')
			.filter((l) => /Warning:/.test(l))
			.map((l) => l.replace(/^.*?(\w+Warning:)/, '$1'))
	);
</script>

{#if lab.spec.inputError}
	<div class="notice warning" role="status">
		<Icon name="info" size={16} />
		<span>{lab.spec.inputError}</span>
	</div>
{:else if runtime.status === 'error'}
	<div class="notice error" role="alert">
		<Icon name="alert" size={16} />
		<span>
			Python could not be loaded: {runtime.message}. ArrayLab downloads Python + NumPy (≈ 15 MB) from
			cdn.jsdelivr.net the first time — check your connection.
		</span>
		<button class="btn" type="button" onclick={() => runtime.restart()}>Retry</button>
	</div>
{:else if !result && runtime.status !== 'ready'}
	<div class="notice" role="status" aria-live="polite">
		<span class="spinner" aria-hidden="true"></span>
		<span>{runtime.message || 'Starting Python…'} <span class="muted">(first visit downloads ≈ 15 MB, then it is cached)</span></span>
	</div>
{:else if !result && lab.running && runtime.message}
	<div class="notice" role="status" aria-live="polite">
		<span class="spinner" aria-hidden="true"></span>
		<span>{runtime.message} <span class="muted">(downloaded once, then cached)</span></span>
	</div>
{:else if lab.runtimeError}
	<div class="notice error" role="alert">
		<Icon name="alert" size={16} />
		<span>{lab.runtimeError}</span>
	</div>
{/if}

{#if !lab.spec.inputError && result?.error}
	<ErrorCard error={result.error} diagram={!hideDiagram} />
{/if}
{#if !lab.spec.inputError && lab.spec.inputHint}
	<div class="notice warning" role="status"><Icon name="info" size={16} /><span>{lab.spec.inputHint}</span></div>
{/if}
{#if warnings?.length}
	<div class="notice warning" role="status">
		<Icon name="alert" size={16} />
		<span>NumPy warned: <code>{warnings.join(' · ')}</code></span>
	</div>
{/if}

<style>
	.notice {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.45rem 0.7rem;
		border-radius: var(--radius);
		border: 1px solid var(--border);
		background: var(--surface-sunken);
		font-size: 0.88rem;
		max-width: 48rem;
	}
	.notice :global(svg) {
		flex: none;
	}
	.warning {
		border-color: var(--warning);
		background: var(--warning-soft);
	}
	.error {
		border-color: var(--error);
		background: var(--error-soft);
	}
	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--border-strong);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		flex: none;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
