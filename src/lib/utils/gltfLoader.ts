import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import * as THREE from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

export async function loadGLBFromFile(
	file: File,
	onProgress?: (progress: number) => void
): Promise<THREE.Group> {
	return new Promise((resolve, reject) => {
		const loader = new GLTFLoader()

		// 設定 Draco 解碼器（使用 Google CDN）
		const dracoLoader = new DRACOLoader()
		dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
		loader.setDRACOLoader(dracoLoader)

		const reader = new FileReader()

		reader.onload = async (e) => {
			const arrayBuffer = e.target?.result as ArrayBuffer

			loader.parse(
				arrayBuffer,
				'',
				(gltf: GLTF) => {
					onProgress?.(100)

					// 儲存原始材質（用於 X-ray 效果）
					gltf.scene.traverse((child: THREE.Object3D) => {
						if (child instanceof THREE.Mesh) {
							child.userData.originalMaterial = child.material
						}
					})

					resolve(gltf.scene)
				},
				(error: unknown) => {
					const message = error instanceof Error ? error.message : '未知錯誤'
					reject(new Error(`GLB 解析失敗: ${message}`))
				}
			)
		}

		reader.onerror = () => reject(new Error('檔案讀取失敗'))
		reader.onprogress = (e) => {
			if (e.lengthComputable) {
				onProgress?.(Math.round((e.loaded / e.total) * 50)) // 0-50%
			}
		}

		reader.readAsArrayBuffer(file)
	})
}
