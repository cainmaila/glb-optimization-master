import { describe, it, expect, beforeEach } from 'vitest'
import * as THREE from 'three'
import { applyStructureUpdates, findObjectByPath } from './structureImport'

describe('structureImport Utils', () => {
	let root: THREE.Group
	let childA: THREE.Mesh
	let childB: THREE.Mesh
	let grandChild: THREE.Mesh

	beforeEach(() => {
		// Setup a simple scene graph
		// Root (Scene)
		//   - ChildA
		//      - GrandChild
		//   - ChildB
		root = new THREE.Group()
		root.name = 'Scene'

		childA = new THREE.Mesh()
		childA.name = 'ChildA'

		grandChild = new THREE.Mesh()
		grandChild.name = 'GrandChild'
		childA.add(grandChild)

		childB = new THREE.Mesh()
		childB.name = 'ChildB'

		root.add(childA)
		root.add(childB)
	})

	it('findObjectByPath finds objects correctly', () => {
		expect(findObjectByPath(root, 'Scene/ChildA')).toBe(childA)
		expect(findObjectByPath(root, 'Scene/ChildA/GrandChild')).toBe(grandChild)
		expect(findObjectByPath(root, 'Scene/ChildB')).toBe(childB)

		// Test assuming root is not in path but is the context
		expect(findObjectByPath(root, 'ChildA')).toBe(childA)
	})

	it('applyStructureUpdates renames objects bottom-up', () => {
		// Prepare import nodes with new names
		// We want to rename:
		// ChildA -> NewChildA
		// GrandChild -> NewGrandChild

		// Path MUST be the *original* path because we find objects by the path stored in JSON
		const importNodes = [
			{
				name: 'NewChildA', // Intent to rename
				path: 'Scene/ChildA',
				type: 'Mesh',
				matrix: [],
				children: [
					{
						name: 'NewGrandChild', // Intent to rename
						path: 'Scene/ChildA/GrandChild',
						type: 'Mesh',
						matrix: [],
						children: []
					}
				]
			},
			{
				name: 'ChildB', // No change
				path: 'Scene/ChildB',
				type: 'Mesh',
				matrix: [],
				children: []
			}
		]

		applyStructureUpdates(root, importNodes)

		expect(grandChild.name).toBe('NewGrandChild')
		expect(childA.name).toBe('NewChildA')
		expect(childB.name).toBe('ChildB')
	})

	it('applyStructureUpdates handles non-matching paths gracefully', () => {
		const importNodes = [
			{
				name: 'NonExistent',
				path: 'Scene/Ghost',
				type: 'Mesh',
				matrix: [],
				children: []
			}
		]

		// Should not throw
		applyStructureUpdates(root, importNodes)
		expect(true).toBe(true)
	})
})
