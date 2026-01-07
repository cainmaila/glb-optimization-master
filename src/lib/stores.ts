import { writable } from 'svelte/store'

// Store for the selected GLB File object
export const selectedFile = writable<File | null>(null)

// Store for the object URL of the uploaded GLB (used for preview)
export const glbUrl = writable<string>('')

// Store for the optimized GLB Blob URL (download link)
export const optimizedUrl = writable<string>('')
