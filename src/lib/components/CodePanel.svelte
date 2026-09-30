<script lang="ts">
	import CodeEditor from './CodeEditor.svelte';
	import Icon from './Icon.svelte';
	import type { Lab } from '../lab/lab.svelte';
	import type { RunResult } from '../runtime/protocol';
	import { runtime } from '../runtime/executor.svelte';
	import { base } from '$app/paths';
	import { encodeShare } from '../lab/share';
	import { t } from '../i18n/strings';

	/** Bottom panel: the exact code each tool ran, a free editor, and Python's output. */
	let { lab }: { lab: Lab } = $props();

	let tab = $state<'tool' | 'editor'>('tool');
	let collapsed = $state(false);
	let copied = $state(false);
	let now = $state(Date.now());

	$effect(() => {
		if (lab.settings.tool === 'code') tab = 'editor';
	});
	$effect(() => {
		if (runtime.busySince === null) return;
		const t = setInterval(() => (now = Date.now()), 500);
		return () => clearInterval(t);
	});
	const stuck = $derived(runtime.busySince !== null && runtime.status === 'ready' && now - runtime.busySince > 3000);

	const toolCode = $derived(lab.settings.tool === 'code' ? '' : (lab.fresh ? lab.ranSpec?.code : lab.spec.code) ?? '');
	const lastLine = (code: string) => code.trim().split('\n').at(-1) ?? '';

	const output = $derived<{ result: RunResult | null; code: string }>(
		tab === 'tool'
			? { result: lab.settings.tool === 'code' ? null : lab.resultFor(lab.settings.tool), code: toolCode }
			: { result: lab.scratchResult, code: lab.scratchRanCode }
	);

	function openInEditor() {
		lab.scratchCode = toolCode;
		tab = 'editor';
	}

	let shared = $state<'idle' | 'copied' | 'failed'>('idle');
	let shareUrl = $state('');
	/** Copies a link that opens the Lab in this exact state (tool, numbers, settings, editor code). */
	async function share() {
		shareUrl = `${location.origin}${base}/lab/#s=${encodeShare($state.snapshot(lab.settings), lab.scratchCode)}`;
		try {
			await navigator.clipboard.writeText(shareUrl);
			shared = 'copied';
			setTimeout(() => (shared = 'idle'), 1800);
		} catch {
			shared = 'failed';
		}
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(tab === 'tool' ? toolCode : lab.scratchCode);
			copied = true;
			setTimeout(() => (copied = false), 1200);
		} catch {
			/* clipboard unavailable */
		}
	}

	const statusText = $derived(
		runtime.status === 'ready'
			? t('codePanel').statusReady(runtime.versions?.python ?? '', runtime.versions?.numpy ?? '')
			: runtime.status === 'error'
				? t('codePanel').statusErrorMsg
				: runtime.message || t('codePanel').statusNotStarted
	);
</script>

