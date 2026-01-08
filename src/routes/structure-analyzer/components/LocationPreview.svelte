<script lang="ts">
	import { onMount } from 'svelte'
	import * as THREE from 'three'
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
	import { ArrowLeft } from 'lucide-svelte'
	import { structureStore } from '../stores/structureStore.svelte'

	let canvasRef: HTMLCanvasElement
	let containerRef: HTMLDivElement

	let scene: THREE.Scene
	let camera: THREE.PerspectiveCamera
	let renderer: THREE.WebGLRenderer
	let controls: OrbitControls
	let animationId: number

	const extractionData = $derived(structureStore.extractionData)
	const originalModel = $derived(structureStore.model)

	onMount(() => {
		initScene()
		animate()

		return () => {
			cancelAnimationFrame(animationId)
			renderer?.dispose()
			controls?.dispose()
			window.removeEventListener('resize', handleResize)
		}
	})

	function initScene() {
		// Scene
		scene = new THREE.Scene()
		scene.background = new THREE.Color(0x0a0a14)

		// Camera
		camera = new THREE.PerspectiveCamera(
			45,
			containerRef.clientWidth / containerRef.clientHeight,
			0.1,
			2000
		)

		// Renderer
		renderer = new THREE.WebGLRenderer({
			canvas: canvasRef,
			antialias: true
		})
		renderer.setSize(containerRef.clientWidth, containerRef.clientHeight)
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

		// Controls
		controls = new OrbitControls(camera, renderer.domElement)
		controls.enableDamping = true
		controls.dampingFactor = 0.05

		// Lighting
		setupLights()

		// Grid
		const grid = new THREE.GridHelper(200, 20, 0x4a4a5e, 0x2a2a3e)
		scene.add(grid)

		// Add models
		setupModels()

		window.addEventListener('resize', handleResize)
	}

	function setupLights() {
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
		scene.add(ambientLight)

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
		directionalLight.position.set(50, 50, 50)
		scene.add(directionalLight)

		const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5)
		scene.add(hemisphereLight)
	}

	function setupModels() {
		if (!originalModel || !extractionData) return

		// Clone original model and make it transparent (X-ray)
		const ghostModel = originalModel.clone(true)
		ghostModel.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				const ghostMaterial = child.material.clone()
				ghostMaterial.transparent = true
				ghostMaterial.opacity = 0.15
				ghostMaterial.depthWrite = false
				child.material = ghostMaterial
			}
		})
		ghostModel.userData.isGhost = true
		scene.add(ghostModel)

		// Add extracted node at its restore position
		const extractedClone = extractionData.clonedNode.clone(true)
		const { worldCenter } = extractionData.metadata
		extractedClone.position.set(worldCenter.x, worldCenter.y, worldCenter.z)
		extractedClone.userData.isExtracted = true
		scene.add(extractedClone)

		// Zoom to extracted object
		const box = new THREE.Box3().setFromObject(extractedClone)
		const center = box.getCenter(new THREE.Vector3())
		const size = box.getSize(new THREE.Vector3())
		const maxDim = Math.max(size.x, size.y, size.z)

		camera.position.set(center.x + maxDim * 2, center.y + maxDim * 1.5, center.z + maxDim * 2)
		controls.target.copy(center)
		controls.update()
	}

	function handleResize() {
		if (!containerRef || !camera || !renderer) return

		const width = containerRef.clientWidth
		const height = containerRef.clientHeight

		camera.aspect = width / height
		camera.updateProjectionMatrix()
		renderer.setSize(width, height)
	}

	function animate() {
		animationId = requestAnimationFrame(animate)
		controls?.update()
		renderer?.render(scene, camera)
	}
</script>

<div class="location-preview-overlay">
	<div class="preview-header">
		<button class="back-btn" onclick={() => structureStore.backToMenu()}>
			<ArrowLeft size={20} />
			<span>返回選單</span>
		</button>
		<h3>預覽位置</h3>
		<div class="hint">半透明為原始場景，高亮為摘取物件</div>
	</div>

	<div bind:this={containerRef} class="viewer-container">
		<canvas bind:this={canvasRef}></canvas>
	</div>
</div>

<style>
	.location-preview-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(10, 10, 20, 0.98);
		z-index: 1000;
		display: flex;
		flex-direction: column;
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: #fff;
		cursor: pointer;
		transition: all 0.2s;
	}

	.back-btn:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	h3 {
		margin: 0;
		color: #fff;
		flex: 1;
	}

	.hint {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.85rem;
	}

	.viewer-container {
		flex: 1;
		position: relative;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
