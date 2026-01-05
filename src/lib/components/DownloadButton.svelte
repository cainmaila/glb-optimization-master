<script lang="ts">
  import { selectedFile, optimizedUrl } from '$lib/stores';

  let isProcessing = false;
  let progress = '';

  async function handleOptimize() {
    if (!$selectedFile) return;

    isProcessing = true;
    progress = 'Uploading & Optimizing...';

    try {
      const formData = new FormData();
      formData.append('file', $selectedFile);

      const response = await fetch('/api/optimize', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Optimization failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      optimizedUrl.set(url);
      progress = 'Done!';
    } catch (error) {
      console.error(error);
      progress = 'Error occurred';
    } finally {
      isProcessing = false;
    }
  }

  function handleDownload() {
    if (!$optimizedUrl) return;
    const a = document.createElement('a');
    a.href = $optimizedUrl;
    a.download = 'optimized_model.glb';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
</script>

<style>
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
    margin-left: 1rem;
  }
</style>

<div class="controls">
  <button 
    class="btn-optimize" 
    on:click={handleOptimize} 
    disabled={isProcessing}
  >
    {isProcessing ? 'Processing...' : 'Start Optimization'}
  </button>

  {#if $optimizedUrl}
    <button class="btn-download" on:click={handleDownload}>
      Download Optimized
    </button>
  {/if}

  {#if progress}
    <span class="status">{progress}</span>
  {/if}
</div>
