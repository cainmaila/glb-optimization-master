<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte'
	import UploadZone from '$lib/components/UploadZone.svelte'
	import TreeMenu from './components/TreeMenu.svelte'
	import StructureViewer from './components/StructureViewer.svelte'
	import { structureStore } from './stores/structureStore.svelte'

	const hasModel = $derived(!!structureStore.model)
</script>

<div class="page-container">
	<PageHeader title="結構解析大師" />

	{#if !hasModel}
		<!-- 上傳區域 -->
		<div class="upload-container">
			<UploadZone
				isLoading={structureStore.isLoading}
				loadProgress={structureStore.loadProgress}
				error={structureStore.error}
				onUpload={(files) => structureStore.loadModel(files[0])}
				onClearError={() => (structureStore.error = null)}
			/>
		</div>
	{:else}
		<!-- Viewer 介面 -->
		<div class="viewer-layout">
			<TreeMenu />
			<StructureViewer />
		</div>
	{/if}
</div>

<style>
	.page-container {
		min-height: 100vh;
		padding: 2rem;
		color: #fff;
	}
	.upload-container {
		max-width: 600px;
		margin: 4rem auto;
	}

	.viewer-layout {
		display: flex;
		height: calc(100vh - 12rem);
		background: rgba(255, 255, 255, 0.02);
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
</style>
