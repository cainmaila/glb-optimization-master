<script lang="ts">
  import { settings, defaultSettings } from '$lib/settings';
  import { slide } from 'svelte/transition';
  import { ChevronDown, ChevronUp, RefreshCw, Info } from 'lucide-svelte';

  let isOpen = false;

  function resetSettings() {
    settings.set({ ...defaultSettings });
  }

  function toggleOpen() {
    isOpen = !isOpen;
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      toggleOpen();
      event.preventDefault();
    }
  }

  // Mutually exclusive logic
  function toggleDraco() {
    if ($settings.draco) {
      $settings.meshopt = false;
    }
  }

  function toggleMeshopt() {
    if ($settings.meshopt) {
      $settings.draco = false;
    }
  }

  const tips = {
    draco: {
      title: "Draco Compression",
      pros: "極致壓縮幾何數據，檔案體積最小（可減少 50-80%）。",
      cons: "載入時需要 CPU 解碼，前端需引入 DracoLoader (約 400KB)。",
    },
    meshopt: {
      title: "Meshopt Compression",
      pros: "解碼速度極快，優化 GPU 傳輸效率。",
      cons: "壓縮率略低於 Draco，前端需引入 MeshoptDecoder。",
    },
    quantize: {
      title: "Quantization (量化)",
      pros: "將 32-bit浮點數轉為整數，減少記憶體佔用且幾乎無損。",
      cons: "在極端精細的幾何體上可能會有微米級的精度誤差。",
    },
    maxSize: {
      title: "Max Texture Size",
      pros: "大幅減少顯存 (VRAM) 佔用與下載頻寬。",
      cons: "貼圖解析度降低，近看可能較模糊。",
    },
    format: {
      title: "Texture Format",
      pros: "WebP 相比 JPEG/PNG 可減少 30% 大小且保留透明度。",
      cons: "非標準格式，需確認目標平台的瀏覽器支援度 (現代瀏覽器皆支援)。",
    },
    prune: {
      title: "Prune (移除未使用)",
      pros: "自動刪除未被場景引用的孤立節點、材質或貼圖。",
      cons: "無副作用，除非您需要保留這些隱藏資源供後續程式調用。",
    },
    dedup: {
      title: "Deduplicate (去重)",
      pros: "合併內容完全相同的 Accessor 或貼圖，減少冗餘。",
      cons: "無副作用。",
    },
    join: {
      title: "Join Meshes (合併網格)",
      pros: "將多個物件合併為單一網格，大幅減少 Draw Calls。",
      cons: "會破壞原始物件層級結構（如：無法再對個別零件做動畫）。",
    },
    instance: {
      title: "GPU Instancing",
      pros: "讓重複的網格共用幾何數據，極大提升渲染效能 (Draw Calls)。",
      cons: "⚠️ 風險選項。若模型未針對 Instancing 設計，會導致嚴重的錯位或變形。",
    }
  };
</script>

