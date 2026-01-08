<script lang="ts">
	import { Eye, Compass, Download, X } from 'lucide-svelte'
	import { structureStore } from '../stores/structureStore.svelte'

	const extractionData = $derived(structureStore.extractionData)
</script>

<div class="extraction-menu-overlay">
	<div class="extraction-menu">
		<div class="menu-header">
			<h3>摘取選項</h3>
			<button class="close-btn" onclick={() => structureStore.cancelExtraction()}>
				<X size={20} />
			</button>
		</div>

		{#if extractionData}
			<div class="node-info">
				<span class="label">選取物件：</span>
				<span class="value">{extractionData.metadata.name}</span>
			</div>

			<div class="menu-actions">
				<button
					class="action-btn preview-btn"
					onclick={() => structureStore.enterPreviewLocation()}
				>
					<Eye size={20} />
					<span>預覽位置</span>
					<small>確認物件在場景中的位置</small>
				</button>

				<button
					class="action-btn adjust-btn"
					onclick={() => structureStore.enterAdjustOrientation()}
				>
					<Compass size={20} />
					<span>變動方向</span>
					<small>調整物件的朝向（每次旋轉 90°）</small>
				</button>

				<button class="action-btn download-btn" onclick={() => structureStore.finalizeExtraction()}>
					<Download size={20} />
					<span>下載</span>
					<small>打包 GLB 與 metadata.json</small>
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.extraction-menu-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.extraction-menu {
		background: rgba(20, 20, 35, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 16px;
		padding: 1.5rem;
		min-width: 400px;
		max-width: 480px;
	}

	.menu-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	h3 {
		margin: 0;
		color: #fff;
		font-size: 1.25rem;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-btn:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.1);
	}

	.node-info {
		background: rgba(255, 255, 255, 0.05);
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.label {
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.85rem;
	}

	.value {
		color: #fff;
		font-weight: 500;
	}

	.menu-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		padding: 1rem 1.25rem;
		border-radius: 12px;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.action-btn span {
		font-size: 1rem;
		font-weight: 500;
		color: #fff;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.action-btn small {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.5);
		margin-left: 1.75rem;
	}

	.preview-btn {
		background: rgba(100, 149, 237, 0.15);
		border-color: rgba(100, 149, 237, 0.3);
	}

	.preview-btn:hover {
		background: rgba(100, 149, 237, 0.25);
		border-color: rgba(100, 149, 237, 0.5);
	}

	.adjust-btn {
		background: rgba(255, 165, 0, 0.15);
		border-color: rgba(255, 165, 0, 0.3);
	}

	.adjust-btn:hover {
		background: rgba(255, 165, 0, 0.25);
		border-color: rgba(255, 165, 0, 0.5);
	}

	.download-btn {
		background: rgba(50, 205, 50, 0.15);
		border-color: rgba(50, 205, 50, 0.3);
	}

	.download-btn:hover {
		background: rgba(50, 205, 50, 0.25);
		border-color: rgba(50, 205, 50, 0.5);
	}
</style>
