<script lang="ts">
  export let original: any; // InspectReport
  export let optimized: any; // InspectReport

  function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function getChange(orig: number, opt: number) {
    const diff = opt - orig;
    const pct = orig === 0 ? 0 : (diff / orig) * 100;
    const sign = diff > 0 ? '+' : '';
    return {
      diff,
      pct: `${sign}${pct.toFixed(1)}%`,
      improved: diff < 0
    };
  }
  
  // Helper to safely access nested properties
  $: oInfo = original?.info || {};
  $: nInfo = optimized?.info || {};

  $: sizeChange = getChange(oInfo.totalSizeBytes || 0, nInfo.totalSizeBytes || 0);
  $: meshChange = getChange(oInfo.meshCount || 0, nInfo.meshCount || 0);
  $: drawCallChange = getChange(oInfo.drawCalls || 0, nInfo.drawCalls || 0);
</script>

<div class="report-container">
  <h3>Optimization Report</h3>
  
  <div class="stat-grid">
    <!-- File Size -->
    <div class="stat-card">
      <div class="stat-label">File Size</div>
      <div class="stat-value-group">
        <span class="old">{formatBytes(oInfo.totalSizeBytes || 0)}</span>
        <span class="arrow">→</span>
        <span class="new">{formatBytes(nInfo.totalSizeBytes || 0)}</span>
      </div>
      <div class="stat-badge" class:green={sizeChange.improved} class:red={!sizeChange.improved && sizeChange.diff > 0}>
        {sizeChange.pct}
      </div>
    </div>

    <!-- Draw Calls -->
    <div class="stat-card">
      <div class="stat-label">Draw Calls</div>
      <div class="stat-value-group">
        <span class="old">{oInfo.drawCalls || 0}</span>
        <span class="arrow">→</span>
        <span class="new">{nInfo.drawCalls || 0}</span>
      </div>
       <div class="stat-badge" class:green={drawCallChange.improved}>
        {drawCallChange.pct}
      </div>
    </div>
    
     <!-- Meshes -->
    <div class="stat-row">
      <span>Meshes</span>
      <div class="row-vals">
        <span class="old">{oInfo.meshCount || 0}</span>
        <span>→</span>
        <span class="new">{nInfo.meshCount || 0}</span>
      </div>
    </div>

    <!-- Textures -->
    <div class="stat-row">
      <span>Textures</span>
      <div class="row-vals">
        <span class="old">{oInfo.textureCount || 0}</span>
        <span>→</span>
        <span class="new">{nInfo.textureCount || 0}</span>
      </div>
    </div>
    
    <!-- Materials -->
     <div class="stat-row">
      <span>Materials</span>
      <div class="row-vals">
        <span class="old">{oInfo.materialCount || 0}</span>
        <span>→</span>
        <span class="new">{nInfo.materialCount || 0}</span>
      </div>
    </div>

  </div>
</div>

<style>
  .report-container {
    background: rgba(30, 41, 59, 1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    color: #f8fafc;
    margin-bottom: 1.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: #00c6fb;
  }

  .stat-grid {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #94a3b8;
    font-weight: 500;
  }

  .stat-value-group {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-family: monospace;
    font-size: 1rem;
  }

  .old { color: #64748b; text-decoration: line-through; font-size: 0.9em; }
  .arrow { color: #94a3b8; }
  .new { color: #f8fafc; font-weight: 700; }

  .stat-badge {
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    font-weight: 600;
    min-width: 60px;
    text-align: center;
  }

  .stat-badge.green { background: rgba(16, 185, 129, 0.2); color: #34d399; }
  .stat-badge.red { background: rgba(244, 63, 94, 0.2); color: #fb7185; }

  .stat-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .stat-row:last-child {
    border-bottom: none;
  }

  .row-vals {
    display: flex;
    gap: 0.8rem;
    font-family: monospace;
    color: #cbd5e1;
  }
</style>
