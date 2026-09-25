import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

/**
 * ArrayLab is deployed as a GitHub Pages project site at
 * https://rendicahya.github.io/arraylab/, so the default base path is `/arraylab`.
 * Set BASE_PATH='' to build for a domain root instead.
 */
const base = (process.env.BASE_PATH ?? '/arraylab') as '' | `/${string}`;

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: '404.html',
				strict: true
			}),
			paths: { base, relative: true },
			prerender: { handleHttpError: 'fail', handleMissingId: 'fail' }
		})
	],
	worker: { format: 'es' }
});
