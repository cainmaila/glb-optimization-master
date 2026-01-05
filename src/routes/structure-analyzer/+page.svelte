<script lang="ts">
  import { ArrowLeft } from 'lucide-svelte';
</script>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 3rem 2rem;
    color: #e2e8f0;
    font-family: 'Inter', system-ui, sans-serif;
    line-height: 1.6;
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

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #fff 0%, #f093fb 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 3rem;
  }

  .card {
    background: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 2rem;
    margin: 2rem 0;
  }

  h2 {
    font-size: 1.5rem;
    color: #00c6fb;
    margin-bottom: 1rem;
  }

  ul {
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
  }

  li {
    margin-bottom: 0.75rem;
    color: #cbd5e1;
  }

  p {
    color: #cbd5e1;
    margin-bottom: 1rem;
  }
</style>

<div class="container">
  <a href="/" class="back-link">
    <ArrowLeft size={16} /> Back to Home
  </a>

  <h1>結構解析大師</h1>
  <p class="subtitle">Structure Analyzer - Coming Soon</p>

  <div class="card">
    <h2>即將推出的功能</h2>
    <p>結構解析大師將為您的 GLB 檔案提供深度洞察：</p>
    <ul>
      <li>詳細的網格和幾何分析</li>
      <li>材質和紋理檢查</li>
      <li>節點層級可視化</li>
      <li>性能優化建議</li>
      <li>資產優化方案</li>
    </ul>
  </div>

  <div class="card">
    <h2>敬請期待</h2>
    <p>此功能正在積極開發中。請持續關注更新！</p>
  </div>
</div>
