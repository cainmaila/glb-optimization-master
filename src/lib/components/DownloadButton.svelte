<script lang="ts">
  import { selectedFilePath, optimizedUrl, optimizedFilePath } from '$lib/stores';
  import { settings } from '$lib/settings';
  import ComparisonReport from './ComparisonReport.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { save } from '@tauri-apps/plugin-dialog';
  import { copyFile } from '@tauri-apps/plugin-fs';

  let isProcessing = false;
  let progress = '';
  let reports: { original: any; optimized: any } | null = null;

  async function handleOptimize() {
    if (!$selectedFilePath) return;

    isProcessing = true;
    progress = 'Optimizing…';
    reports = null;

    try {
      // Invoke the Rust command which calls the Node.js sidecar
      const resultJson = await invoke<string>('optimize_glb', {
        inputPath: $selectedFilePath,
        config: JSON.stringify($settings),
      });

      const { outputPath, originalReport, optimizedReport } = JSON.parse(resultJson);

      // Convert the native output path to an asset URL for the WebView preview
      const assetUrl = convertFileSrc(outputPath);
      optimizedUrl.set(assetUrl);
      optimizedFilePath.set(outputPath);

      reports = { original: originalReport, optimized: optimizedReport };
      progress = 'Done!';
    } catch (error) {
      console.error(error);
      progress = `Error: ${error}`;
    } finally {
      isProcessing = false;
    }
  }

  async function handleDownload() {
    if (!$optimizedFilePath) return;

    const destPath = await save({
      title: '儲存優化後的 GLB',
      filters: [{ name: 'GLB File', extensions: ['glb'] }],
      defaultPath: 'optimized_model.glb',
    });

    if (destPath) {
      await copyFile($optimizedFilePath, destPath);
    }
  }
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
  }

  .controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(5px);
  }

  .btn-optimize {
    background: linear-gradient(135deg, #00c6fb 0%, #005bea 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(0, 91, 234, 0.4);
  }

  .btn-optimize:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 91, 234, 0.6);
  }

  .btn-download {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    color: #1a1a1a;
    box-shadow: 0 4px 15px rgba(67, 233, 123, 0.4);
  }

    .btn-download:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(67, 233, 123, 0.6);
  }

  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .status {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    text-align: center;
  }
</style>

<div class="container">
  
  <div class="controls optimize-section">
    <button 
      class="btn-optimize" 
      on:click={handleOptimize} 
      disabled={isProcessing}
    >
      {isProcessing ? 'Processing… (High CPU)' : 'Optimize & Download'}
    </button>
  </div>

  {#if progress && !reports}
    <div class="status">{progress}</div>
  {/if}
  
  {#if reports}
    <ComparisonReport original={reports.original} optimized={reports.optimized} />
  {/if}

  {#if $optimizedUrl}
    <div class="controls download-section">
      <button class="btn-download" on:click={handleDownload}>
        另存 .GLB 檔案…
      </button>
    </div>
  {/if}

</div>
