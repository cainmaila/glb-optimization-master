<script lang="ts">
	import { Loader2 } from 'lucide-svelte'
	import { structureStore } from '../stores/structureStore.svelte'

	const batchProgress = $derived(structureStore.batchProgress)
	const percentage = $derived(
		batchProgress ? Math.round((batchProgress.current / batchProgress.total) * 100) : 0
	)
</script>

{#if batchProgress}
	<div class="batch-overlay">
		<div class="progress-card">
			<div class="spinner">
				<Loader2 size={48} class="animate-spin" />
			</div>

			<h3>批量摘取處理中...</h3>

			<div class="progress-info">
				<span>處理進度：{batchProgress.current} / {batchProgress.total}</span>
				<span class="percentage">{percentage}%</span>
			</div>

			<div class="progress-bar">
				<div class="progress-fill" style="width: {percentage}%"></div>
			</div>

			<p class="hint">請稍候，正在生成模型檔案...</p>
		</div>
	</div>
{/if}

<style>
	.batch-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
	}

	.progress-card {
		background: rgba(20, 20, 35, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 16px;
		padding: 2rem;
		min-width: 400px;
		text-align: center;
	}

	.spinner {
		margin-bottom: 1.5rem;
		color: #667eea;
	}

	h3 {
		margin: 0 0 1rem 0;
		color: #fff;
		font-size: 1.25rem;
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.percentage {
		font-weight: 600;
		color: #667eea;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		transition: width 0.3s ease;
	}

	.hint {
		margin: 0;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.5);
	}

	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
