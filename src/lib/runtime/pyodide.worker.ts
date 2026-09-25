/// <reference lib="webworker" />
import extractorSource from './extractor.py?raw';
import { PYODIDE_INDEX_URL, PYODIDE_VERSION } from './config';
import type { RuntimeVersions, WorkerRequest, WorkerResponse } from './protocol';

type PyodideAPI = {
	loadPackage(names: string | string[], options?: { messageCallback?: (m: string) => void }): Promise<void>;
	runPython(code: string): unknown;
	globals: { get(name: string): (...args: unknown[]) => unknown };
};

const ctx = self as unknown as DedicatedWorkerGlobalScope;
let ready: Promise<PyodideAPI> | null = null;

function post(msg: WorkerResponse) {
	ctx.postMessage(msg);
}

async function boot(id: number): Promise<PyodideAPI> {
	post({ id, type: 'progress', message: 'Downloading Python runtime…' });
	const mod = (await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`)) as {
		loadPyodide(opts: { indexURL: string }): Promise<PyodideAPI>;
	};
	const py = await mod.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
	post({ id, type: 'progress', message: 'Loading NumPy…' });
	await py.loadPackage('numpy');
	py.runPython(extractorSource);
	return py;
}

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
	const msg = event.data;
	try {
		if (!ready) {
			ready = boot(msg.id);
			// Allow a later request to retry after a failed download.
			ready.catch(() => (ready = null));
		}
		const py = await ready;
		if (msg.type === 'init') {
			const v = JSON.parse(py.globals.get('versions')() as string) as Omit<RuntimeVersions, 'pyodide'>;
			post({ id: msg.id, type: 'ready', versions: { ...v, pyodide: PYODIDE_VERSION } });
		} else if (msg.type === 'run') {
			const out = py.globals.get('run')(JSON.stringify(msg.request)) as string;
			post({ id: msg.id, type: 'result', result: JSON.parse(out) });
		} else if (msg.type === 'reset') {
			py.globals.get('reset')(msg.namespace);
			post({ id: msg.id, type: 'done' });
		}
	} catch (err) {
		post({ id: msg.id, type: 'fatal', message: err instanceof Error ? err.message : String(err) });
	}
};
