import type { ArrayInfo, FrameInfo, ValueInfo } from '../array/types';

/** Messages exchanged between the UI thread and the Pyodide worker. */
export type RunRequest = {
	/** Code shown to (or written by) the learner. Errors are reported against it. */
	code: string;
	/** Isolated Python namespace to run in; each lab page has its own. */
	namespace: string;
	/** Hidden helper code run after `code` (e.g. provenance maps for highlighting). */
	extra?: string;
	/** Names removed from the namespace before running, so no stale value is reported. */
	clear?: string[];
	/** Variables to describe in full (with preview values) after execution. */
	targets?: string[];
	/** Also return a summary of every ndarray / DataFrame / Series variable in the namespace. */
	listVariables?: boolean;
};

export type PyError = {
	type: string;
	message: string;
	line: number | null;
	traceback: string;
};

export type RunResult = {
	stdout: string;
	stderr: string;
	result: (ValueInfo & { repr?: string }) | null;
	targets: Record<string, ValueInfo>;
	error: PyError | null;
	variables?: (ArrayInfo | FrameInfo)[];
};

export type RuntimeVersions = { python: string; numpy: string; pyodide: string };

export type WorkerRequest =
	| { id: number; type: 'init' }
	| { id: number; type: 'run'; request: RunRequest }
	| { id: number; type: 'reset'; namespace: string };

export type WorkerResponse =
	| { id: number; type: 'progress'; message: string }
	| { id: number; type: 'ready'; versions: RuntimeVersions }
	| { id: number; type: 'result'; result: RunResult }
	| { id: number; type: 'done' }
	| { id: number; type: 'fatal'; message: string };
