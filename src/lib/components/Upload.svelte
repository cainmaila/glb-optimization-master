<script lang="ts">
  import { glbUrl, selectedFile, selectedFilePath } from '$lib/stores';
  import { open } from '@tauri-apps/plugin-dialog';
  import { convertFileSrc } from '@tauri-apps/api/core';

  /**
   * Opens the native OS file-picker (via Tauri) so the user can select a
   * .glb file.  We then:
   *   1. Store the native path so the Rust command can read it.
   *   2. Convert the path to an `asset://` URL for Three.js preview.
   */
  async function handleOpenFile() {
    const filePath = await open({
      title: '選擇 GLB 檔案',
      filters: [{ name: 'GLB Files', extensions: ['glb'] }],
      multiple: false,
    });

    if (!filePath || typeof filePath !== 'string') return;

    selectedFilePath.set(filePath);
    selectedFile.set(null); // clear any previous browser-File reference

    // Convert the native path to a URL the WebView can load
    const assetUrl = convertFileSrc(filePath);
    glbUrl.set(assetUrl);
  }
</script>

<style>
  .upload {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    backdrop-filter: blur(5px);
    align-items: flex-start;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
  }

  button {
    padding: 0.6rem 1.4rem;
    background: linear-gradient(135deg, #00c6fb 0%, #005bea 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(0, 91, 234, 0.4);
  }

  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 91, 234, 0.6);
  }
</style>

<div class="upload">
  <button on:click={handleOpenFile}>選擇 GLB 檔案…</button>
  <p>點擊按鈕以使用系統文件選擇器開啟 .glb 模型檔案。</p>
</div>
