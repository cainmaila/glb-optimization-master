<script>
  import { ArrowLeft } from 'lucide-svelte';
</script>

<style>
  .guide-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 3rem 1.5rem;
    color: #e2e8f0;
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, #fff 0%, #00c6fb 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  h2 {
    font-size: 1.5rem;
    color: #00c6fb;
    margin-top: 2.5rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.5rem;
  }

  h3 {
    font-size: 1.2rem;
    color: #f1f5f9;
    margin-top: 1.5rem;
    margin-bottom: 0.8rem;
  }

  p {
    margin-bottom: 1rem;
    color: #cbd5e1;
  }

  ul {
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
  }

  li {
    margin-bottom: 0.5rem;
  }

  strong {
    color: #fff;
    font-weight: 600;
  }

  .card {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1.5rem 0;
  }

  .good {
    border-left: 4px solid #10b981;
    background: rgba(16, 185, 129, 0.1);
  }

  .bad {
    border-left: 4px solid #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    text-decoration: none;
    font-size: 0.9rem;
    margin-bottom: 2rem;
    transition: color 0.2s;
  }

  .back-link:hover {
    color: #fff;
  }

  code {
    background: rgba(0, 0, 0, 0.3);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
    color: #e2e8f0;
    font-size: 0.9em;
  }
</style>

<div class="guide-container">
  <a href="/" class="back-link">
    <ArrowLeft size={16} /> 返回優化器 Back to Optimizer
  </a>

  <h1>3D 模型製作規範：Instancing 優化指南</h1>
  
  <p>為了讓 Web 3D 專案能達到最佳效能，我們利用 <strong>GPU Instancing</strong> 技術來一次性繪製大量重複的物件。請在製作與輸出模型時，遵守以下規範。</p>

  <div class="card">
    <h3>📌 核心概念 (The Golden Rule)</h3>
    <p><strong>「長得一樣的物體，必須使用同一份 Mesh (網格) 數據。」</strong></p>
    <p>Instancing 的原理是：只載入一次模型幾何資料，然後告訴 GPU 它出現在世界的哪些位置、旋轉角度與縮放大小。</p>
  </div>

  <h2>1. 正確的複製方式</h2>
  <div class="card good">
    <h3>✅ 正確做法 (Do This)</h3>
    <ul>
      <li>使用軟體的<strong>「實例複製」(Instance / Linked Duplicate)</strong> 功能。</li>
      <li><strong>Blender</strong>: 使用 <code>Alt + D</code> (Linked Duplicate)。</li>
      <li><strong>3ds Max</strong>: 複製時選擇 "Instance"。</li>
      <li><strong>Maya</strong>: 使用 "Instance"。</li>
    </ul>
    <p>檢查方式：若改變其中一個物件的形狀，其他副本應該要<strong>也會跟著改變</strong>。</p>
  </div>

  <div class="card bad">
    <h3>❌ 錯誤做法 (Don't Do This)</h3>
    <ul>
      <li>單純的複製貼上 (Copy / <code>Shift + D</code>)，這會產生多個獨立的 Mesh。</li>
      <li>將多個重複物件 <code>Join</code> (合併) 成一個大物件。這會破壞 Instancing 的機制。</li>
    </ul>
  </div>

  <h2>2. 變換 (Transforms) 的禁忌</h2>
  <p>這是最常導致模型在瀏覽器中<strong>錯位</strong>的原因。</p>
  
  <div class="card bad">
    <h3>⚠️ 絕對不要 Apply Transforms</h3>
    <p>千萬不要對已經實例化的物件執行「套用變換」(Apply Scale / Rotation / Location)！</p>
    <ul>
      <li>在 Blender 中按下 <code>Ctrl + A</code> 會將位置資訊「烘焙」進網格數據裡。</li>
      <li><strong>後果：</strong> 雖然兩個物件看起來一樣，但它們的頂點座標變得不同了，系統將無法視為同一個物件。</li>
    </ul>
  </div>

  <p><strong>正確流程：</strong> 讓 Mesh 數據保持原始狀態（例如位於原點 (0,0,0)），所有的位置移動與旋轉，請保留在 Object (Node) 層級上。</p>

  <h2>3. 材質一致性</h2>
  <p>所有實例物件必須共用同一個<strong>材質球 (Material)</strong>。如果兩個一樣的螺絲用了不同的材質，它們就無法被合併批次繪製。</p>

  <h2>4. 自我檢核 (Self-Check)</h2>
  <p>在輸出 GLB 之前，請在軟體的大綱視圖 (Outliner) 中檢查：</p>
  <p>是不是有<strong>多個物件 (Objects)</strong> 指向<strong>同一個網格數據 (Mesh Data)</strong>？</p>
  <ul>
    <li>✅ (Blender) Object A 和 Object B 的 Mesh 欄位都是 <code>Screw_Mesh</code>。</li>
    <li>❌ (Blender) Object A 是 <code>Screw_Mesh</code>，但 Object B 是 <code>Screw_Mesh.001</code>。</li>
  </ul>

</div>
