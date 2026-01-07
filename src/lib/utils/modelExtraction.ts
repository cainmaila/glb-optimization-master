import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import JSZip from 'jszip'

interface ExtractionMetadata {
	name: string
	originalPath: string // Placeholder for now, or can be passed in
	worldMatrix: number[] // Array of 16 numbers
	size: { x: number; y: number; z: number; unit: string } // Dimensions
}

export async function extractAndBakeNode(
	node: THREE.Object3D,
	filename: string = 'model'
): Promise<void> {
	const zip = new JSZip()

	// 1. Calculate World Matrix (before modification)
	// This is the matrix needed to place the cleaned model back into the world
	node.updateMatrixWorld(true)
	const worldMatrix = node.matrixWorld.toArray()

	// 2. Clone the node to avoid modifying the scene
	// We utilize the clone to apply transformations
	const clonedNode = node.clone(true)

	// 3. Bake Transforms

	// Step 3.1: Calculate Bounding Box of the CLONED (but originally transformed) hierarchy

	const box = new THREE.Box3().setFromObject(node) // Use ORIGINAL node for accurate world bounds
	const center = box.getCenter(new THREE.Vector3())
	const size = box.getSize(new THREE.Vector3())

	// We will traverse the CLONE.
	// For every Mesh, we want to apply its total World Transform (from the original scene) into the Geometry,
	// THEN subtract the 'center' offset.

	processNodeForBaking(node, clonedNode, center)

	// 4. Generate GLB
	const exporter = new GLTFExporter()
	const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
		exporter.parse(
			clonedNode,
			(gltf) => resolve(gltf as ArrayBuffer),
			(err) => reject(err),
			{ binary: true }
		)
	})

	// 5. Create Metadata JSON
	const metadata: ExtractionMetadata = {
		name: node.name || 'Extracted Node',
		originalPath: getNodePath(node),
		worldMatrix: worldMatrix, // The original transformation
		size: {
			x: Number((size.x * 100).toFixed(1)),
			y: Number((size.y * 100).toFixed(1)),
			z: Number((size.z * 100).toFixed(1)),
			unit: 'cm'
		}
	}

	// 6. Zip and Download
	zip.file('model.glb', glbBuffer)
	zip.file('metadata.json', JSON.stringify(metadata, null, 2))

	const content = await zip.generateAsync({ type: 'blob' })
	downloadBlob(content, `${filename}.zip`)
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
