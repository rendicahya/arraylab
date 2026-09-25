/**
 * Tiny step animator used to walk through elements one at a time
 * (reduction groups, loop iterations, reading order). Always interruptible.
 */
export class Player {
	step = $state<number | null>(null);
	playing = $state(false);
	#timer: ReturnType<typeof setInterval> | null = null;
	#intervalMs: number;

	constructor(intervalMs = 800) {
		this.#intervalMs = intervalMs;
	}

	play(count: number) {
		this.stop();
		if (count <= 0) return;
		this.playing = true;
		this.step = 0;
		this.#timer = setInterval(() => {
			if (this.step === null || this.step >= count - 1) {
				this.stop();
				return;
			}
			this.step += 1;
		}, this.#intervalMs);
	}

	toggle(count: number) {
		if (this.playing) this.stop();
		else this.play(count);
	}

	stop() {
		if (this.#timer) clearInterval(this.#timer);
		this.#timer = null;
		this.playing = false;
		this.step = null;
	}
}
