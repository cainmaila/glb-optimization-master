import * as THREE from 'three'
import type { TreeNode, ExportNode } from '$lib/types/structure'

/**
 * 計算節點的 bounding box 尺寸
 * @param object THREE.Object3D 物件
 * @returns 尺寸物件 {x, y, z} 或 null（無法計算時）
 */
export function calculateBoundingBoxSize(
	object: THREE.Object3D
): { x: number; y: number; z: number } | null {
	try {
		const box = new THREE.Box3().setFromObject(object)

		// 檢查是否為有效的 bounding box
		if (!box.isEmpty()) {
			const size = new THREE.Vector3()
			box.getSize(size)

			return {
				x: parseFloat(size.x.toFixed(6)), // 保留 6 位小數
				y: parseFloat(size.y.toFixed(6)),
				z: parseFloat(size.z.toFixed(6))
			}
		}
	} catch (error) {
		console.warn('無法計算節點 bounding box:', error)
	}

	return null
}

/**
 * 將 Float32Array 矩陣轉換為普通數字陣列
 * @param matrix THREE.Matrix4
 * @returns 16 個數字的陣列
 */
export function matrixToArray(matrix: THREE.Matrix4): number[] {
	const elements = matrix.elements
	// 保留 6 位小數以減少檔案大小
	return Array.from(elements).map((v) => parseFloat(v.toFixed(6)))
}

/**
 * 遞迴轉換 TreeNode 為 ExportNode
 * @param node TreeNode
 * @param parentPath 父節點路徑
 * @returns ExportNode
 */
export function convertToExportNode(node: TreeNode, parentPath: string = ''): ExportNode {
	const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name

	const exportNode: ExportNode = {
		name: node.name,
		path: currentPath,
		type: node.type,
		size: null,
		matrix: [],
		children: []
	}

	// 如果有對應的 THREE.Object3D，計算其屬性
	if (node.object) {
		exportNode.size = calculateBoundingBoxSize(node.object)
		exportNode.matrix = matrixToArray(node.object.matrix)
	} else {
		// 無 object 參考時，使用單位矩陣
		exportNode.matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
	}

	// 遞迴處理子節點
	exportNode.children = node.children.map((child) => convertToExportNode(child, currentPath))

	return exportNode
}

/**
 * 產生匯出檔案名稱
 * @returns 檔案名稱（例如：model-structure-20260106-143045.json）
 */
export function generateExportFilename(): string {
	const now = new Date()
	const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-')

	return `model-structure-${timestamp}.json`
}

/**
 * 觸發瀏覽器下載 JSON 檔案
 * @param data 要匯出的資料陣列
 * @param filename 檔案名稱
 */
export function downloadJSON(data: ExportNode[], filename: string): void {
	const jsonString = JSON.stringify(data, null, 2)
	const blob = new Blob([jsonString], { type: 'application/json' })
	const url = URL.createObjectURL(blob)

	const link = document.createElement('a')
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()

	// 清理
	document.body.removeChild(link)
	URL.revokeObjectURL(url)
}
