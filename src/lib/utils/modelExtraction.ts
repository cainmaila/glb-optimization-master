import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import JSZip from 'jszip'

export interface ExtractionMetadata {
	name: string
	originalPath: string
	originalWorldMatrix: number[] // 原始完整世界矩陣（參考用，不應直接用於恢復）
	worldCenter: { x: number; y: number; z: number } // 烘培前的世界空間中心點
	restoreMatrix: number[] // 恢復用的純平移矩陣（16個數字）
	note: string // 使用說明
	size: { x: number; y: number; z: number; unit: string } // 尺寸
}

export interface ExtractionData {
	clonedNode: THREE.Object3D
	metadata: ExtractionMetadata
	originalNode: THREE.Object3D
}

/**
 * Prepares extraction data without downloading.
 * Returns the cloned node, metadata, and reference to the original node.
 */
export function prepareExtraction(node: THREE.Object3D): ExtractionData {
	// 1. Calculate World Matrix (before modification)
	node.updateMatrixWorld(true)
	const worldMatrix = node.matrixWorld.toArray()

	// 2. Clone the node to avoid modifying the scene
	const clonedNode = node.clone(true)

	// Note: Material restoration temporarily disabled to preserve original materials
	// restoreOriginalMaterials(clonedNode, node)

	// 3. Calculate Bounding Box
	const box = new THREE.Box3().setFromObject(node)
	const center = box.getCenter(new THREE.Vector3())
	const size = box.getSize(new THREE.Vector3())

	// 4. Bake transforms into clone
	processNodeForBaking(node, clonedNode, center)

	// 5. Create Metadata JSON
	const metadata: ExtractionMetadata = {
		name: node.name || 'Extracted Node',
		originalPath: getNodePath(node),
		originalWorldMatrix: worldMatrix,
		worldCenter: {
			x: center.x,
			y: center.y,
			z: center.z
		},
		restoreMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, center.x, center.y, center.z, 1],
		note: '使用 restoreMatrix 將烘培後的模型放回原位。請勿直接使用 originalWorldMatrix，因為會重複套用縮放。',
		size: {
			x: Number((size.x * 100).toFixed(1)),
			y: Number((size.y * 100).toFixed(1)),
			z: Number((size.z * 100).toFixed(1)),
			unit: 'cm'
		}
	}

	return { clonedNode, metadata, originalNode: node }
}

/**
 * Applies a 90-degree rotation to the extracted node around the specified axis.
 * This modifies the clonedNode's geometry directly (bakes the rotation).
 */
export function applyRotationToExtractedNode(
	clonedNode: THREE.Object3D,
	axis: 'x' | 'y' | 'z'
): void {
	const rotationMatrix = new THREE.Matrix4()
	const angle = Math.PI / 2 // 90 degrees

	switch (axis) {
		case 'x':
			rotationMatrix.makeRotationX(angle)
			break
		case 'y':
			rotationMatrix.makeRotationY(angle)
			break
		case 'z':
			rotationMatrix.makeRotationZ(angle)
			break
	}

	// Apply rotation to all geometries in the clone
	clonedNode.traverse((child) => {
		if (child instanceof THREE.Mesh && child.geometry) {
			child.geometry.applyMatrix4(rotationMatrix)
		}
	})
}

/**
 * Packages the extraction data into a ZIP and triggers download.
 */
export async function packageAndDownload(
	extractionData: ExtractionData,
	filename: string = 'model'
): Promise<void> {
	const zip = new JSZip()
	const { clonedNode, metadata } = extractionData

	// Generate GLB
	const exporter = new GLTFExporter()
	const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
		exporter.parse(
			clonedNode,
			(gltf) => resolve(gltf as ArrayBuffer),
			(err) => reject(err),
			{ binary: true }
		)
	})

	// Zip and Download
	zip.file('model.glb', glbBuffer)
	zip.file('metadata.json', JSON.stringify(metadata, null, 2))

	const content = await zip.generateAsync({ type: 'blob' })
	downloadBlob(content, `${filename}.zip`)
}

/**
 * Legacy function for backward compatibility.
 * Directly extracts, bakes, and downloads in one step.
 */
