<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte'
	import UploadZone from '$lib/components/UploadZone.svelte'
	import TreeMenu from './components/TreeMenu.svelte'
	import StructureViewer from './components/StructureViewer.svelte'
	import ExtractionMenu from './components/ExtractionMenu.svelte'
	import LocationPreview from './components/LocationPreview.svelte'
	import OrientationAdjuster from './components/OrientationAdjuster.svelte'
	import BatchProgressOverlay from './components/BatchProgressOverlay.svelte'
	import { structureStore } from './stores/structureStore.svelte'

	const hasModel = $derived(!!structureStore.model)
	const viewMode = $derived(structureStore.viewMode)
	const isBatchMode = $derived(structureStore.isBatchMode)
</script>

{#if !hasModel}
	<!-- 上傳區域 -->
	<div class="page-container">
		<PageHeader title="結構解析大師" />
		<div class="upload-container">
			<UploadZone
				isLoading={structureStore.isLoading}
				loadProgress={structureStore.loadProgress}
				error={structureStore.error}
				onUpload={(files) => structureStore.loadModel(files[0])}
				onClearError={() => (structureStore.error = null)}
				singleFileOnly={true}
			/>
		</div>
	</div>
{:else}
	<!-- Fullscreen Viewer 介面 -->
	<div class="fullscreen-viewer">
		<StructureViewer />
		<TreeMenu />
	</div>
{/if}

<!-- 摘取流程 overlays -->
{#if isBatchMode}
	<BatchProgressOverlay />
{:else if viewMode === 'EXTRACTION_MENU'}
	<ExtractionMenu />
{:else if viewMode === 'PREVIEW_LOCATION'}
	<LocationPreview />
{:else if viewMode === 'ADJUST_ORIENTATION'}
	<OrientationAdjuster />
{/if}

<style lang="postcss">
	.page-container {
		min-height: 100vh;
		padding: 2rem;
		color: #fff;
	}

	.upload-container {
		max-width: 600px;
		margin: 4rem auto;
	}

	.fullscreen-viewer {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: #0a0a14;
	}
</style>
