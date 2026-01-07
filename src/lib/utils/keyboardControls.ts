import * as THREE from 'three'

export class KeyboardControls {
	private keys: Map<string, boolean> = new Map()
	private baseSpeed: number = 30.0

	constructor() {
		if (typeof window !== 'undefined') {
			window.addEventListener('keydown', this.handleKeyDown)
			window.addEventListener('keyup', this.handleKeyUp)
		}
	}

	private handleKeyDown = (e: KeyboardEvent) => {
		this.keys.set(e.code, true)
	}

	private handleKeyUp = (e: KeyboardEvent) => {
		this.keys.set(e.code, false)
	}

	public update(
		camera: THREE.Camera,
		controls: { target: THREE.Vector3; update: () => void },
		deltaTime: number
	) {
		const movement = new THREE.Vector3()

		// Get view direction
		const direction = new THREE.Vector3()
		camera.getWorldDirection(direction)

		// 將前後方向投影到水平面（XZ 平面）
		const forward = new THREE.Vector3(direction.x, 0, direction.z).normalize()

		// 左右方向：與水平前方向垂直
		const right = new THREE.Vector3()
		right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

		if (this.keys.get('KeyW') || this.keys.get('ArrowUp')) movement.add(forward)
		if (this.keys.get('KeyS') || this.keys.get('ArrowDown')) movement.sub(forward)
		if (this.keys.get('KeyD') || this.keys.get('ArrowRight')) movement.add(right)
		if (this.keys.get('KeyA') || this.keys.get('ArrowLeft')) movement.sub(right)

		if (movement.length() > 0) {
			// Shift 加速邏輯 (4倍速)
			const isShiftPressed = this.keys.get('ShiftLeft') || this.keys.get('ShiftRight')
			const currentSpeed = this.baseSpeed * (isShiftPressed ? 4 : 1)

			const offset = movement.normalize().multiplyScalar(currentSpeed * deltaTime)
			camera.position.add(offset)
			controls.target.add(offset)
			// OrbitControls needs to be updated if target changes
			controls.update()
		}
	}

	public dispose() {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', this.handleKeyDown)
			window.removeEventListener('keyup', this.handleKeyUp)
		}
		this.keys.clear()
	}
}
