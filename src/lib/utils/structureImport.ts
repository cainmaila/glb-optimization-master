import * as THREE from 'three'

/**
 * 根據路徑尋找物件
 * 路徑格式: "Scene/Group1/Mesh1" or "Group1/Mesh1"
 */
export function findObjectByPath(root: THREE.Object3D, path: string): THREE.Object3D | null {
	// 解析路徑
	const parts = path.split('/')

	let current: THREE.Object3D | undefined = root

	// Handle root matching
	let startIndex = 0

	// 如果 root 名字吻合，或是常見的 Scene 根節點，則從下一層開始找
	if (parts.length > 0 && (root.name === parts[0] || (root.name === '' && parts[0] === 'Scene'))) {
		startIndex = 1
	} else {
		// Root 名字不吻合 path 第一段，假設 path 第一段是 root 的 child
		startIndex = 0
	}

	for (let i = startIndex; i < parts.length; i++) {
		const part = parts[i]
		if (!current) return null

		// 從 children 中找名字相符的
		// 注意：Three.js 允許同名，這裡只取第一個
		const found: THREE.Object3D | undefined = current.children.find((c) => c.name === part)
		current = found
	}

	return current || null
}

/**
 * 遞迴應用結構更新 (Bottom-up approach)
 * 先處理子節點，再處理當前節點，以確保路徑依賴正確
 */
export function applyStructureUpdates(currentModel: THREE.Group, importNodes: any[]): void {
	// 遞迴函式
	const processNode = (nodes: any[]) => {
		for (const nodeData of nodes) {
			// 1. 先遞迴處理子節點
			if (nodeData.children && nodeData.children.length > 0) {
				processNode(nodeData.children)
			}

			// 2. 處理當前節點的更名
			// 根據 path 尋找對應的 Object3D
			const targetObject = findObjectByPath(currentModel, nodeData.path)

			if (targetObject) {
				// 如果名稱不同，則更新
				if (targetObject.name !== nodeData.name) {
					console.log(`Renaming: ${targetObject.name} -> ${nodeData.name} (Path: ${nodeData.path})`)
					targetObject.name = nodeData.name
				}
			} else {
				console.warn(`Object not found for path: ${nodeData.path}`)
			}
		}
	}

	processNode(importNodes)
}
