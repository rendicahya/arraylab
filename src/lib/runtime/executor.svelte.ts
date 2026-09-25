import { browser } from '$app/environment';
import type {
	RunRequest,
	RunResult,
	RuntimeVersions,
	WorkerRequest,
	WorkerResponse
} from './protocol';

export type RuntimeStatus = 'idle' | 'loading' | 'ready' | 'error';

type Pending = { resolve: (r: RunResult | void) => void; reject: (e: Error) => void };

type Outgoing =
	| { type: 'init' }
	| { type: 'run'; request: RunRequest }
	| { type: 'reset'; namespace: string };

/**
 * Single shared Python runtime (Pyodide + NumPy in a Web Worker).
 * The runtime is created lazily on first use and reused for the whole session.
 */
class PythonRuntime {
	status = $state<RuntimeStatus>('idle');
	message = $state('');
	versions = $state<RuntimeVersions | null>(null);
	/** Number of requests currently queued or executing. */
	inFlight = $state(0);
	/** Timestamp at which the currently executing batch started (for "still running" UI). */
	busySince = $state<number | null>(null);
	/** Incremented whenever the worker is restarted; namespaces are lost at that point. */
	generation = $state(0);

	#worker: Worker | null = null;
	#pending = new Map<number, Pending>();
	#nextId = 1;
	#init: Promise<void> | null = null;

	ensure(): Promise<void> {
		if (!browser) return Promise.reject(new Error('The Python runtime only runs in the browser.'));
		if (!this.#init) {
			this.status = 'loading';
			this.message = 'Starting Python…';
			this.#init = this.#send({ type: 'init' }).then(
				() => {
					this.status = 'ready';
					this.message = '';
				},
				(err: Error) => {
					this.status = 'error';
					this.message = err.message;
					this.#init = null;
					throw err;
				}
			) as Promise<void>;
		}
		return this.#init;
	}

	async run(request: RunRequest): Promise<RunResult> {
		await this.ensure();
		return (await this.#send({ type: 'run', request })) as RunResult;
	}

	async resetNamespace(namespace: string): Promise<void> {
		await this.ensure();
		await this.#send({ type: 'reset', namespace });
	}

	/** Stop whatever is running (e.g. an infinite loop) by replacing the worker. */
	restart() {
		this.#worker?.terminate();
		this.#worker = null;
		this.#init = null;
		for (const p of this.#pending.values()) {
			p.reject(new Error('The Python runtime was restarted. Variables were cleared.'));
		}
		this.#pending.clear();
		this.inFlight = 0;
		this.busySince = null;
		this.status = 'idle';
		this.generation += 1;
		void this.ensure().catch(() => {});
	}

	#getWorker(): Worker {
		if (!this.#worker) {
			const worker = new Worker(new URL('./pyodide.worker.ts', import.meta.url), {
				type: 'module',
				name: 'arraylab-python'
			});
			worker.onmessage = (e: MessageEvent<WorkerResponse>) => this.#onMessage(e.data);
			worker.onerror = (e) => {
				const error = new Error(e.message || 'The Python worker crashed.');
				for (const p of this.#pending.values()) p.reject(error);
				this.#pending.clear();
				this.inFlight = 0;
				this.busySince = null;
			};
			this.#worker = worker;
		}
		return this.#worker;
	}

	#send(msg: Outgoing): Promise<RunResult | void> {
		const id = this.#nextId++;
		const worker = this.#getWorker();
		return new Promise((resolve, reject) => {
			this.#pending.set(id, { resolve, reject });
			if (this.inFlight === 0) this.busySince = Date.now();
			this.inFlight += 1;
			worker.postMessage({ ...msg, id } as WorkerRequest);
		});
	}

	#settle(id: number) {
		const p = this.#pending.get(id);
		this.#pending.delete(id);
		this.inFlight = Math.max(0, this.inFlight - 1);
		this.busySince = this.inFlight > 0 ? Date.now() : null;
		return p;
	}

	#onMessage(msg: WorkerResponse) {
		if (msg.type === 'progress') {
			this.message = msg.message;
			return;
		}
		const p = this.#settle(msg.id);
		if (!p) return;
		if (msg.type === 'ready') {
			this.versions = msg.versions;
			p.resolve();
		} else if (msg.type === 'result') {
			p.resolve(msg.result);
		} else if (msg.type === 'done') {
			p.resolve();
		} else if (msg.type === 'fatal') {
			p.reject(new Error(msg.message));
		}
	}
}

export const runtime = new PythonRuntime();