export async function extractAndBakeNode(
	node: THREE.Object3D,
	filename: string = 'model'
): Promise<void> {
	const extractionData = prepareExtraction(node)
	await packageAndDownload(extractionData, filename)
}

function processNodeForBaking(
	original: THREE.Object3D,
	clone: THREE.Object3D,
	center: THREE.Vector3
) {
	// If it's a mesh, bake geometry
	if (original instanceof THREE.Mesh && clone instanceof THREE.Mesh) {
		if (clone.geometry) {
			// 1. Get new unique geometry (clone it)
			const newGeom = clone.geometry.clone()

			// 2. Apply Full World Transform of the ORIGINAL object
			original.updateMatrixWorld(true)
			newGeom.applyMatrix4(original.matrixWorld)

			// 3. Center it (Position Baking)
			newGeom.translate(-center.x, -center.y, -center.z)

			clone.geometry = newGeom
		}
	}

	// Reset Transform of the clone (since geometry now has world pos baked in)
	clone.position.set(0, 0, 0)
	clone.rotation.set(0, 0, 0)
	clone.scale.set(1, 1, 1)
	clone.updateMatrix()

	// Recursively process children
	// We assume children array length and order remains identical between original and clone
	for (let i = 0; i < original.children.length; i++) {
		processNodeForBaking(original.children[i], clone.children[i], center)
	}
}

function getNodePath(node: THREE.Object3D): string {
	const path: string[] = []
	let current: THREE.Object3D | null = node
	while (current) {
		if (current.name) path.unshift(current.name)
		if (current.parent && current.parent.type !== 'Scene') {
			current = current.parent
		} else {
			current = null
		}
	}
	return path.join('/')
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

/**
 * Restores original materials to the cloned node (removes X-ray transparency effect).
 * This ensures extracted models use opaque materials instead of semi-transparent ones.
 */
function restoreOriginalMaterials(clonedNode: THREE.Object3D, originalNode: THREE.Object3D): void {
	try {
		// Create a map of original meshes by UUID for quick lookup
		const originalMeshes = new Map<string, THREE.Mesh>()
		originalNode.traverse((child) => {
			if (child instanceof THREE.Mesh) {
				originalMeshes.set(child.uuid, child)
			}
		})

		clonedNode.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material) {
				try {
					// Find the corresponding original mesh
					const originalMesh = originalMeshes.get(child.uuid)

					// Handle array of materials
					if (Array.isArray(child.material)) {
						const materials = child.material
						child.material = materials.map((mat, index) => {
							try {
								// If original mesh has originalMaterial in userData, use it
								if (
									originalMesh?.userData.originalMaterial &&
									Array.isArray(originalMesh.userData.originalMaterial) &&
									typeof originalMesh.userData.originalMaterial[index]?.clone === 'function'
								) {
									return originalMesh.userData.originalMaterial[index].clone()
								}
								// Otherwise, ensure material is opaque
								if (mat.transparent && mat.opacity < 1) {
									const restoredMaterial = mat.clone()
									restoredMaterial.transparent = false
									restoredMaterial.opacity = 1
									return restoredMaterial
								}
								return mat
							} catch (e) {
								console.warn('Failed to restore material in array:', e)
								return mat
							}
						})
					} else {
						// Handle single material
						const material = child.material as THREE.Material
						// If original mesh has originalMaterial in userData, use it
						if (
							originalMesh?.userData.originalMaterial &&
							!Array.isArray(originalMesh.userData.originalMaterial) &&
							typeof originalMesh.userData.originalMaterial.clone === 'function'
						) {
							child.material = originalMesh.userData.originalMaterial.clone()
						} else if (material.transparent && material.opacity < 1) {
							// Otherwise, ensure material is opaque
							const restoredMaterial = material.clone()
							restoredMaterial.transparent = false
							restoredMaterial.opacity = 1
							child.material = restoredMaterial
						}
					}
				} catch (e) {
					console.warn('Failed to restore material for mesh:', child.name, e)
				}
			}
		})
	} catch (e) {
		console.error('Failed to restore original materials:', e)
	}
}
