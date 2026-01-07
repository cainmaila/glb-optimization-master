<script lang="ts">
	import { Upload } from 'lucide-svelte'

	interface Props {
		isLoading: boolean
		loadProgress: number
		error: string | null
		onUpload: (file: File) => void
		onClearError?: () => void
	}

	let { isLoading, loadProgress, error, onUpload, onClearError = () => {} }: Props = $props()

	let isDragOver = $state(false)
	let fileInput: HTMLInputElement

	async function handleFile(file: File) {
		if (!file.name.toLowerCase().endsWith('.glb')) {
			// Note: Error handling is now responsibility of caller or passed as prop
			// But we can still do a basic check here if needed.
			// For consistency with original code, let's keep it store-agnostic.
			onUpload(file)
			return
		}

		if (file.size > 500 * 1024 * 1024) {
			// 500MB 限制
			onUpload(file) // Let the caller handle the size error if they want
			return
		}

		onUpload(file)
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault()
		isDragOver = false

		const files = e.dataTransfer?.files
		if (files && files.length > 0) {
			handleFile(files[0])
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement
		if (input.files && input.files.length > 0) {
			handleFile(input.files[0])
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			fileInput.click()
		}
	}
</script>

<div
	class="upload-zone"
	class:drag-over={isDragOver}
	role="button"
	tabindex="0"
	ondrop={handleDrop}
	ondragover={(e) => {
		e.preventDefault()
		isDragOver = true
	}}
	ondragleave={() => (isDragOver = false)}
	onclick={() => fileInput.click()}
	onkeydown={handleKeydown}
>
	<input
		type="file"
		accept=".glb"
		bind:this={fileInput}
		onchange={handleFileSelect}
		style="display: none"
	/>

	{#if isLoading}
		<div class="loading">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {loadProgress}%"></div>
			</div>
			<p>載入中... {loadProgress}%</p>
		</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
			{#if onClearError}
				<button
					onclick={(e) => {
						e.stopPropagation()
						onClearError()
					}}>重試</button
				>
			{/if}
		</div>
	{:else}
		<Upload size={48} />
		<p>拖曳 GLB 檔案至此，或點擊選擇</p>
	{/if}
</div>

<style>
	.upload-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 4rem 3rem;
		border: 2px dashed rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		background: rgba(255, 255, 255, 0.02);
		width: 100%;
		box-sizing: border-box;
	}

	.upload-zone:hover,
	.upload-zone.drag-over {
		border-color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.05);
		transform: translateY(-2px);
	}

	.loading,
	.error {
		width: 100%;
		text-align: center;
		padding: 1rem;
	}

	.progress-bar {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
		transition: width 0.3s;
	}

	button {
		padding: 0.5rem 1.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: #fff;
		cursor: pointer;
		margin-top: 1rem;
		transition: all 0.2s;
	}

	button:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.4);
	}

	p {
		color: rgba(255, 255, 255, 0.6);
		margin: 0;
		font-size: 1.1rem;
		font-weight: 300;
	}

	:global(.upload-zone svg) {
		color: rgba(255, 255, 255, 0.8);
		margin-bottom: 0.5rem;
	}
</style>
