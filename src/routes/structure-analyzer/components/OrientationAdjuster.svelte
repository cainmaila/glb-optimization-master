<script lang="ts">
	import { onMount } from 'svelte'
	import * as THREE from 'three'
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
	// @ts-expect-error - three-viewport-gizmo 沒有型別定義
	import { ViewportGizmo } from 'three-viewport-gizmo'
	import { ArrowLeft, RotateCcw, Check } from 'lucide-svelte'
	import { structureStore } from '../stores/structureStore.svelte'

	let canvasRef: HTMLCanvasElement
	let containerRef: HTMLDivElement

	let scene: THREE.Scene
	let camera: THREE.PerspectiveCamera
	let renderer: THREE.WebGLRenderer
	let controls: OrbitControls
	let animationId: number
	let viewportGizmo: ViewportGizmo | null = null

	let extractedObject: THREE.Object3D | null = null

	const extractionData = $derived(structureStore.extractionData)

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
		const grid = new THREE.GridHelper(100, 10, 0x4a4a5e, 0x2a2a3e)
		scene.add(grid)

		// Add extracted object
		setupExtractedObject()

		// Initialize ViewportGizmo
		initViewportGizmo()

		window.addEventListener('resize', handleResize)
	}

	function initViewportGizmo() {
		if (!camera || !renderer) return

		viewportGizmo = new ViewportGizmo(camera, renderer, {
			placement: 'bottom-right',
			size: 120,
			lineWidth: 2.5,
			offset: { right: 20, bottom: 150 }
		})
		viewportGizmo.attachControls(controls)
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

		// Update ViewportGizmo
		if (viewportGizmo) {
			viewportGizmo.update()
		}
	}

	function animate() {
		animationId = requestAnimationFrame(animate)
		controls?.update()
		renderer?.render(scene, camera)

		// Render ViewportGizmo
		if (viewportGizmo) {
			viewportGizmo.render()
		}
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
