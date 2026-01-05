<script lang="ts">
  import Upload from '$lib/components/Upload.svelte';
  import Preview from '$lib/components/Preview.svelte';
  import DownloadButton from '$lib/components/DownloadButton.svelte';
  import { glbUrl, optimizedUrl } from '$lib/stores';
</script>

<style>
  .container {
    max-width: 960px;
    margin: 0 auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    color: #fff;
    font-family: 'Inter', system-ui, sans-serif;
  }
  h1, h2 {
    text-align: center;
    font-weight: 200;
    letter-spacing: 0.05em;
    margin: 0;
  }
  h1 {
    font-size: 2.5rem;
    background: linear-gradient(135deg, #fff 0%, #aaa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
</style>

<div class="container">
  <h1>GLB Model Optimizer</h1>
  <Upload />
  
  {#if $glbUrl}
    <Preview glbUrl={$glbUrl} />
  {/if}

  {#if $glbUrl}
     <DownloadButton />
  {/if}

  {#if $optimizedUrl}
    <h2>Optimized Result</h2>
    <Preview glbUrl={$optimizedUrl} />
  {/if}
</div>
