import type { Chapter, ChapterText } from './types';

/** Applies Indonesian text onto an (English) chapter, keeping its patches and structure. */
export function localize(chapter: Chapter, text: ChapterText): Chapter {
	return {
		...chapter,
		title: text.title,
		summary: text.summary,
		topics: text.topics,
		steps: chapter.steps.map((step, i) => {
			const st = text.steps[i];
			return {
				...step,
				title: st.title,
				body: st.body,
				remember: st.remember,
				tasks: step.tasks?.map((task, j) => ({ ...task, text: st.tasks![j].text }))
			};
		})
	};
}