<style>
  .settings-panel {
    background: rgba(30, 41, 59, 0.7);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    /* overflow: hidden; Removed to allow tooltips to show */
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    margin: 1rem 0;
    position: relative; /* Ensure z-index context */
    z-index: 10;
  }

  /* ... (Header styles remain same) ... */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    cursor: pointer;
    user-select: none;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid transparent;
    transition: background-color 0.2s;
    border-radius: 12px 12px 0 0; /* Manual corner rounding */
  }
  
  .header[aria-expanded="true"] {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .header:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .header:focus {
    outline: 2px solid #00c6fb;
    outline-offset: -2px;
  }

  .title {
    font-weight: 600;
    font-size: 1.1rem;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .content {
    padding: 1.5rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2.5rem;
    background: rgba(15, 23, 42, 0.3);
    border-radius: 0 0 12px 12px; /* Manual corner rounding */
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  h3 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #94a3b8;
    margin: 0 0 0.5rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    font-weight: 700;
  }

  .control {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
  }

  .label-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
  }

  label {
    font-size: 0.95rem;
    color: #e2e8f0;
    cursor: pointer;
  }

  /* Tooltip Styles */
  .tooltip-icon {
    color: #64748b;
    cursor: help;
    transition: color 0.2s;
    display: flex;
  }
  
  .tooltip-icon:hover {
    color: #00c6fb;
  }

  .tooltip-content {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    background: #1e293b;
    border: 1px solid #475569;
    padding: 0.8rem;
    border-radius: 8px;
    width: 240px;
    z-index: 100;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    pointer-events: none;
    transition: all 0.2s ease;
    margin-bottom: 0.5rem;
  }

  .tooltip-icon:hover .tooltip-content {
    visibility: visible;
    opacity: 1;
    transform: translateX(-50%) translateY(-5px);
  }

  .tip-title {
    display: block;
    color: #f8fafc;
    font-weight: 600;
    margin-bottom: 0.4rem;
    border-bottom: 1px solid #334155;
    padding-bottom: 0.2rem;
  }

  .tip-row {
     display: block;
     font-size: 0.8rem;
     line-height: 1.4;
     margin-bottom: 0.4rem;
     color: #cbd5e1;
  }

  .tip-label {
    color: #94a3b8;
    font-size: 0.7rem;
    text-transform: uppercase;
    font-weight: 700;
    display: block;
  }

  /* ... (Existing Input Styles) ... */
  input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 1.4rem;
    height: 1.4rem;
    background-color: rgba(0, 0, 0, 0.3);
    border: 2px solid #475569;
    border-radius: 6px;
    cursor: pointer;
    display: grid;
    place-content: center;
    transition: all 0.2s;
  }

  input[type="checkbox"]::before {
    content: "";
    width: 0.8rem;
    height: 0.8rem;
    transform: scale(0);
    transition: 0.12s transform ease-in-out;
    box-shadow: inset 1em 1em white;
    transform-origin: center;
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  }

  input[type="checkbox"]:checked {
    background-color: #00c6fb;
    border-color: #00c6fb;
  }

  input[type="checkbox"]:checked::before {
    transform: scale(1);
  }
  
  input[type="checkbox"]:focus-visible {
    outline: 2px solid #00c6fb;
    outline-offset: 2px;
  }

  select {
    background-color: rgba(15, 23, 42, 0.6);
    border: 1px solid #475569;
    color: #f1f5f9;
    padding: 0.5rem 2rem 0.5rem 1rem;
    border-radius: 6px;
    outline: none;
    cursor: pointer;
    font-size: 0.95rem;
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    min-width: 140px;
    transition: border-color 0.2s;
  }

  select:hover {
    border-color: #64748b;
  }

  select:focus {
    border-color: #00c6fb;
    box-shadow: 0 0 0 1px #00c6fb;
  }

  .btn-reset {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    transition: all 0.2s;
    width: 100%;
  }

  .btn-reset:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .btn-reset:active {
    transform: translateY(1px);
  }

  .guide-link {
    font-size: 0.75rem;
    color: #64748b;
    text-decoration: none;
    border-bottom: 1px dotted #64748b;
    transition: all 0.2s;
    margin-left: 0.2rem;
  }
  
  .guide-link:hover {
    color: #00c6fb;
    border-color: #00c6fb;
  }

  .comparison-hint {
    font-size: 0.75rem;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.03);
    padding: 0.5rem 0.8rem;
    border-radius: 6px;
    margin-bottom: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem;
    line-height: 1.3;
  }

  .hint-item strong {
    color: #cbd5e1;
    font-weight: 600;
  }

  .hint-divider {
    color: rgba(255, 255, 255, 0.1);
  }
</style>

