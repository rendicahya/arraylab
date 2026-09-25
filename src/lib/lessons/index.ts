import { ndarray } from './ndarray';
import { shape } from './shape';
import { axis } from './axis';
import { indexing } from './indexing';
import { dtype } from './dtype';
import { broadcasting } from './broadcasting';
import { vectorization } from './vectorization';
import { torchChapters } from './torch';
import type { Chapter } from './types';

export type { Chapter, Step, Task } from './types';

export const chapters: Chapter[] = [
	ndarray,
	shape,
	axis,
	indexing,
	dtype,
	broadcasting,
	vectorization,
	...torchChapters
];

export function getChapter(slug: string): Chapter | undefined {
	return chapters.find((c) => c.slug === slug);
}
