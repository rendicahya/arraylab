import { browser } from '$app/environment';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'arraylab-theme';

/**
 * Theme: starts from the system preference, the user can override it, and the
 * override persists. The inline script in app.html applies it before first paint.
 */
class ThemeState {
	current = $state<Theme>('light');
	#override: Theme | null = null;

	init() {
		if (!browser) return;
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			this.#override = saved === 'light' || saved === 'dark' ? saved : null;
		} catch {
			this.#override = null;
		}
		const media = matchMedia('(prefers-color-scheme: dark)');
		const sync = () => this.#apply(this.#override ?? (media.matches ? 'dark' : 'light'));
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	}

	toggle() {
		this.#override = this.current === 'dark' ? 'light' : 'dark';
		try {
			localStorage.setItem(STORAGE_KEY, this.#override);
		} catch {
			/* storage unavailable: the choice lasts for this page view */
		}
		this.#apply(this.#override);
	}

	#apply(theme: Theme) {
		this.current = theme;
		document.documentElement.dataset.theme = theme;
	}
}

export const theme = new ThemeState();
