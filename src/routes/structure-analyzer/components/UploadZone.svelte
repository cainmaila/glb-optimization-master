<script lang="ts">
  import { Upload } from 'lucide-svelte';
  import { structureStore } from '../stores/structureStore.svelte';

  let isDragOver = $state(false);
  let fileInput: HTMLInputElement;

  const isLoading = $derived(structureStore.isLoading);
  const loadProgress = $derived(structureStore.loadProgress);
  const error = $derived(structureStore.error);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.glb')) {
      structureStore.error = '請選擇 .glb 格式的檔案';
      return;
    }

    if (file.size > 500 * 1024 * 1024) { // 500MB 限制
      structureStore.error = '檔案過大（超過 500MB）';
      return;
    }

    await structureStore.loadModel(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFile(input.files[0]);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  }
</script>

<div
  class="upload-zone"
  class:drag-over={isDragOver}
  role="button"
  tabindex="0"
  ondrop={handleDrop}
  ondragover={(e) => { e.preventDefault(); isDragOver = true; }}
  ondragleave={() => isDragOver = false}
  onclick={() => fileInput.click()}
  onkeydown={handleKeydown}
>
  <input
    type="file"
    accept=".glb"
    bind:this={fileInput}
    onchange={handleFileSelect}
    style="display: none"
  />

  {#if isLoading}
    <div class="loading">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {loadProgress}%"></div>
      </div>
      <p>載入中... {loadProgress}%</p>
    </div>
  {:else if error}
    <div class="error">
      <p>{error}</p>
      <button onclick={() => structureStore.error = null}>重試</button>
    </div>
  {:else}
    <Upload size={48} />
    <p>拖曳 GLB 檔案至此，或點擊選擇</p>
  {/if}
</div>

<style>
  .upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3rem;
    border: 2px dashed rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    background: rgba(255, 255, 255, 0.02);
  }

  .upload-zone:hover,
  .upload-zone.drag-over {
    border-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.05);
  }

  .loading, .error {
    width: 100%;
    text-align: center;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    transition: width 0.3s;
  }

  button {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    color: #fff;
    cursor: pointer;
    margin-top: 1rem;
    transition: background 0.2s;
  }

  button:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  p {
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }
</style>
