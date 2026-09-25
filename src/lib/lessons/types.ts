import type { LabPatch, SourceState } from '../lab/types';

/** A "try this" suggestion. With a patch it becomes a one-click action. */
export type Task = { text: string; patch?: LabPatch };

export type Step = {
	title: string;
	/** Paragraphs; `code` and **bold** are supported. */
	body: string[];
	/** Lab state applied when the step opens. */
	patch: LabPatch;
	tasks?: Task[];
	/** Short takeaway shown under the tasks. */
	remember?: string;
};

export type Chapter = {
	slug: string;
	number: string;
	title: string;
	summary: string;
	topics: string[];
	phase: 'numpy' | 'torch';
	steps: Step[];
};

/** Source patch for typed numbers. */
export function literal(text: string, dtype = ''): { source: Partial<SourceState> } {
	return { source: { mode: 'literal', text, dtype } };
}

/** Source patch for a NumPy expression. */
export function expr(expression: string): { source: Partial<SourceState> } {
	return { source: { mode: 'expr', expr: expression } };
}
