import { runtime } from '../runtime/executor.svelte';
import type { RunResult } from '../runtime/protocol';
import type { ArrayInfo } from '../array/types';
import { isArrayInfo } from '../array/types';
import { parseLiteral, type Nested } from '../array/literal';
import { buildSpec, type RunSpec } from './codegen';
import { DEFAULT_SETTINGS, type LabPatch, type LabSettings, type ToolId } from './types';

const RUN_DEBOUNCE_MS = 120;
let labCount = 0;

const DEFAULT_SCRATCH = `import numpy as np

a = np.array([
    [1, 2, 3],
    [4, 5, 6]
])

a.shape`;

/** Best-effort label for the last expression, e.g. `a.T` or `np.sum(a, axis=0)`. */
function guessName(code: string): string {
	const lines = code.trim().split('\n');
	const last = lines[lines.length - 1].trim();
	return last.length <= 28 ? last : 'result';
}

/**
 * State of one interactive lab: the source array `a`, the active tool and its
 * parameters, and the latest NumPy result. Each page owns one Lab, which runs in
 * its own Python namespace.
 */
export class Lab {
	readonly namespace: string;
	settings = $state<LabSettings>(structuredClone(DEFAULT_SETTINGS));
	/** Code + helpers for the current settings (recomputed on every change). */
	spec: RunSpec = $derived(buildSpec(this.settings));

	result = $state<RunResult | null>(null);
	/** The spec that produced `result` (the code panel shows exactly what ran). */
	ranSpec = $state<RunSpec | null>(null);
	running = $state(false);
	/** Failure of the runtime itself (download blocked, worker restarted…). */
	runtimeError = $state<string | null>(null);

	#seq = 0;

	constructor(name: string, patch?: LabPatch) {
		this.namespace = `${name}-${++labCount}`;
		if (patch) this.apply(patch);
	}

	apply(patch: LabPatch) {
		const s = this.settings;
		if (patch.tool) s.tool = patch.tool;
		if (patch.source) Object.assign(s.source, patch.source);
		if (patch.axis) Object.assign(s.axis, patch.axis);
		if (patch.index) Object.assign(s.index, patch.index);
		if (patch.reshape) Object.assign(s.reshape, patch.reshape);
		if (patch.broadcast) Object.assign(s.broadcast, patch.broadcast);
		if (patch.vectorize) Object.assign(s.vectorize, patch.vectorize);
		if (patch.dtype) Object.assign(s.dtype, patch.dtype);
		if (patch.code !== undefined) {
			this.scratchCode = patch.code;
			this.scratchResult = null;
			this.scratchView = null;
		}
	}

	/** A described target from the latest result, e.g. `lab.target('a')`. */
	target(name: string): ArrayInfo | null {
		const v = this.result?.targets[name];
		return isArrayInfo(v) ? v : null;
	}

	/** Latest result, but only if it was produced by `tool` (avoids flashes when switching). */
	resultFor(tool: ToolId): RunResult | null {
		return this.ranSpec?.tool === tool ? this.result : null;
	}

	// ---- Code editor ("Your code") --------------------------------------------------

	scratchCode = $state(DEFAULT_SCRATCH);
	scratchResult = $state<RunResult | null>(null);
	scratchRunning = $state(false);
	/** Variable currently visualized in the "Your code" view. */
	scratchView = $state<ArrayInfo | null>(null);

	/** The code that produced `scratchResult` (the editor may have changed since). */
	scratchRanCode = $state('');

	async runScratch() {
		this.scratchRunning = true;
		this.settings.tool = 'code';
		const code = this.scratchCode;
		try {
			const result = await runtime.run({
				code,
				namespace: this.namespace,
				listVariables: true
			});
			this.scratchResult = result;
			this.scratchRanCode = code;
			this.runtimeError = null;
			const last = result.result;
			if (isArrayInfo(last)) {
				this.scratchView = { ...last, name: guessName(this.scratchCode) };
			} else if (result.variables?.length && !result.error) {
				const names = result.variables.map((v) => v.name);
				const assigned = [...this.scratchCode.matchAll(/^(\w+)\s*=/gm)].map((m) => m[1]);
				const pick = assigned.reverse().find((n) => names.includes(n)) ?? names[names.length - 1];
				await this.showVariable(pick!);
			} else if (!result.error) {
				this.scratchView = null;
			}
		} catch (err) {
			// e.g. stopped by restarting the runtime: drop results that no longer exist.
			this.runtimeError = err instanceof Error ? err.message : String(err);
			this.scratchResult = null;
			this.scratchView = null;
		} finally {
			this.scratchRunning = false;
		}
	}

	async showVariable(name: string) {
		const r = await runtime.run({ code: '', namespace: this.namespace, targets: [name] });
		const v = r.targets[name];
		if (isArrayInfo(v)) this.scratchView = v;
		this.settings.tool = 'code';
	}

	/** True when the visible result belongs to the current settings. */
	get fresh(): boolean {
		return this.ranSpec?.code === this.spec.code && this.ranSpec?.extra === this.spec.extra;
	}

	/**
	 * Array described from the typed numbers alone, shown while NumPy is still
	 * loading. It has no dtype yet: that is NumPy's decision, not ours.
	 */
	get provisional(): ArrayInfo | null {
		const src = this.settings.source;
		if (src.mode !== 'literal') return null;
		const parsed = parseLiteral(src.text);
		if (!parsed.ok || !parsed.shape) return null;
		const flat: string[] = [];
		const walk = (n: Nested) => (typeof n === 'string' ? flat.push(n.replace('np.', '')) : n.forEach(walk));
		walk(parsed.nested);
		return {
			kind: 'array',
			name: 'a',
			backend: 'numpy',
			shape: parsed.shape,
			ndim: parsed.shape.length,
			size: flat.length,
			dtype: '…',
			dtypeKind: '',
			itemsize: 0,
			nbytes: 0,
			strides: [],
			cContiguous: true,
			ownsData: true,
			writeable: true,
			values: flat,
			previewShape: parsed.shape,
			truncated: false
		};
	}

	/** Re-run whenever the generated code changes. Call during component setup. */
	connect() {
		$effect(() => {
			const spec = this.spec;
			void runtime.generation; // re-run after a runtime restart
			if (spec.inputError || spec.skip) return;
			const timer = setTimeout(() => void this.#execute(spec), RUN_DEBOUNCE_MS);
			return () => clearTimeout(timer);
		});
	}

	async #execute(spec: RunSpec) {
		const seq = ++this.#seq;
		this.running = true;
		try {
			const result = await runtime.run({
				code: spec.code,
				extra: spec.extra,
				targets: spec.targets,
				clear: spec.clear,
				namespace: this.namespace
			});
			if (seq !== this.#seq) return;
			this.result = result;
			this.ranSpec = spec;
			this.runtimeError = null;
		} catch (err) {
			if (seq !== this.#seq) return;
			this.runtimeError = err instanceof Error ? err.message : String(err);
		} finally {
			if (seq === this.#seq) this.running = false;
		}
	}
}
