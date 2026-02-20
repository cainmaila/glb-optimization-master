// Disable SSR globally so the entire app is generated as a client-side SPA.
// This is required for Tauri which loads the static build from the filesystem.
export const ssr = false;
export const prerender = true;
