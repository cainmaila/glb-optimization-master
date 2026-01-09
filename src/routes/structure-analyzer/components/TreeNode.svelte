<script lang="ts">
	import { ChevronRight, FolderOpen, Box } from 'lucide-svelte'
	import type { TreeNode as TreeNodeType } from '$lib/types/structure'
	import { structureStore } from '../stores/structureStore.svelte'
	import TreeNodeComponent from './TreeNode.svelte'

	interface Props {
		node: TreeNodeType
		level?: number
		onSelect: (id: string) => void
	}

	let { node, level = 0, onSelect }: Props = $props()

	let isExpanded = $state(false)

	// 第一層預設展開
	$effect(() => {
		if (level === 0) {
			isExpanded = true
		}
	})

	const selectedNodeId = $derived(structureStore.selectedNodeId)
	const isSelected = $derived(selectedNodeId === node.id)

	function handleClick(e: MouseEvent) {
		e.stopPropagation()
		onSelect(node.id)
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			onSelect(node.id)
		}
	}

	function toggleExpand(e: MouseEvent) {
		e.stopPropagation()
		isExpanded = !isExpanded
	}
</script>

<li class="tree-node">
	<div
		class="node-content"
		class:selected={isSelected}
		style="padding-left: {level * 1.5}rem"
		role="button"
		tabindex="0"
		onclick={handleClick}
		onkeydown={handleKeydown}
	>
		<!-- 展開/收合按鈕 -->
		{#if node.children.length > 0}
			<button class="expand-btn" class:expanded={isExpanded} onclick={toggleExpand}>
				<ChevronRight size={14} />
			</button>
		{:else}
			<span class="spacer"></span>
		{/if}

		<!-- 圖標 -->
		{#if node.type === 'Group'}
			<FolderOpen size={16} />
		{:else if node.type === 'Mesh'}
			<Box size={16} />
		{:else}
			<div class="icon-placeholder"></div>
		{/if}

		<!-- 名稱 -->
		<span class="node-name">{node.name}</span>

		<!-- 類型標籤 -->
		<span class="node-type">{node.type}</span>
	</div>

	<!-- 子節點 -->
	{#if node.children.length > 0}
		<ul class="children" class:collapsed={!isExpanded}>
			{#each node.children as child (child.id)}
				<TreeNodeComponent node={child} level={level + 1} {onSelect} />
			{/each}
		</ul>
	{/if}
</li>

<style>
	.tree-node {
		list-style: none;
	}

	.node-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.5rem;
		cursor: pointer;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.node-content:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.node-content.selected {
		background: rgba(102, 126, 234, 0.3);
		border-left: 3px solid #667eea;
	}

	.expand-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		padding: 0;
		display: flex;
		transition: transform 0.2s;
	}

	.expand-btn.expanded {
		transform: rotate(90deg);
	}

	.spacer {
		width: 14px;
	}

	.icon-placeholder {
		width: 16px;
		height: 16px;
	}

	.node-name {
		flex: 1;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.9);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.node-type {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
	}

	.children {
		margin: 0;
		padding: 0;
		overflow: hidden;
		transition:
			max-height 0.3s ease-out,
			opacity 0.3s;
		max-height: 5000px;
		opacity: 1;
	}

	.children.collapsed {
		max-height: 0;
		opacity: 0;
	}
</style>
