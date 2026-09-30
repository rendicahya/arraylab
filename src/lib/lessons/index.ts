import { ndarray } from './ndarray';
import { shape } from './shape';
import { axis } from './axis';
import { indexing } from './indexing';
import { dtype } from './dtype';
import { broadcasting } from './broadcasting';
import { vectorization } from './vectorization';
import { views } from './views';
import { combining } from './combining';
import { torchChapters } from './torch';
import { pandas } from './pandas';
import type { Chapter } from './types';
import { localize } from './localize';
import { chapterTextId } from './id';
import type { Lang } from '../i18n/lang.svelte';

export type { Chapter, Step, Task } from './types';

export const chapters: Chapter[] = [
	ndarray,
	shape,
	axis,
	indexing,
	dtype,
	broadcasting,
	vectorization,
	views,
	combining,
	...torchChapters,
	pandas
];

/**
 * The English chapter, translated into `lang` if needed. Takes `lang` explicitly
 * (rather than reading the app's language store) so this module stays free of
 * SvelteKit-only imports and can be used from plain Node scripts and tests.
 */
export function localizeChapter(chapter: Chapter, lang: Lang = 'en'): Chapter {
	if (lang !== 'id') return chapter;
	const text = chapterTextId[chapter.slug];
	return text ? localize(chapter, text) : chapter;
}

export function getChapter(slug: string): Chapter | undefined {
	return chapters.find((c) => c.slug === slug);
}
