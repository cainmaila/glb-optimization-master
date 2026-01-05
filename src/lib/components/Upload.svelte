<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { glbUrl, selectedFile } from '$lib/stores';
  
  const dispatch = createEventDispatcher();

  function handleFile(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const url = URL.createObjectURL(file);
      
      glbUrl.set(url);
      selectedFile.set(file);
      
      dispatch('fileSelected', { file });
    }
  }
</script>

<style>
  .upload {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
    backdrop-filter: blur(5px);
  }
  input[type='file'] {
    cursor: pointer;
    padding: 0.5rem;
    border: 2px solid #fff3;
    border-radius: 4px;
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
</style>

<div class="upload">
  <label for="glb-upload">選擇 GLB 檔案：</label>
  <input id="glb-upload" type="file" accept=".glb" on:change={handleFile} />
</div>
