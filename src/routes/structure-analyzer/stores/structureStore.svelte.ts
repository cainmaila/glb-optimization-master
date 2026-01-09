import type * as THREE from 'three'
import type { TreeNode, ViewerConfig } from '$lib/types/structure'
import { convertToExportNode, generateExportFilename, downloadJSON } from '$lib/utils/treeExport'
import type { ExtractionData } from '$lib/utils/modelExtraction'

export type ViewMode = 'DEFAULT' | 'EXTRACTION_MENU' | 'PREVIEW_LOCATION' | 'ADJUST_ORIENTATION'

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

	// 摘取流程狀態
	viewMode = $state<ViewMode>('DEFAULT')
	extractionData = $state<ExtractionData | null>(null)

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
		this.viewMode = 'DEFAULT'
		this.extractionData = null
	}

	// ========== 摘取流程 ==========

	/**
	 * 開始摘取流程：準備資料並顯示選單
	 */
	async startExtraction(): Promise<void> {
		if (!this.selectedNodeId) return

		const object = this.findObjectById(this.selectedNodeId)
		if (!object) return

		try {
			const { prepareExtraction } = await import('$lib/utils/modelExtraction')
			this.extractionData = prepareExtraction(object)
			this.viewMode = 'EXTRACTION_MENU'
		} catch (error) {
			this.error = error instanceof Error ? error.message : '摘取準備失敗'
		}
	}

	/**
	 * 取消摘取流程
	 */
	cancelExtraction(): void {
		this.extractionData = null
		this.viewMode = 'DEFAULT'
	}

	/**
	 * 切換到預覽位置模式
	 */
	enterPreviewLocation(): void {
		this.viewMode = 'PREVIEW_LOCATION'
	}

	/**
	 * 切換到調整方向模式
	 */
	enterAdjustOrientation(): void {
		this.viewMode = 'ADJUST_ORIENTATION'
	}

	/**
	 * 返回摘取選單
	 */
	backToMenu(): void {
		this.viewMode = 'EXTRACTION_MENU'
	}

	/**
	 * 旋轉摘取的物件 90 度
	 */
	async rotateExtracted(axis: 'x' | 'y' | 'z'): Promise<void> {
		if (!this.extractionData) return

		const { applyRotationToExtractedNode } = await import('$lib/utils/modelExtraction')
		applyRotationToExtractedNode(this.extractionData.clonedNode, axis)

		// 觸發響應式更新
		this.extractionData = { ...this.extractionData }
	}

	/**
	 * 確認方向調整並返回選單
	 */
	confirmOrientation(): void {
		// 旋轉已經烘培進 geometry，直接返回選單
		this.viewMode = 'EXTRACTION_MENU'
	}

	/**
	 * 完成摘取流程，下載 ZIP
	 */
	async finalizeExtraction(): Promise<void> {
		if (!this.extractionData) return

		try {
			const { packageAndDownload } = await import('$lib/utils/modelExtraction')
			await packageAndDownload(
				this.extractionData,
				this.extractionData.metadata.name || 'extracted_model'
			)
			// 下載後清除狀態
			this.cancelExtraction()
		} catch (error) {
			this.error = error instanceof Error ? error.message : '下載失敗'
		}
	}

	// 導出當前選取的節點 (legacy, kept for compatibility)
	async exportSelectedNode() {
		if (!this.selectedNodeId) return

		const object = this.findObjectById(this.selectedNodeId)
		if (!object) return

		const { extractAndBakeNode } = await import('$lib/utils/modelExtraction')
		await extractAndBakeNode(object, object.name || 'extracted_model')
	}

	/**
	 * 匯入並應用結構更新 (Renaming)
	 */
	async importStructure(file: File): Promise<void> {
		this.isLoading = true
		this.error = null

		try {
			const text = await file.text()
			const json = JSON.parse(text)

			// 動態載入 schema 避免循環依賴或過大 bundle
			const { exportNodeSchema } = await import('$lib/schemas/structureSchema')
			const parsedData = exportNodeSchema.array().parse(json)

			if (!this.model) {
				throw new Error('請先載入模型後再匯入結構')
			}

			// 應用更新 (Bottom-up renaming)
			const { applyStructureUpdates } = await import('$lib/utils/structureImport')
			applyStructureUpdates(this.model, parsedData)

			// 重新生成樹狀資料以更新 UI
			this.treeData = this.generateTreeData(this.model)
		} catch (e) {
			console.error('Import error:', e)
			this.error = e instanceof Error ? `匯入失敗: ${e.message}` : '匯入時發生未知錯誤'
		} finally {
			this.isLoading = false
		}
	}

	/**
	 * 下載目前的 GLB 模型 (含 modifications)
	 */
	async downloadModel(): Promise<void> {
		if (!this.model) return

		this.isLoading = true
		try {
			const { exportModelToGLB } = await import('$lib/utils/modelExport')
			// 使用當前時間戳作為檔名
			const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]
			await exportModelToGLB(this.model, `model-modified-${timestamp}`)
		} catch (error) {
			console.error('Model export error:', error)
			this.error = error instanceof Error ? `模型下載失敗: ${error.message}` : '模型下載時發生錯誤'
		} finally {
			this.isLoading = false
		}
	}
}

export const structureStore = new StructureStore()
