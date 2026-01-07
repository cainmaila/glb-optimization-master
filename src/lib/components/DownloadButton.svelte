<script lang="ts">
	import { selectedFile, optimizedUrl } from '$lib/stores'
	import { settings } from '$lib/settings'
	import ComparisonReport from './ComparisonReport.svelte'

	let isProcessing = false
	let progress = ''
	let reports: { original: any; optimized: any } | null = null

	async function handleOptimize() {
		if (!$selectedFile) return

		isProcessing = true
		progress = 'Uploading & Optimizing...'
		reports = null // Reset reports

		try {
			const formData = new FormData()
			formData.append('file', $selectedFile)
			formData.append('config', JSON.stringify($settings))

			const response = await fetch('/api/optimize', {
				method: 'POST',
				body: formData
			})

			if (!response.ok) {
				throw new Error('Optimization failed')
			}

			// Handle JSON response with comparison data
			const data = await response.json()
			const { file, originalReport, optimizedReport } = data

			// Decode Base64 to Blob
			const byteCharacters = atob(file)
			const byteNumbers = new Array(byteCharacters.length)
			for (let i = 0; i < byteCharacters.length; i++) {
				byteNumbers[i] = byteCharacters.charCodeAt(i)
			}
			const byteArray = new Uint8Array(byteNumbers)
			const blob = new Blob([byteArray], { type: 'model/gltf-binary' })

			const url = URL.createObjectURL(blob)
			optimizedUrl.set(url)
			reports = { original: originalReport, optimized: optimizedReport }
			progress = 'Done!'
		} catch (error) {
			console.error(error)
			progress = 'Error occurred'
		} finally {
			isProcessing = false
		}
	}

	function handleDownload() {
		if (!$optimizedUrl) return
		const a = document.createElement('a')
		a.href = $optimizedUrl
		a.download = 'optimized_model.glb'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
	}
</script>

<div class="container">
	<div class="controls optimize-section">
		<button class="btn-optimize" on:click={handleOptimize} disabled={isProcessing}>
			{isProcessing ? 'Processing... (High CPU)' : 'Optimize & Download'}
		</button>
	</div>

	{#if progress && !reports}
		<div class="status">{progress}</div>
	{/if}

	{#if reports}
		<ComparisonReport original={reports.original} optimized={reports.optimized} />
	{/if}

	{#if $optimizedUrl}
		<div class="controls download-section">
			<button class="btn-download" on:click={handleDownload}> Download .GLB </button>
		</div>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
	}

	.controls {
		display: flex;
		gap: 1rem;
		justify-content: center;
		align-items: center;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		backdrop-filter: blur(5px);
	}

	.btn-optimize {
		background: linear-gradient(135deg, #00c6fb 0%, #005bea 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(0, 91, 234, 0.4);
	}

	.btn-optimize:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 91, 234, 0.6);
	}

	.btn-download {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
		color: #1a1a1a;
		box-shadow: 0 4px 15px rgba(67, 233, 123, 0.4);
	}

	.btn-download:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(67, 233, 123, 0.6);
	}

	button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.status {
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.9rem;
		text-align: center;
	}
</style>
