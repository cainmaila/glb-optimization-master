<script lang="ts">
	import { onMount } from 'svelte'
	import * as THREE from 'three'
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
	import { ArrowLeft, RotateCcw, Check } from 'lucide-svelte'
	import { structureStore } from '../stores/structureStore.svelte'

	let canvasRef: HTMLCanvasElement
	let containerRef: HTMLDivElement
	let axesContainerRef: HTMLDivElement
	let axesCanvasRef: HTMLCanvasElement

	let scene: THREE.Scene
	let camera: THREE.PerspectiveCamera
	let renderer: THREE.WebGLRenderer
	let controls: OrbitControls
	let animationId: number

	// Axes helper scene
	let axesScene: THREE.Scene
	let axesCamera: THREE.PerspectiveCamera
	let axesRenderer: THREE.WebGLRenderer

	let extractedObject: THREE.Object3D | null = null

	const extractionData = $derived(structureStore.extractionData)

	onMount(() => {
		initScene()
		initAxesHelper()
		animate()

		return () => {
			cancelAnimationFrame(animationId)
			renderer?.dispose()
			axesRenderer?.dispose()
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
		const grid = new THREE.GridHelper(100, 10, 0x4a4a5e, 0x2a2a3e)
		scene.add(grid)

		// Add extracted object
		setupExtractedObject()

		window.addEventListener('resize', handleResize)
	}

	function initAxesHelper() {
		axesScene = new THREE.Scene()
		axesCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
		axesCamera.position.set(2, 2, 2)
		axesCamera.lookAt(0, 0, 0)

		axesRenderer = new THREE.WebGLRenderer({
			canvas: axesCanvasRef,
			antialias: true,
			alpha: true
		})
		axesRenderer.setSize(120, 120)
		axesRenderer.setClearColor(0x000000, 0)

		const axesHelper = new THREE.AxesHelper(1.5)
		axesScene.add(axesHelper)

		// Add axis labels
		addAxisLabels()
	}

	function addAxisLabels() {
		// We'll use simple colored spheres at axis ends
		const materials = {
			x: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
			y: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
			z: new THREE.MeshBasicMaterial({ color: 0x0000ff })
		}

		const sphereGeom = new THREE.SphereGeometry(0.08, 16, 16)

		const xSphere = new THREE.Mesh(sphereGeom, materials.x)
		xSphere.position.set(1.6, 0, 0)
		axesScene.add(xSphere)

		const ySphere = new THREE.Mesh(sphereGeom, materials.y)
		ySphere.position.set(0, 1.6, 0)
		axesScene.add(ySphere)

		const zSphere = new THREE.Mesh(sphereGeom, materials.z)
		zSphere.position.set(0, 0, 1.6)
		axesScene.add(zSphere)
	}

	function setupLights() {
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
		scene.add(ambientLight)

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
		directionalLight.position.set(50, 50, 50)
		scene.add(directionalLight)

		const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5)
		scene.add(hemisphereLight)
	}

	function setupExtractedObject() {
		if (!extractionData) return

		// Clone the extracted object and place at origin
		extractedObject = extractionData.clonedNode.clone(true)
		extractedObject.position.set(0, 0, 0)
		scene.add(extractedObject)

		// Zoom to fit
		const box = new THREE.Box3().setFromObject(extractedObject)
		const center = box.getCenter(new THREE.Vector3())
		const size = box.getSize(new THREE.Vector3())
		const maxDim = Math.max(size.x, size.y, size.z)

		camera.position.set(maxDim * 2, maxDim * 1.5, maxDim * 2)
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
		axesRenderer?.render(axesScene, axesCamera)
	}

	async function handleRotate(axis: 'x' | 'y' | 'z') {
		await structureStore.rotateExtracted(axis)

		// Refresh the displayed object
		if (extractedObject) {
			scene.remove(extractedObject)
		}
		setupExtractedObject()
	}
</script>

<div class="orientation-overlay">
	<div class="orientation-header">
		<button class="back-btn" onclick={() => structureStore.backToMenu()}>
			<ArrowLeft size={20} />
			<span>返回選單</span>
		</button>
		<h3>調整方向</h3>
		<div class="hint">每次旋轉 90°，確認後烘培到模型</div>
	</div>

	<div bind:this={containerRef} class="viewer-container">
		<canvas bind:this={canvasRef}></canvas>

		<!-- Axes Helper -->
		<div bind:this={axesContainerRef} class="axes-helper">
			<canvas bind:this={axesCanvasRef}></canvas>
			<div class="axes-labels">
				<span class="x-label">X</span>
				<span class="y-label">Y</span>
				<span class="z-label">Z</span>
			</div>
		</div>
	</div>

	<div class="rotation-controls">
		<button class="rotate-btn y-btn" onclick={() => handleRotate('y')}>
			<RotateCcw size={18} />
			<span>Y 軸旋轉</span>
		</button>
		<button class="rotate-btn x-btn" onclick={() => handleRotate('x')}>
			<RotateCcw size={18} />
			<span>X 軸旋轉</span>
		</button>
		<button class="rotate-btn z-btn" onclick={() => handleRotate('z')}>
			<RotateCcw size={18} />
			<span>Z 軸旋轉</span>
		</button>
		<button class="confirm-btn" onclick={() => structureStore.confirmOrientation()}>
			<Check size={20} />
			<span>確定</span>
		</button>
	</div>
</div>

<style>
	.orientation-overlay {
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

	.orientation-header {
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
		overflow: hidden;
		min-height: 0;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}

	.axes-helper {
		position: absolute;
		bottom: 20px;
		right: 20px;
		width: 120px;
		height: 120px;
		background: rgba(0, 0, 0, 0.5);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.axes-helper canvas {
		width: 100%;
		height: 100%;
	}

	.axes-labels {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
	}

	.x-label,
	.y-label,
	.z-label {
		position: absolute;
		font-size: 10px;
		font-weight: bold;
	}

	.x-label {
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		color: #ff4444;
	}

	.y-label {
		left: 50%;
		top: 8px;
		transform: translateX(-50%);
		color: #44ff44;
	}

	.z-label {
		left: 20px;
		bottom: 20px;
		color: #4444ff;
	}

	.rotation-controls {
		display: flex;
		gap: 1rem;
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.5);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		justify-content: center;
		flex-shrink: 0;
	}

	.rotate-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		border: 1px solid;
		cursor: pointer;
		transition: all 0.2s;
		color: #fff;
		font-size: 0.95rem;
	}

	.y-btn {
		background: rgba(68, 255, 68, 0.15);
		border-color: rgba(68, 255, 68, 0.4);
	}

	.y-btn:hover {
		background: rgba(68, 255, 68, 0.25);
	}

	.x-btn {
		background: rgba(255, 68, 68, 0.15);
		border-color: rgba(255, 68, 68, 0.4);
	}

	.x-btn:hover {
		background: rgba(255, 68, 68, 0.25);
	}

	.z-btn {
		background: rgba(68, 68, 255, 0.15);
		border-color: rgba(68, 68, 255, 0.4);
	}

	.z-btn:hover {
		background: rgba(68, 68, 255, 0.25);
	}

	.confirm-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 2rem;
		background: rgba(50, 205, 50, 0.2);
		border: 1px solid rgba(50, 205, 50, 0.5);
		border-radius: 8px;
		color: #fff;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 500;
		transition: all 0.2s;
		margin-left: 1rem;
	}

	.confirm-btn:hover {
		background: rgba(50, 205, 50, 0.35);
	}
</style>
