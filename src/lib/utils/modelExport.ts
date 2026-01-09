import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

/**
 * 將模型匯出為 GLB 檔案
 * @param model 要匯出的 Three.js 物件 (通常是 Group 或 Scene)
 * @param filename 下載的檔案名稱 (不含 .glb，預設 'model')
 */
export async function exportModelToGLB(
	model: THREE.Object3D,
	filename: string = 'model'
): Promise<void> {
	const exporter = new GLTFExporter()

	const options = {
		binary: true
		// 可以在這裡加入更多選項，例如 animations, onlyVisible 等
	}

	return new Promise((resolve, reject) => {
		exporter.parse(
			model,
			(result) => {
				if (result instanceof ArrayBuffer) {
					saveArrayBuffer(result, `${filename}.glb`)
					resolve()
				} else {
					reject(new Error('Export failed: Result is not an ArrayBuffer (binary mode required).'))
				}
			},
			(error) => {
				reject(error)
			},
			options
		)
	})
}

/**
 * 觸發瀏覽器下載二進制檔案
 */
function saveArrayBuffer(buffer: ArrayBuffer, filename: string) {
	const blob = new Blob([buffer], { type: 'application/octet-stream' })
	const link = document.createElement('a')
	link.href = URL.createObjectURL(blob)
	link.download = filename
	document.body.appendChild(link)
	link.click()

	// Cleanup
	document.body.removeChild(link)
	URL.revokeObjectURL(link.href)
}
