import { error } from '@sveltejs/kit';
import { chapters, getChapter } from '$lib/lessons';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => chapters.map((c) => ({ slug: c.slug }));

export const load: PageLoad = ({ params }) => {
	const chapter = getChapter(params.slug);
	if (!chapter) error(404, 'Chapter not found');
	return { chapter };
};
