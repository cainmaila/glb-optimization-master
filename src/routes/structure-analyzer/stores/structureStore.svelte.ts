import type * as THREE from 'three'
import type { TreeNode, ViewerConfig } from '$lib/types/structure'
import { convertToExportNode, generateExportFilename, downloadJSON } from '$lib/utils/treeExport'

class StructureStore {
	// 模型狀態
	model = $state<THREE.Group | null>(null)
	isLoading = $state(false)
	loadProgress = $state(0)
	error = $state<string | null>(null)

	// 樹狀結構
	treeData = $state<TreeNode[]>([])

	// 選取狀態
	selectedNodeId = $state<string | null>(null)

	// Viewer 設定
	config = $state<ViewerConfig>({
		showGrid: true,
		showBoundingBox: true,
		showAxes: false,
		xrayOpacity: 0.1
	})

	// 載入模型
	async loadModel(file: File): Promise<void> {
		this.isLoading = true
		this.loadProgress = 0
		this.error = null

		try {
			const { loadGLBFromFile } = await import('$lib/utils/gltfLoader')

			this.model = await loadGLBFromFile(file, (progress) => {
				this.loadProgress = progress
			})

			// 生成樹狀結構
			this.treeData = this.generateTreeData(this.model)
		} catch (e) {
			this.error = e instanceof Error ? e.message : '模型載入失敗'
			this.model = null
			this.treeData = []
		} finally {
			this.isLoading = false
		}
	}

	// 生成樹狀資料
	private generateTreeData(object: THREE.Object3D): TreeNode[] {
		return object.children.map((child) => ({
			id: child.uuid,
			name: child.name || child.type,
			type: child.type,
			visible: child.visible,
			children: this.generateTreeData(child),
			object: child
		}))
	}

	// 選取節點
	selectNode(nodeId: string | null): void {
		this.selectedNodeId = nodeId
	}

	// 清除選取
	clearSelection(): void {
		this.selectedNodeId = null
	}

	// 根據 ID 查找物件
	findObjectById(id: string): THREE.Object3D | null {
		if (!this.model) return null

		let found: THREE.Object3D | null = null
		this.model.traverse((child) => {
			if (child.uuid === id) {
				found = child
			}
		})
		return found
	}

	/**
	 * 匯出完整樹狀結構為 JSON
	 */
	exportTree(): void {
		if (this.treeData.length === 0) {
			this.error = '無法匯出：尚無樹狀結構資料'
			return
		}

		try {
			// 轉換為匯出格式
			const exportNodes = this.treeData.map((node) => convertToExportNode(node))

			// 產生檔名並下載
			const filename = generateExportFilename()
			downloadJSON(exportNodes, filename)
		} catch (error) {
			this.error = error instanceof Error ? `匯出失敗: ${error.message}` : '匯出時發生未知錯誤'
			console.error('Tree export error:', error)
		}
	}

	// 重置
	reset(): void {
		this.model = null
		this.treeData = []
		this.selectedNodeId = null
		this.error = null
		this.isLoading = false
		this.loadProgress = 0
	}
	// 導出當前選取的節點
	async exportSelectedNode() {
		if (!this.selectedNodeId) return

		const object = this.findObjectById(this.selectedNodeId)
		if (!object) return

		const { extractAndBakeNode } = await import('$lib/utils/modelExtraction')
		await extractAndBakeNode(object, object.name || 'extracted_model')
	}
}

export const structureStore = new StructureStore()
