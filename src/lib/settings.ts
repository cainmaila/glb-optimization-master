import { writable } from 'svelte/store';

export type OptimizationConfig = {
  draco: boolean;
  meshopt: boolean;
  quantize: boolean;
  textureFormat: 'original' | 'webp' | 'ktx2';
  maxTextureSize: number;
  prune: boolean;
  dedup: boolean;
  instance: boolean;
  join: boolean;
};

export const defaultSettings: OptimizationConfig = {
  draco: true,
  meshopt: false,
  quantize: true,
  textureFormat: 'original',
  maxTextureSize: 4096,
  prune: true,
  dedup: true,
  instance: false, // Disabled by default: can cause displacement on models not designed for instancing
  join: true,
};

export const settings = writable<OptimizationConfig>({ ...defaultSettings });
