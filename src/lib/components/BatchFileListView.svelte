<script lang="ts">
	import { CircleCheck, CircleX, LoaderCircle, File as FileIcon, Download } from 'lucide-svelte'
	import { slide } from 'svelte/transition'

	interface BatchFile {
		id: string
		file: File
		status: 'pending' | 'processing' | 'done' | 'error'
		originalSize: number
		optimizedSize?: number
		error?: string
		blob?: Blob
	}

	interface Props {
		files: BatchFile[]
		onDownloadOne: (file: BatchFile) => void
	}

	let { files, onDownloadOne }: Props = $props()

	function formatBytes(bytes: number, decimals = 2) {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const dm = decimals < 0 ? 0 : decimals
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
	}

	function getReduction(original: number, optimized?: number) {
		if (!optimized) return '-'
		const reduction = ((original - optimized) / original) * 100
		return reduction.toFixed(1) + '%'
	}

	// Calculate total progress
	let processedCount = $derived(
		files.filter((f) => f.status === 'done' || f.status === 'error').length
	)
	let totalCount = $derived(files.length)
	let progressPercent = $derived(totalCount > 0 ? (processedCount / totalCount) * 100 : 0)
</script>

<div class="batch-list-container">
	<div class="batch-header">
		<h3>Batch Processing ({processedCount}/{totalCount})</h3>
		<div class="progress-bar">
			<div class="progress-fill" style="width: {progressPercent}%"></div>
		</div>
	</div>

	<div class="file-list">
		{#each files as item (item.id)}
			<div class="file-item" transition:slide|local>
				<div class="file-icon">
					<FileIcon size={20} />
				</div>

				<div class="file-info">
					<div class="file-name" title={item.file.name}>{item.file.name}</div>
					<div class="file-meta">
						{formatBytes(item.originalSize)}
						{#if item.optimizedSize}
							→ <span class="optimized-size">{formatBytes(item.optimizedSize)}</span>
							<span class="reduction-badge"
								>-{getReduction(item.originalSize, item.optimizedSize)}</span
							>
						{/if}
					</div>
				</div>

				<div class="file-status">
					{#if item.status === 'pending'}
						<span class="status-badge pending">Pending</span>
					{:else if item.status === 'processing'}
						<LoaderCircle class="spin-icon" size={20} color="#00c6fb" />
					{:else if item.status === 'done'}
						<button
							class="action-btn download"
							onclick={() => onDownloadOne(item)}
							title="Download this file"
						>
							<Download size={18} />
						</button>
						<CircleCheck size={20} color="#4ade80" />
					{:else if item.status === 'error'}
						<div class="error-info" title={item.error}>
							<CircleX size={20} color="#f87171" />
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.batch-list-container {
		background: rgba(255, 255, 255, 0.02);
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		max-height: 600px;
	}

	.batch-header {
		padding: 1rem 1.5rem;
		background: rgba(255, 255, 255, 0.05);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 500;
		color: #e2e8f0;
	}

	.progress-bar {
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #00c6fb 0%, #005bea 100%);
		transition: width 0.3s ease;
	}

	.file-list {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.file-item {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 8px;
		margin-bottom: 0.5rem;
		gap: 1rem;
		transition: background 0.2s;
	}

	.file-item:last-child {
		margin-bottom: 0;
	}

	.file-item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.file-icon {
		color: #94a3b8;
	}

	.file-info {
		flex: 1;
		min-width: 0; /* for truncation */
	}

	.file-name {
		font-size: 0.95rem;
		color: #f1f5f9;
		margin-bottom: 0.2rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.file-meta {
		font-size: 0.8rem;
		color: #94a3b8;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.optimized-size {
		color: #4ade80;
	}

	.reduction-badge {
		background: rgba(74, 222, 128, 0.1);
		color: #4ade80;
		padding: 0.1rem 0.3rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.file-status {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.2rem 0.5rem;
		border-radius: full;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	.status-badge.pending {
		background: rgba(255, 255, 255, 0.1);
		color: #94a3b8;
	}

	:global(.spin-icon) {
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

	.action-btn {
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}

	.action-btn.download:hover {
		color: #4ade80;
		background: rgba(74, 222, 128, 0.1);
	}
</style>
