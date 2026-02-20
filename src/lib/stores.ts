import { writable } from 'svelte/store';

// Store for the selected GLB File object (browser file API)
export const selectedFile = writable<File | null>(null);

// Native file system path of the selected GLB file (used by the Tauri command)
export const selectedFilePath = writable<string>('');

// Store for the object URL of the uploaded GLB (used for preview)
export const glbUrl = writable<string>('');

// Store for the optimized GLB Blob URL (download link)
export const optimizedUrl = writable<string>('');

// Native file system path of the optimized output written by the sidecar
export const optimizedFilePath = writable<string>('');
