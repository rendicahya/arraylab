import { browser } from '$app/environment';

type LegacyDocument = Document & {
	webkitFullscreenElement?: Element | null;
	webkitExitFullscreen?: () => Promise<void> | void;
	webkitFullscreenEnabled?: boolean;
};
type LegacyElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };

/** Mirrors the browser Fullscreen API, including exits via Esc or browser controls. */
class FullscreenState {
	active = $state(false);
	supported = $state(false);
	error = $state<string | null>(null);

	init() {
		if (!browser) return;
		const doc = document as LegacyDocument;
		this.supported = Boolean(document.fullscreenEnabled ?? doc.webkitFullscreenEnabled);
		const sync = () => {
			this.active = Boolean(document.fullscreenElement ?? doc.webkitFullscreenElement);
			document.documentElement.dataset.fullscreen = String(this.active);
		};
		sync();
		document.addEventListener('fullscreenchange', sync);
		document.addEventListener('webkitfullscreenchange', sync);
		return () => {
			document.removeEventListener('fullscreenchange', sync);
			document.removeEventListener('webkitfullscreenchange', sync);
		};
	}

	async toggle() {
		const doc = document as LegacyDocument;
		const root = document.documentElement as LegacyElement;
		this.error = null;
		try {
			if (this.active) {
				await (document.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
			} else {
				await (root.requestFullscreen?.() ?? root.webkitRequestFullscreen?.());
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Fullscreen was blocked by the browser.';
		}
	}
}

export const fullscreen = new FullscreenState();
