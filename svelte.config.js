import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// adapter-static outputs a fully static site suitable for Tauri.
		// fallback: 'index.html' enables SPA-style client-side routing so all
		// routes are served from the single entry point when loaded from a file
		// URL (as Tauri does).
		adapter: adapter({ fallback: 'index.html' })
	}
};

export default config;
