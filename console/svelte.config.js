import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// The project's .env lives at the repo root, but this app runs from console/.
		// Point SvelteKit's env loading one level up so $env/dynamic/private reads the
		// root .env (DEMO_MODE, CONSOLE_USER_*, etc.) without command-line overrides.
		env: { dir: '..' }
	}
};

export default config;
