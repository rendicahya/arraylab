<script lang="ts">
	import { onMount } from 'svelte';
	import type { EditorView } from '@codemirror/view';

	/**
	 * CodeMirror 6 Python editor. Colors come from the theme's CSS variables, so
	 * the editor follows light/dark mode without reconfiguration.
	 */
	let {
		value = $bindable(''),
		readonly = false,
		label,
		onrun
	}: { value?: string; readonly?: boolean; label: string; onrun?: () => void } = $props();

	let host: HTMLDivElement;
	let view: EditorView | null = null;
	let resizeObserver: ResizeObserver | null = null;
	let loaded = $state(false);

	onMount(() => {
		let destroyed = false;
		(async () => {
			const [{ EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection }, { EditorState }, commands, language, { python }, { tags }] =
				await Promise.all([
					import('@codemirror/view'),
					import('@codemirror/state'),
					import('@codemirror/commands'),
					import('@codemirror/language'),
					import('@codemirror/lang-python'),
					import('@lezer/highlight')
				]);
			if (destroyed) return;

			const highlight = language.HighlightStyle.define([
				{ tag: tags.keyword, color: 'var(--code-keyword)' },
				{ tag: [tags.string, tags.special(tags.string)], color: 'var(--code-string)' },
				{ tag: [tags.number, tags.bool, tags.null], color: 'var(--code-number)' },
				{ tag: tags.comment, color: 'var(--code-comment)', fontStyle: 'italic' },
				{ tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: 'var(--code-function)' },
				{ tag: [tags.operator, tags.punctuation], color: 'var(--code-operator)' }
			]);

			const theme = EditorView.theme({
				'&': { backgroundColor: 'var(--code-bg)', color: 'var(--foreground)', height: '100%', fontSize: '0.9rem' },
				'.cm-content': { fontFamily: 'var(--font-mono)', caretColor: 'var(--accent)', padding: '0.4rem 0' },
				'.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.55' },
				'.cm-gutters': {
					backgroundColor: 'var(--code-bg)',
					color: 'var(--subtle)',
					border: 'none',
					fontFamily: 'var(--font-mono)'
				},
				'.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--accent) 6%, transparent)' },
				'.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--muted)' },
				'&.cm-focused': { outline: '2px solid var(--focus-ring)', outlineOffset: '-2px' },
				'.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
					backgroundColor: 'var(--code-selection) !important'
				},
				'.cm-cursor': { borderLeftColor: 'var(--accent)' }
			});

			const runKey = {
				key: 'Mod-Enter',
				preventDefault: true,
				run: () => {
					onrun?.();
					return true;
				}
			};

			view = new EditorView({
				parent: host,
				state: EditorState.create({
					doc: value,
					extensions: [
						lineNumbers(),
						drawSelection(),
						highlightActiveLine(),
						commands.history(),
						language.indentOnInput(),
						language.bracketMatching(),
						language.syntaxHighlighting(highlight),
						python(),
						theme,
						EditorState.readOnly.of(readonly),
						EditorView.editable.of(!readonly),
						EditorView.contentAttributes.of({ 'aria-label': label }),
						keymap.of([runKey, commands.indentWithTab, ...commands.defaultKeymap, ...commands.historyKeymap]),
						EditorView.updateListener.of((u) => {
							if (u.docChanged) value = u.state.doc.toString();
						})
					]
				})
			});
			loaded = true;
			// Line heights can change after web fonts load or the panel is laid out
			// (e.g. stacked on mobile); re-measure so gutters stay aligned.
			const remeasure = () => view?.requestMeasure();
			void document.fonts?.ready.then(remeasure);
			resizeObserver = new ResizeObserver(remeasure);
			resizeObserver.observe(host);
		})();
		return () => {
			destroyed = true;
			resizeObserver?.disconnect();
			view?.destroy();
			view = null;
		};
	});

	// Push external value changes (e.g. new generated code) into the editor.
	$effect(() => {
		const next = value;
		if (view && view.state.doc.toString() !== next) {
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: next } });
		}
	});
</script>

<div class="editor" bind:this={host}>
	{#if !loaded}<pre class="fallback" aria-label={label}>{value}</pre>{/if}
</div>

<style>
	.editor {
		height: 100%;
		min-height: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--code-bg);
	}
	.editor :global(.cm-editor) {
		height: 100%;
	}
	.fallback {
		margin: 0;
		padding: 0.4rem 0.8rem;
		font-size: 0.9rem;
		line-height: 1.55;
		white-space: pre;
		overflow: auto;
		height: 100%;
	}
</style>
