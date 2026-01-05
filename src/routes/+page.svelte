<script lang="ts">
  import FeatureCard from '$lib/components/FeatureCard.svelte';

  const features = [
    {
      title: 'GLB 優化大師',
      description: '使用先進的 glTF 變換壓縮和優化 3D 模型。支援 Draco、Meshopt、紋理壓縮等技術，最高可減少 80% 檔案體積。',
      href: '/glb-optimizer',
      icon: '🎨',
      status: 'ready' as const,
      iconBgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      title: '結構解析大師',
      description: '深入分析 GLB 檔案結構。互動式 3D 檢視器與樹狀結構瀏覽，支援節點選取與相機動畫。',
      href: '/structure-analyzer',
      icon: '🔍',
      status: 'ready' as const,
      iconBgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    }
  ];
</script>

<style>
  .index-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 2rem;
    min-height: 100vh;
  }

  .hero {
    text-align: center;
    margin-bottom: 4rem;
  }

  h1 {
    font-size: 3rem;
    font-weight: 200;
    letter-spacing: 0.05em;
    margin: 0 0 1rem 0;
    background: linear-gradient(135deg, #fff 0%, #aaa 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 300;
    margin: 0;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .index-container {
      padding: 2rem 1rem;
    }
  }
</style>

<div class="index-container">
  <header class="hero">
    <h1>GLB Optimization Platform</h1>
    <p class="subtitle">Professional tools for 3D web optimization</p>
  </header>

  <div class="features-grid">
    {#each features as feature}
      <FeatureCard {...feature} />
    {/each}
  </div>
</div>
