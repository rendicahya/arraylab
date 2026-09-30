import { browser } from '$app/environment';

export type Lang = 'en' | 'id';
const STORAGE_KEY = 'arraylab-lang';

/**
 * Language: starts in English, the user can switch, and the choice persists.
 * Unlike theme there is no system-preference source, so this always starts 'en'
 * until init() reads localStorage (kept simple to avoid an SSR/client mismatch).
 */
class LangState {
	current = $state<Lang>('en');

	init() {
		if (!browser) return;
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			this.current = saved === 'id' ? 'id' : 'en';
		} catch {
			this.current = 'en';
		}
		document.documentElement.lang = this.current;
	}

	toggle() {
		this.current = this.current === 'en' ? 'id' : 'en';
		try {
			localStorage.setItem(STORAGE_KEY, this.current);
		} catch {
			/* storage unavailable: the choice lasts for this page view */
		}
		if (browser) document.documentElement.lang = this.current;
	}
}

export const lang = new LangState();