<section class="code-panel" class:collapsed aria-label={t('codePanel').label}>
	<div class="bar">
		<div class="tabs" role="tablist" aria-label={t('codePanel').views}>
			<button role="tab" type="button" aria-selected={tab === 'tool'} onclick={() => ((tab = 'tool'), (collapsed = false))}>
				{t('codePanel').ran}
			</button>
			<button role="tab" type="button" aria-selected={tab === 'editor'} onclick={() => ((tab = 'editor'), (collapsed = false))}>
				{t('codePanel').yours}
			</button>
		</div>
		<div class="actions">
			{#if tab === 'tool' && toolCode}
				<button class="btn ghost small" type="button" onclick={openInEditor}>{t('codePanel').editACopy}</button>
			{/if}
			{#if tab === 'editor'}
				<button class="btn primary small" type="button" onclick={() => lab.runScratch()} disabled={lab.scratchRunning} title={t('codePanel').runTitle}>
					<Icon name="play" size={14} /> {t('codePanel').run}
				</button>
			{/if}
			<button
				class="btn ghost small"
				type="button"
				onclick={share}
				title={t('codePanel').shareTitle}
			>
				<Icon name={shared === 'copied' ? 'check' : 'link'} size={14} />
				{shared === 'copied' ? t('codePanel').linkCopied : t('codePanel').share}
			</button>
			<button class="btn ghost small" type="button" onclick={copy} aria-label={t('codePanel').copyCode}>
				<Icon name={copied ? 'check' : 'copy'} size={14} />
			</button>
			<span class="status {runtime.status}" role="status" title={runtime.versions ? t('codePanel').pyodideTitle(runtime.versions.pyodide) : undefined}>
				<span class="dot" aria-hidden="true"></span>{statusText}
			</span>
			{#if stuck}
				<button class="btn small" type="button" onclick={() => runtime.restart()} title={t('codePanel').stopTitle}>
					<Icon name="stop" size={14} /> {t('codePanel').stop}
				</button>
			{/if}
			<button class="btn ghost small" type="button" onclick={() => (collapsed = !collapsed)} aria-expanded={!collapsed} aria-label={collapsed ? t('codePanel').showPanel : t('codePanel').hidePanel}>
				<Icon name={collapsed ? 'chevronUp' : 'chevronDown'} size={16} />
			</button>
		</div>
	</div>

	{#if shared === 'failed'}
		<div class="share-fallback">
			<label>
				<span class="muted">{t('codePanel').copyThisLink}</span>
				<input readonly value={shareUrl} onfocus={(e) => e.currentTarget.select()} />
			</label>
			<button class="btn ghost small" type="button" onclick={() => (shared = 'idle')} aria-label={t('codePanel').close}>
				<Icon name="x" size={14} />
			</button>
		</div>
	{/if}

	{#if !collapsed}
		<div class="body">
			<div class="editor-wrap">
				{#if tab === 'tool'}
					{#if toolCode}
						<CodeEditor value={toolCode} readonly label={t('codePanel').toolCodeLabel} />
					{:else}
						<p class="muted pad">{t('codePanel').switchToTool}</p>
					{/if}
				{:else}
					<CodeEditor bind:value={lab.scratchCode} label={t('codePanel').editorLabel} onrun={() => lab.runScratch()} />
				{/if}
			</div>
			<div class="output" aria-live="polite" aria-label={t('codePanel').pythonOutput}>
				<div class="eyebrow">{t('codePanel').output}</div>
				{#if output.result}
					{#if output.result.stdout}<pre class="stdout">{output.result.stdout}</pre>{/if}
					{#if output.result.error}
						<pre class="err">{output.result.error.traceback || `${output.result.error.type}: ${output.result.error.message}`}</pre>
					{:else if output.result.result && 'repr' in output.result.result}
						<pre class="repr"><span class="prompt">&gt;&gt;&gt; {lastLine(output.code)}</span>
{output.result.result.repr}</pre>
					{:else if !output.result.stdout}
						<p class="muted small">{t('codePanel').noOutput}</p>
					{/if}
					{#if output.result.stderr}<pre class="warn">{output.result.stderr}</pre>{/if}
				{:else}
					<p class="muted small">{tab === 'editor' ? t('codePanel').pressRun : t('codePanel').outputHere}</p>
				{/if}
			</div>
		</div>
	{/if}
</section>

<style>
	.code-panel {
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--border);
		background: var(--surface);
		min-height: 0;
		height: var(--code-h, 240px);
	}
	.code-panel.collapsed {
		height: auto;
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.25rem 0.6rem;
		border-bottom: 1px solid var(--border);
		flex-wrap: wrap;
	}
	.share-fallback {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0.6rem;
		border-bottom: 1px solid var(--border);
		font-size: 0.82rem;
	}
	.share-fallback label {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.share-fallback input {
		flex: 1;
		font-size: 0.8rem;
	}
	.collapsed .bar {
		border-bottom: none;
	}
	.tabs {
		display: flex;
		gap: 0.2rem;
	}
	.tabs button {
		border: none;
		background: none;
		padding: 0.35rem 0.6rem;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		color: var(--muted);
		font-weight: 500;
		font-size: 0.88rem;
	}
	.tabs button[aria-selected='true'] {
		color: var(--foreground);
		border-bottom-color: var(--accent);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.small {
		font-size: 0.8rem;
		padding: 0.25rem 0.5rem;
	}
	.status {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--muted);
		padding: 0 0.3rem;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--subtle);
	}
	.status.ready .dot {
		background: var(--success);
	}
	.status.loading .dot {
		background: var(--warning);
		animation: pulse 1s ease-in-out infinite alternate;
	}
	.status.error .dot {
		background: var(--error);
	}
	@keyframes pulse {
		to {
			opacity: 0.3;
		}
	}
	.body {
		flex: 1;
		min-height: 0;
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: 0.6rem;
		padding: 0.5rem 0.6rem 0.6rem;
	}
	.editor-wrap {
		min-height: 0;
		height: 100%;
	}
	.output {
		min-height: 0;
		overflow: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0.4rem 0.6rem;
		background: var(--surface-sunken);
	}
	pre {
		margin: 0.25rem 0;
		font-size: 0.85rem;
		white-space: pre-wrap;
		word-break: break-word;
	}
	.prompt {
		color: var(--muted);
	}
	.err {
		color: var(--error);
	}
	.warn {
		color: var(--warning);
	}
	.pad {
		padding: 0.5rem;
	}
	@media (max-width: 760px) {
		.body {
			grid-template-columns: 1fr;
			grid-template-rows: minmax(160px, 1fr) auto;
		}
	}
</style>
