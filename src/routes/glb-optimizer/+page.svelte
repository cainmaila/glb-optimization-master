<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte'
	import UploadZone from '$lib/components/UploadZone.svelte'
	import Preview from '$lib/components/Preview.svelte'
	import DownloadButton from '$lib/components/DownloadButton.svelte'
	import SettingsPanel from '$lib/components/SettingsPanel.svelte'
	import BatchFileListView from '$lib/components/BatchFileListView.svelte'
	import { glbUrl, optimizedUrl, selectedFile } from '$lib/stores'
	import { settings } from '$lib/settings'
	import JSZip from 'jszip'
	import { Download, Play, RefreshCcw, ArrowLeft } from 'lucide-svelte'

	interface BatchFile {
		id: string
		file: File
		status: 'pending' | 'processing' | 'done' | 'error'
		originalSize: number
		optimizedSize?: number
		error?: string
		blob?: Blob
	}

	let isLoading = $state(false)
	let loadProgress = $state(0)
	let error = $state<string | null>(null)

	// Batch State
	let mode = $state<'single' | 'batch'>('single')
	let batchFiles = $state<BatchFile[]>([])
	let isBatchProcessing = $state(false)

	function handleUpload(files: File[]) {
		isLoading = true
		loadProgress = 0
		error = null

		try {
			if (files.length === 1) {
				mode = 'single'
				const file = files[0]
				const url = URL.createObjectURL(file)
				glbUrl.set(url)
				selectedFile.set(file)
				loadProgress = 100
			} else {
				mode = 'batch'
				batchFiles = files.map((f) => ({
					id: Math.random().toString(36).substr(2, 9),
					file: f,
					status: 'pending',
					originalSize: f.size
				}))
				glbUrl.set('') // Clear single viewer
				selectedFile.set(null)
			}
		} catch (e) {
			error = e instanceof Error ? e.message : '上傳失敗'
		} finally {
			isLoading = false
		}
	}

	async function processBatch() {
		if (isBatchProcessing) return
		isBatchProcessing = true

		// Process sequentially to avoid overwhelming server/browser
		for (let i = 0; i < batchFiles.length; i++) {
			const item = batchFiles[i]
			if (item.status === 'done') continue

			// Update status to processing
			batchFiles[i] = { ...item, status: 'processing' }

			try {
				const formData = new FormData()
				formData.append('file', item.file)
				formData.append('config', JSON.stringify($settings))

				const response = await fetch('/api/optimize', {
					method: 'POST',
					body: formData
				})

				if (!response.ok) throw new Error('Optimization failed')

				const data = await response.json()
				const { file: base64File, optimizedReport } = data

				// Decode
				const byteCharacters = atob(base64File)
				const byteNumbers = new Array(byteCharacters.length)
				for (let k = 0; k < byteCharacters.length; k++) {
					byteNumbers[k] = byteCharacters.charCodeAt(k)
				}
				const byteArray = new Uint8Array(byteNumbers)
				const blob = new Blob([byteArray], { type: 'model/gltf-binary' })

				batchFiles[i] = {
					...item,
					status: 'done',
					blob: blob,
					optimizedSize: blob.size
				}
			} catch (err) {
				console.error(err)
				batchFiles[i] = {
					...item,
					status: 'error',
					error: err instanceof Error ? err.message : 'Unknown error'
				}
			}
		}
		isBatchProcessing = false
	}

	async function downloadBatchZip() {
		const zip = new JSZip()
		let count = 0

		for (const item of batchFiles) {
			if (item.status === 'done' && item.blob) {
				const name = item.file.name
				zip.file(name, item.blob)
				count++
			}
		}

		if (count === 0) return

		const blob = await zip.generateAsync({ type: 'blob' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `optimized_models_${new Date().getTime()}.zip`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	function downloadSingleFromBatch(item: BatchFile) {
		if (!item.blob) return
		const url = URL.createObjectURL(item.blob)
		const a = document.createElement('a')
		a.href = url
		a.download = item.file.name
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	function reset() {
		mode = 'single'
		batchFiles = []
		glbUrl.set('')
		selectedFile.set(null)
		optimizedUrl.set('')
	}
</script>

<div class="page-container">
	<div class="header-row">
		{#if mode === 'batch' || $glbUrl}
			<button class="back-btn" onclick={reset}>
				<ArrowLeft size={20} /> Back
			</button>
		{/if}
		<PageHeader title="GLB 優化大師" />
	</div>

	{#if !$glbUrl && mode === 'single'}
		<div class="upload-container">
			<UploadZone
				{isLoading}
				{loadProgress}
				{error}
				onUpload={handleUpload}
				onClearError={() => (error = null)}
			/>
		</div>
	{:else if mode === 'single'}
		<div class="viewer-layout">
			<div class="preview-section">
				<Preview glbUrl={$glbUrl} />
			</div>

			<div class="controls-section">
				<SettingsPanel />
				<DownloadButton />
			</div>
		</div>
	{:else if mode === 'batch'}
		<div class="batch-layout">
			<div class="batch-list-section">
				<BatchFileListView files={batchFiles} onDownloadOne={downloadSingleFromBatch} />
			</div>

			<div class="controls-section">
				<SettingsPanel />

				<div class="batch-actions">
					<button class="action-button primary" disabled={isBatchProcessing} onclick={processBatch}>
						{#if isBatchProcessing}
							Processing...
						{:else}
							<Play size={18} /> Start Batch Optimization
						{/if}
					</button>

					{#if batchFiles.some((f) => f.status === 'done')}
						<button class="action-button success" onclick={downloadBatchZip}>
							<Download size={18} /> Download All (ZIP)
						</button>
					{/if}

					<button class="action-button secondary" onclick={reset}>
						<RefreshCcw size={18} /> Optimization New Batch
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if $optimizedUrl && mode === 'single'}
		<div class="optimized-result">
			<h2>優化結果</h2>
			<div class="preview-section">
				<Preview glbUrl={$optimizedUrl} />
			</div>
		</div>
	{/if}
</div>

<style>
	.page-container {
		min-height: 100vh;
		padding: 2rem;
		color: #fff;
		max-width: 1200px;
		margin: 0 auto;
	}

	.header-row {
		display: flex;
		align-items: center;
		position: relative;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.back-btn {
		position: absolute;
		left: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.back-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.upload-container {
		max-width: 600px;
		margin: 4rem auto;
	}

	.viewer-layout,
	.batch-layout {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-top: 2rem;
	}

	.batch-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.8rem;
		border-radius: 8px;
		border: none;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		color: white;
	}

	.action-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.action-button.primary {
		background: linear-gradient(135deg, #00c6fb 0%, #005bea 100%);
		box-shadow: 0 4px 15px rgba(0, 91, 234, 0.4);
	}

	.action-button.primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 91, 234, 0.6);
	}

	.action-button.success {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
		color: #1a1a1a;
		box-shadow: 0 4px 15px rgba(67, 233, 123, 0.4);
	}

	.action-button.success:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(67, 233, 123, 0.6);
	}

	.action-button.secondary {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.action-button.secondary:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	@media (min-width: 1024px) {
		.viewer-layout,
		.batch-layout {
			flex-direction: row;
			align-items: flex-start;
		}

		.preview-section,
		.batch-list-section {
			flex: 1;
			/* position: sticky; */ /* Removed sticky to avoid complications for now */
			/* top: 2rem; */
			min-height: 400px;
		}

		.preview-section {
			height: 600px;
			background: rgba(255, 255, 255, 0.02);
			border-radius: 16px;
			border: 1px solid rgba(255, 255, 255, 0.1);
			overflow: hidden;
		}

		.controls-section {
			width: 400px;
			display: flex;
			flex-direction: column;
			gap: 1.5rem;
		}
	}

	.preview-section {
		width: 100%;
		height: 400px;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}

	.controls-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	h2 {
		font-size: 1.8rem;
		font-weight: 200;
		margin: 3rem 0 1.5rem;
		text-align: center;
		background: linear-gradient(135deg, #fff 0%, #aaa 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.optimized-result {
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>
