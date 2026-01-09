<script lang="ts">
	import { onMount } from 'svelte'
	import * as THREE from 'three'
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
	import { structureStore } from '../stores/structureStore.svelte'
	import { flyToObject } from '$lib/utils/cameraAnimations'
	import { KeyboardControls } from '$lib/utils/keyboardControls'

	let canvasRef: HTMLCanvasElement
	let containerRef: HTMLDivElement

	let scene: THREE.Scene
	let camera: THREE.PerspectiveCamera
	let renderer: THREE.WebGLRenderer
	let controls: OrbitControls
	let keyboardControls: KeyboardControls
	let gridHelper: THREE.GridHelper
	let boundingBoxHelper: THREE.BoxHelper | null = null
	let resizeObserver: ResizeObserver

	let currentSelectedObject: THREE.Object3D | null = null
	let animationId: number

	const model = $derived(structureStore.model)
	const selectedNodeId = $derived(structureStore.selectedNodeId)
	const config = $derived(structureStore.config)

	// 初始化場景
	onMount(() => {
		initScene()
		animate()

		return () => {
			if (resizeObserver) resizeObserver.disconnect()
			cancelAnimationFrame(animationId)
			if (renderer) renderer.dispose()
			if (controls) controls.dispose()
			if (keyboardControls) keyboardControls.dispose()
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
		camera.position.set(50, 50, 50)

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

		// Keyboard Controls
		keyboardControls = new KeyboardControls()

		// Lighting
		setupLights()

		// Grid
		gridHelper = new THREE.GridHelper(200, 20, 0x4a4a5e, 0x2a2a3e)
		scene.add(gridHelper)

		// Responsive
		resizeObserver = new ResizeObserver(() => {
			handleResize()
		})
		resizeObserver.observe(containerRef)
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

	function handleResize() {
		if (!containerRef || !camera || !renderer) return

		const width = containerRef.clientWidth
		const height = containerRef.clientHeight

		camera.aspect = width / height
		camera.updateProjectionMatrix()
		renderer.setSize(width, height)
	}

	let lastTime = performance.now()
	function animate() {
		animationId = requestAnimationFrame(animate)
		const time = performance.now()
		const deltaTime = (time - lastTime) / 1000
		lastTime = time

		// WSAD 控制始終啟用
		keyboardControls.update(camera, controls, deltaTime)
		controls.update()

		renderer.render(scene, camera)
	}

	// 載入模型時
	$effect(() => {
		if (!model || !scene) return

		// 移除舊模型
		const oldModel = scene.children.find((child) => child.userData.isModel)
		if (oldModel) scene.remove(oldModel)

		// 添加新模型
		model.userData.isModel = true
		scene.add(model)

		// 計算中心點並調整相機
		const box = new THREE.Box3().setFromObject(model)
		const center = box.getCenter(new THREE.Vector3())
		const size = box.getSize(new THREE.Vector3())
		const maxDim = Math.max(size.x, size.y, size.z)

		camera.position.set(center.x + maxDim * 1.5, center.y + maxDim * 1.5, center.z + maxDim * 1.5)
		controls.target.copy(center)
		controls.update()
	})

	// 選取變化時
	$effect(() => {
		if (!model) return

		if (selectedNodeId) {
			const targetObject = structureStore.findObjectById(selectedNodeId)
			if (targetObject) {
				handleSelection(targetObject)
			}
		} else {
			clearSelection()
		}
	})

	async function handleSelection(target: THREE.Object3D) {
		currentSelectedObject = target

		// 應用 X-ray 效果
		applyXray(target)

		// 更新 Bounding Box
		updateBoundingBox()

		// FlyTo 動畫
		await flyToObject(target, camera, controls, {
			duration: 1200,
			padding: 1.5
		})
	}

	function applyXray(target: THREE.Object3D) {
		model!.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				if (child === target || isDescendant(target, child)) {
					// 高亮：恢復原始材質
					child.material = child.userData.originalMaterial
				} else {
					// X-ray：半透明
					const xrayMaterial = child.userData.originalMaterial.clone()
					xrayMaterial.transparent = true
					xrayMaterial.opacity = config.xrayOpacity
					child.material = xrayMaterial
				}
			}
		})
	}

	function clearSelection() {
		if (!model) return

		// 恢復所有材質
		model.traverse((child) => {
			if (child instanceof THREE.Mesh && child.userData.originalMaterial) {
				child.material = child.userData.originalMaterial
			}
		})

		currentSelectedObject = null

		// 隱藏 Bounding Box
		if (boundingBoxHelper) {
			boundingBoxHelper.visible = false
		}
	}

	function updateBoundingBox() {
		if (!config.showBoundingBox || !currentSelectedObject) {
			if (boundingBoxHelper) boundingBoxHelper.visible = false
			return
		}

		if (boundingBoxHelper) {
			boundingBoxHelper.setFromObject(currentSelectedObject)
			boundingBoxHelper.visible = true
		} else {
			boundingBoxHelper = new THREE.BoxHelper(currentSelectedObject, 0x00ff00)
			scene.add(boundingBoxHelper)
		}
	}

	function isDescendant(parent: THREE.Object3D, child: THREE.Object3D): boolean {
		let node = child.parent
		while (node) {
			if (node === parent) return true
			node = node.parent
		}
		return false
	}

	// Grid 顯示切換
	$effect(() => {
		if (gridHelper) {
			gridHelper.visible = config.showGrid
		}
	})
</script>

<div bind:this={containerRef} class="viewer-container">
	<canvas bind:this={canvasRef}></canvas>
</div>

<style lang="postcss">
	.viewer-container {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}

	canvas {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
