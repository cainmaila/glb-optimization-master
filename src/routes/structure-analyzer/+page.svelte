<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
  import UploadZone from './components/UploadZone.svelte';
  import TreeMenu from './components/TreeMenu.svelte';
  import StructureViewer from './components/StructureViewer.svelte';
  import { structureStore } from './stores/structureStore.svelte';

  const hasModel = $derived(!!structureStore.model);
</script>

<div class="page-container">
  <!-- 返回連結 -->
  <a href="/" class="back-link">
    <ArrowLeft size={16} /> Back to Home
  </a>

  <h1>結構解析大師</h1>

  {#if !hasModel}
    <!-- 上傳區域 -->
    <div class="upload-container">
      <UploadZone />
    </div>
  {:else}
    <!-- Viewer 介面 -->
    <div class="viewer-layout">
      <TreeMenu />
      <StructureViewer />
    </div>
  {/if}
</div>

<style>
  .page-container {
    min-height: 100vh;
    padding: 2rem;
    color: #fff;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    margin-bottom: 1rem;
    transition: color 0.2s;
  }

  .back-link:hover {
    color: #fff;
  }

  h1 {
    font-size: 2rem;
    font-weight: 200;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, #fff 0%, #f093fb 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .upload-container {
    max-width: 600px;
    margin: 4rem auto;
  }

  .viewer-layout {
    display: flex;
    height: calc(100vh - 12rem);
    background: rgba(255, 255, 255, 0.02);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
</style>
