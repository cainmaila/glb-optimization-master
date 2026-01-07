<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte'
	import UploadZone from '$lib/components/UploadZone.svelte'
	import Preview from '$lib/components/Preview.svelte'
	import DownloadButton from '$lib/components/DownloadButton.svelte'
	import SettingsPanel from '$lib/components/SettingsPanel.svelte'
	import { glbUrl, optimizedUrl, selectedFile } from '$lib/stores'

	let isLoading = $state(false)
	let loadProgress = $state(0)
	let error = $state<string | null>(null)

	function handleUpload(file: File) {
		isLoading = true
		loadProgress = 0
		error = null

		try {
			const url = URL.createObjectURL(file)
			glbUrl.set(url)
			selectedFile.set(file)
			loadProgress = 100
		} catch (e) {
			error = e instanceof Error ? e.message : '上傳失敗'
		} finally {
			isLoading = false
		}
	}
</script>

<div class="page-container">
	<PageHeader title="GLB 優化大師" />

	{#if !$glbUrl}
		<div class="upload-container">
			<UploadZone
				{isLoading}
				{loadProgress}
				{error}
				onUpload={handleUpload}
				onClearError={() => (error = null)}
			/>
		</div>
	{:else}
		<div class="viewer-layout">
			<div class="preview-section">
				<Preview glbUrl={$glbUrl} />
			</div>

			<div class="controls-section">
				<SettingsPanel />
				<DownloadButton />
			</div>
		</div>
	{/if}

	{#if $optimizedUrl}
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

	.upload-container {
		max-width: 600px;
		margin: 4rem auto;
	}

	.viewer-layout {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-top: 2rem;
	}

	@media (min-width: 1024px) {
		.viewer-layout {
			flex-direction: row;
			align-items: flex-start;
		}

		.preview-section {
			flex: 1;
			position: sticky;
			top: 2rem;
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
