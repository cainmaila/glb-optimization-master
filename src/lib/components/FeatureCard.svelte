<script lang="ts">
	import { ChevronRight } from 'lucide-svelte'

	interface Props {
		title: string
		description: string
		href: string
		icon: string
		status?: 'ready' | 'coming-soon'
		iconBgColor?: string
	}

	let {
		title,
		description,
		href,
		icon,
		status = 'ready',
		iconBgColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
	}: Props = $props()

	const isDisabled = $derived(status === 'coming-soon')
</script>

<a {href} class="card" class:disabled={isDisabled} aria-disabled={isDisabled}>
	<div class="icon-container" style="--icon-bg: {iconBgColor}">
		{#if icon.startsWith('<')}
			{@html icon}
		{:else}
			<span>{icon}</span>
		{/if}
	</div>

	<div class="card-content">
		<h3>{title}</h3>
		<p>{description}</p>

		{#if status === 'coming-soon'}
			<span class="badge badge-soon">Coming Soon</span>
		{:else}
			<span class="badge badge-ready">Ready</span>
		{/if}
	</div>

	<div class="card-footer">
		<span class="link-text">
			{status === 'coming-soon' ? 'Learn More' : 'Launch Tool'}
			<ChevronRight size={16} />
		</span>
	</div>
</a>

<style>
	.card {
		display: flex;
		flex-direction: column;
		padding: 2rem;
		background: rgba(255, 255, 255, 0.02);
		backdrop-filter: blur(20px);
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		text-decoration: none;
		color: #fff;
		transition: all 0.3s ease;
		cursor: pointer;
		position: relative;
		overflow: hidden;
	}

	.card:not(.disabled):hover {
		transform: translateY(-4px) scale(1.01);
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 12px 48px rgba(0, 0, 0, 0.3);
	}

	.card.disabled {
		opacity: 0.6;
		cursor: not-allowed;
		pointer-events: none;
	}

	.icon-container {
		width: 64px;
		height: 64px;
		border-radius: 12px;
		background: var(--icon-bg);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
		font-size: 2rem;
	}

	.card-content {
		flex: 1;
	}

	h3 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
		color: #fff;
	}

	p {
		font-size: 0.95rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.7);
		margin: 0 0 1rem 0;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge-ready {
		background: rgba(16, 185, 129, 0.2);
		color: #10b981;
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	.badge-soon {
		background: rgba(251, 191, 36, 0.2);
		color: #fbbf24;
		border: 1px solid rgba(251, 191, 36, 0.3);
	}

	.card-footer {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.link-text {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
		transition: gap 0.2s ease;
	}

	.card:hover .link-text {
		gap: 0.75rem;
	}
</style>
