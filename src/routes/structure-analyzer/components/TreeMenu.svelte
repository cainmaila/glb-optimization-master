<script lang="ts">
  import { Download } from 'lucide-svelte';
  import TreeNode from './TreeNode.svelte';
  import { structureStore } from '../stores/structureStore.svelte';

  const treeData = $derived(structureStore.treeData);

  function handleSelect(id: string) {
    // 如果點擊已選取的節點，則取消選取
    if (structureStore.selectedNodeId === id) {
      structureStore.clearSelection();
    } else {
      structureStore.selectNode(id);
    }
  }

  function handleExport() {
    structureStore.exportTree();
  }
</script>

<aside class="tree-menu">
  <div class="header">
    <h3>模型結構</h3>

    <div class="action-buttons">
      <!-- 匯出按鈕 -->
      <button
        class="export-btn"
        onclick={handleExport}
        title="匯出完整結構"
        disabled={treeData.length === 0}
      >
        <Download size={16} />
        <span>匯出</span>
      </button>

      <!-- 清除選取按鈕 -->
      {#if structureStore.selectedNodeId}
        <button
          class="clear-btn"
          onclick={() => structureStore.clearSelection()}
        >
          清除選取
        </button>
      {/if}
    </div>
  </div>

  <div class="tree-container">
    {#if treeData.length > 0}
      <ul class="tree-root">
        {#each treeData as node (node.id)}
          <TreeNode {node} onSelect={handleSelect} />
        {/each}
      </ul>
    {:else}
      <div class="empty-state">
        <p>尚無模型資料</p>
      </div>
    {/if}
  </div>
</aside>

<style>
  .tree-menu {
    width: 350px;
    height: 100%;
    background: rgba(10, 10, 20, 0.9);
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .header {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .export-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    background: rgba(102, 126, 234, 0.2);
    border: 1px solid rgba(102, 126, 234, 0.4);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .export-btn:hover:not(:disabled) {
    background: rgba(102, 126, 234, 0.3);
    border-color: rgba(102, 126, 234, 0.6);
  }

  .export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .clear-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: background 0.2s;
  }

  .clear-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .tree-container {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .tree-root {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
