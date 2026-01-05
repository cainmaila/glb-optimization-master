# GLB Model Optimizer (GLB 模型優化大師)

**打造極致效能的 Web 3D 體驗：專業級 GLB 模型優化工具**

是一個專為 Web 3D 開發者設計的視覺化 GLB 模型優化平台。它整合了強大的 `gltf-transform` 技術與 `Three.js` 預覽引擎，讓使用者能夠輕鬆上傳、檢視、診斷並優化 GLB 模型，最終輸出最適合網頁呈現的高效能 3D 資產。

---

## 🌟 核心理念 (Core Philosophy)

本軟體的目標是解決 Web 3D 開發中最常見的痛點：**模型檔案過大**、**載入速度慢**、**VRAM 佔用過高**。

我們提供一個直觀的 web 介面，將複雜的 3D 優化流程自動化與視覺化，讓非 3D 專業的美術或前端工程師也能輕鬆產出標準化、高效能的 GLB 檔案。

## 🚀 主要功能 (Key Features)

### 1. 互動式模型檢視 (Interactive Preview)

- **基於 Three.js 的即時預覽**：上傳後立即顯示模型，支援旋轉、縮放、平移。
- **視覺化診斷**：查看線框 (Wireframe)、法線 (Normals)、材質 (Materials) 等資訊。
- **原始數據分析**：即時顯示頂點數 (Vertices)、面數 (Draw calls)、紋理大小 (Texture sizes) 與檔案總大小。

### 2. 深度優化引擎 (Optimization Engine)

核心採用 [glTF-Transform](https://github.com/donmccurdy/glTF-Transform) 技術，提供多層次的優化方案：

#### 📐 幾何優化 (Geometry)

- **Draco 壓縮**：使用 Google Draco 算法大幅壓縮幾何數據，減少檔案體積。
- **Meshopt 壓縮**：支援 EXT_meshopt_compression，提供更高效的解碼速度。
- **網格簡化 (Simplification)**：智慧減少面數，同時保持外觀細節。
- **焊接 (Welding)**：自動合併重複的頂點，修復模型裂縫。

#### 🎨 紋理與材質優化 (Texture & Materials)

- **紋理轉碼 (Transcoding)**：自動將 PNG/JPEG 紋理轉換為 **WebP** 或 **KTX2** (GPU 壓縮紋理)，大幅降低 VRAM 佔用與提升渲染效能。
- **尺寸重樣 (Resizing)**：限制紋理最大解析度 (例如 2048x2048 -> 1024x1024)，避免不必要的資源浪費。
- **通道合併**：自動優化 ORM 貼圖 (Occlusion, Roughness, Metalness) 處理。

#### 🧹 結構清理 (Scene Cleanup)

- **去重 (Deduplication)**：移除重複的 Accessors、Meshes 和 Textures。
- **實例化 (Instancing)**：自動檢測相同模型並轉換為 GPU Instancing，減少 Draw calls。
- **節點修剪 (Pruning)**：移除場景中未使用的節點、材質或動畫數據。

### 3. 優化前後對比 (Before/After Comparison)

- **雙視窗對比**：並排顯示優化前與優化後的模型效果。
- **關鍵指標報告**：
  - 檔案大小縮減率 (例如：`10MB -> 2MB (-80%)`)
  - VRAM 預估佔用變化
  - Draw Calls 變化

### 4. 輸出與發布 (Export & Publish)

- **一鍵下載**：輸出標準 GLB 檔案。
- **Web Ready**：輸出的檔案完全符合 Web 標準，可直接用於 Three.js, Babylon.js, PlayCanvas 或 React-three-fiber。

---

## 🛠 技術架構 (Tech Stack)

本專案採用現代化的 Web 技術棧構建：

- **Frontend Framework**: [SvelteKit](https://kit.svelte.dev/) (高效能、輕量級的前端框架)
- **3D Engine**: [Three.js](https://threejs.org/) (用於模型渲染與預覽)
- **Optimization Core**: [glTF-Transform](https://gltf-transform.dev/) (底層優化邏輯，運行於 Node.js 後端)
- **Image Processing**: [sharp](https://sharp.pixelplumbing.com/) (高效能圖片處理與轉檔)
- **Compression**: [Draco](https://google.github.io/draco/), [Meshoptimizer](https://github.com/zeux/meshoptimizer)
- **Style**: Standard CSS (Dark Mode Design)
- **Package Manager**: pnpm

## 📦 使用說明與參數詳解 (Usage & Settings)

### 1. 上傳與預覽

直接拖曳 `.glb` 檔案至視窗，或點擊上傳按鈕。系統會立即在瀏覽器中渲染模型。

### 2. 進階設定 (Advanced Settings)

在下載按鈕上方，點擊 **"Advanced Settings"** 展開設定面板，共有三大類別可供調整：

#### 📐 Geometry (幾何優化)

針對模型的網格數據進行壓縮。

- **Draco Compression** (預設: 開啟)
  - **功能**：使用 Google Draco 算法進行極致壓縮。
  - **優點**：檔案體積最小（通常可減少 50-80%）。
  - **缺點**：前端載入時需要引入 `DracoLoader` 解碼器，且載入時需消耗少量 CPU。
  - _注意：與 Meshopt 互斥。_

- **Meshopt Compression**
  - **功能**：使用 Meshoptimizer 算法壓縮。
  - **優點**：提供極致的**解碼速度**（GPU 友善），適合即時載入大量模型的場景。
  - **缺點**：壓縮率略遜於 Draco。
  - _注意：與 Draco 互斥。_

- **Quantization** (預設: 開啟)
  - **功能**：將頂點座標從 32-bit 浮點數降為整數。
  - **優點**：無痛減少記憶體佔用，肉眼幾無差異。

- **Join Meshes** (預設: 開啟)
  - **功能**：將多個物件合併為單一網格。
  - **優點**：大幅減少 Draw Calls，提升渲染效能。
  - **缺點**：會破壞原始物件的層級結構。若您的模型含有需要獨立移動/動畫的零件，**請關閉此選項**。

#### 🎨 Textures (紋理優化)

針對模型的貼圖進行縮放與轉檔。

- **Max Size** (預設: 4096)
  - **功能**：限制貼圖的最大解析度 (512px ~ 4096px)。若原圖超過此大小，將自動縮小；若小於此大小則維持原狀。

- **Format** (預設: Original)
  - **Original**: 保持原始格式 (通常是 JPEG/PNG)。若有縮放，則會優化為 JPEG。
  - **WebP**: 將貼圖轉檔為 WebP 格式。可減少約 30% 體積並支援透明度，現代瀏覽器皆支援。

#### 🧹 Cleanup (清理設定)

- **Prune Unused**: 自動移除場景中未被引用的材質或網格。
- **Deduplicate**: 合併重複的資料存取器 (Accessors)。
- **Instance**: (預設: 關閉 ⚠️)
  - **功能**：將重複的網格轉換為 GPU Instancing。
  - **風險**：僅適用於製作時已使用 Instancing 製作的模型。若強行開啟，可能導致一般模型發生錯位。詳情請參考 [Instancing 製作規範](/instancing-guide)。

### 3. 下載

確認設定無誤後，點擊 **"Optimize & Download"**，系統將在後端處理完成後自動觸發下載。

---

## 🔮 未來展望 (Roadmap)

- [ ] 支援 KTX2 紋理壓縮 (GPU VRAM 優化) - _需安裝 toktx_
- [ ] 支援批次處理 (Batch Processing)
- [ ] 整合 AI 自動減面算法
- [ ] 雲端儲存與分享連結生成

---

_Created by Gemini based on User Requirements._
