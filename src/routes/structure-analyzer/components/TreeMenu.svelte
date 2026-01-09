<script lang="ts">
	import { Download, FileBox, Upload, Save } from 'lucide-svelte'
	import TreeNode from './TreeNode.svelte'
	import { structureStore } from '../stores/structureStore.svelte'

	const treeData = $derived(structureStore.treeData)
	const hasModel = $derived(!!structureStore.model)
	const checkedCount = $derived(structureStore.checkedNodeIds.size)
	const isBatchSelection = $derived(structureStore.isBatchSelection)

	function handleSelect(id: string) {
		// 如果點擊已選取的節點，則取消選取
		if (structureStore.selectedNodeId === id) {
			structureStore.clearSelection()
		} else {
			structureStore.selectNode(id)
		}
	}

	function handleExport() {
		structureStore.exportTree()
	}

	function handleImport(e: Event) {
		const input = e.target as HTMLInputElement
		if (input.files && input.files[0]) {
			structureStore.importStructure(input.files[0])
			// 清空 input 讓相同檔案可以再次觸發
			input.value = ''
		}
	}

	function handleExtraction() {
		if (isBatchSelection) {
			structureStore.startBatchExtraction()
		} else {
			structureStore.startExtraction() // 單選流程
		}
	}
</script>

<aside class="tree-menu">
	<div class="header">
		<input
			type="file"
			id="structure-import-input"
			accept=".json"
			style="display: none"
			onchange={handleImport}
		/>
		<h3>模型結構</h3>

		<div class="action-buttons">
			<!-- 匯入按鈕 -->
			<button
				class="import-btn"
				onclick={() => document.getElementById('structure-import-input')?.click()}
				title="匯入結構 JSON"
				disabled={!hasModel}
			>
				<Upload size={16} />
				<span>匯入</span>
			</button>

			<!-- 匯出按鈕 -->
			<button
				class="export-btn"
				onclick={handleExport}
				title="匯出完整結構"
				disabled={treeData.length === 0}
			>
				<Download size={16} />
				<span>結構</span>
			</button>

			<!-- GLB 下載按鈕 -->
			<button
				class="save-btn"
				onclick={() => structureStore.downloadModel()}
				title="下載修改後的 GLB 模型"
				disabled={!hasModel}
			>
				<Save size={16} />
				<span>模型</span>
			</button>

			<!-- 摘取按鈕 -->
			<button
				class="extract-btn"
				onclick={handleExtraction}
				title={isBatchSelection ? `批量摘取 ${checkedCount} 個節點` : '摘取並烘焙選取節點'}
				disabled={isBatchSelection ? checkedCount < 2 : !structureStore.selectedNodeId}
			>
				<FileBox size={16} />
				<span>{isBatchSelection ? `摘取 (${checkedCount})` : '摘取'}</span>
			</button>

			<!-- 清除選取按鈕 -->
			{#if structureStore.selectedNodeId}
				<button class="clear-btn" onclick={() => structureStore.clearSelection()}>
					清除選取
				</button>
			{/if}

			<!-- 清除勾選按鈕 -->
			{#if checkedCount > 0}
				<button class="clear-btn" onclick={() => structureStore.clearChecked()}> 清除勾選 </button>
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

<style lang="postcss">
	.tree-menu {
		position: fixed;
		top: 1rem;
		left: 1rem;
		min-width: 280px;
		max-width: min(90vw, 500px);
		width: fit-content;
		max-height: calc(100vh - 2rem);
		background: rgba(10, 10, 20, 0.95);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		z-index: 100;
	}

	.header {
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		flex-shrink: 0;
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
		flex-wrap: wrap;
	}

	/* Base button styles */
	.import-btn,
	.export-btn,
	.extract-btn,
	.save-btn,
	.clear-btn {
		padding: 0.4rem 0.8rem;
		font-size: 0.85rem;
		border-radius: 4px;
		color: rgba(255, 255, 255, 0.9);
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		white-space: nowrap;
	}

	.import-btn:disabled,
	.export-btn:disabled,
	.extract-btn:disabled,
	.save-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Color variants */
	.import-btn,
	.export-btn {
		background: rgba(102, 126, 234, 0.2);
		border: 1px solid rgba(102, 126, 234, 0.4);
	}

	.import-btn:hover:not(:disabled),
	.export-btn:hover:not(:disabled) {
		background: rgba(102, 126, 234, 0.3);
		border-color: rgba(102, 126, 234, 0.6);
	}

	.extract-btn {
		background: rgba(234, 187, 102, 0.2);
		border: 1px solid rgba(234, 187, 102, 0.4);
	}

	.extract-btn:hover:not(:disabled) {
		background: rgba(234, 187, 102, 0.3);
		border-color: rgba(234, 187, 102, 0.6);
	}

	.save-btn {
		background: rgba(16, 185, 129, 0.2);
		border: 1px solid rgba(16, 185, 129, 0.4);
	}

	.save-btn:hover:not(:disabled) {
		background: rgba(16, 185, 129, 0.3);
		border-color: rgba(16, 185, 129, 0.6);
	}

	.clear-btn {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.clear-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	.tree-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: auto;
		padding: 0.5rem;
		min-height: 0;
	}

	.tree-container::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.tree-container::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
	}

	.tree-container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 4px;
	}

	.tree-container::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 255, 255, 0.3);
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