<div class="settings-panel">
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div 
    class="header" 
    role="button" 
    tabindex="0" 
    aria-expanded={isOpen}
    on:click={toggleOpen}
    on:keydown={handleKeydown}
  >
    <span class="title">
      <RefreshCw size={18} class={isOpen ? 'spin-icon' : ''} style="display:none" />
      Advanced Settings
    </span>
    {#if isOpen}
      <ChevronUp size={20} color="#94a3b8" />
    {:else}
      <ChevronDown size={20} color="#94a3b8" />
    {/if}
  </div>

  {#if isOpen}
    <div class="content" transition:slide>
      <!-- Geometry Settings -->
      <div class="section">
        <h3>Geometry</h3>
        
        <div class="comparison-hint">
          <span class="hint-item"><strong>Draco</strong>: 體積最小 (適合頻寬受限)</span>
          <span class="hint-divider">|</span>
          <span class="hint-item"><strong>Meshopt</strong>: 載入最快 (適合即時解碼)</span>
        </div>

        <div class="control">
          <div class="label-group">
            <label for="draco">Draco Compression</label>
            <div class="tooltip-icon">
              <Info size={14} />
              <div class="tooltip-content">
                <span class="tip-title">{tips.draco.title}</span>
                <span class="tip-label">好處 Benefit</span>
                <span class="tip-row">{tips.draco.pros}</span>
                <span class="tip-label">影響 Impact</span>
                <span class="tip-row">{tips.draco.cons}</span>
              </div>
            </div>
          </div>
          <input id="draco" type="checkbox" bind:checked={$settings.draco} on:change={toggleDraco} />
        </div>

        <div class="control">
           <div class="label-group">
            <label for="meshopt">Meshopt</label>
            <div class="tooltip-icon">
              <Info size={14} />
              <div class="tooltip-content">
                <span class="tip-title">{tips.meshopt.title}</span>
                <span class="tip-label">好處 Benefit</span>
                <span class="tip-row">{tips.meshopt.pros}</span>
                <span class="tip-label">影響 Impact</span>
                <span class="tip-row">{tips.meshopt.cons}</span>
              </div>
            </div>
          </div>
          <input id="meshopt" type="checkbox" bind:checked={$settings.meshopt} on:change={toggleMeshopt} />
        </div>

        <div class="control">
          <div class="label-group">
            <label for="quantize">Quantization</label>
            <div class="tooltip-icon">
              <Info size={14} />
              <div class="tooltip-content">
                <span class="tip-title">{tips.quantize.title}</span>
                <span class="tip-label">好處 Benefit</span>
                <span class="tip-row">{tips.quantize.pros}</span>
                <span class="tip-label">影響 Impact</span>
                <span class="tip-row">{tips.quantize.cons}</span>
              </div>
            </div>
          </div>
          <input id="quantize" type="checkbox" bind:checked={$settings.quantize} />
        </div>
      </div>

      <!-- Texture Settings -->
      <div class="section">
        <h3>Textures</h3>
        <div class="control">
          <div class="label-group">
            <label for="max-size">Max Size</label>
            <div class="tooltip-icon">
              <Info size={14} />
               <div class="tooltip-content">
                <span class="tip-title">{tips.maxSize.title}</span>
                <span class="tip-label">好處 Benefit</span>
                <span class="tip-row">{tips.maxSize.pros}</span>
                <span class="tip-label">影響 Impact</span>
                <span class="tip-row">{tips.maxSize.cons}</span>
              </div>
            </div>
          </div>
          <select id="max-size" bind:value={$settings.maxTextureSize}>
            <option value={4096}>4096 (4K)</option>
            <option value={2048}>2048 (2K)</option>
            <option value={1024}>1024 (1K)</option>
            <option value={512}>512</option>
          </select>
        </div>
        
        <div class="control">
          <div class="label-group">
            <label for="format">Format</label>
             <div class="tooltip-icon">
              <Info size={14} />
               <div class="tooltip-content">
                <span class="tip-title">{tips.format.title}</span>
                <span class="tip-label">好處 Benefit</span>
                <span class="tip-row">{tips.format.pros}</span>
                <span class="tip-label">影響 Impact</span>
                <span class="tip-row">{tips.format.cons}</span>
              </div>
            </div>
          </div>
          <select id="format" bind:value={$settings.textureFormat}>
            <option value="original">Original</option>
            <option value="webp">WebP</option>
          </select>
        </div>
      </div>

      <!-- Cleanup Settings -->
      <div class="section">
        <h3>Cleanup</h3>
        <div class="control">
          <div class="label-group">
            <label for="prune">Prune Unused</label>
            <div class="tooltip-icon">
              <Info size={14} />
              <div class="tooltip-content">
                <span class="tip-title">{tips.prune.title}</span>
                <span class="tip-label">好處 Benefit</span>
                <span class="tip-row">{tips.prune.pros}</span>
                <span class="tip-label">影響 Impact</span>
                <span class="tip-row">{tips.prune.cons}</span>
              </div>
            </div>
          </div>
          <input id="prune" type="checkbox" bind:checked={$settings.prune} />
        </div>

        <div class="control">
          <div class="label-group">
            <label for="dedup">Deduplicate</label>
             <div class="tooltip-icon">
              <Info size={14} />
              <div class="tooltip-content">
                <span class="tip-title">{tips.dedup.title}</span>
                <span class="tip-label">好處 Benefit</span>
                <span class="tip-row">{tips.dedup.pros}</span>
                <span class="tip-label">影響 Impact</span>
                <span class="tip-row">{tips.dedup.cons}</span>
              </div>
            </div>
          </div>
          <input id="dedup" type="checkbox" bind:checked={$settings.dedup} />
        </div>

        <div class="control">
          <div class="label-group">
            <label for="join">Join Meshes</label>
             <div class="tooltip-icon">
              <Info size={14} />
              <div class="tooltip-content">
                <span class="tip-title">{tips.join.title}</span>
                <span class="tip-label">好處 Benefit</span>
                <span class="tip-row">{tips.join.pros}</span>
                <span class="tip-label">影響 Impact</span>
                <span class="tip-row">{tips.join.cons}</span>
              </div>
            </div>
          </div>
          <input id="join" type="checkbox" bind:checked={$settings.join} />
        </div>

        <div class="control">
           <div class="label-group">
            <label for="instance">Instance</label>
             <div class="tooltip-icon" style="color: #fbbf24;"> <!-- Warning color for instance -->
              <Info size={14} />
              <div class="tooltip-content">
                <span class="tip-title">{tips.instance.title}</span>
                <span class="tip-label">好處 Benefit</span>
                <span class="tip-row">{tips.instance.pros}</span>
                <span class="tip-label">影響 Impact</span>
                <span class="tip-row" style="color: #fbbf24;">{tips.instance.cons}</span>
              </div>
            </div>
            <a href="/instancing-guide" class="guide-link">(製作規範?)</a>
          </div>
          <input id="instance" type="checkbox" bind:checked={$settings.instance} />
        </div>
      </div>

      <div class="section" style="justify-content: flex-end;">
         <button class="btn-reset" on:click={resetSettings}>
           <RefreshCw size={16} /> Reset Defaults
         </button>
      </div>
    </div>
  {/if}
</div>
