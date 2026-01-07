<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte'

	interface Props {
		title: string
	}

	let { title }: Props = $props()
</script>

<div class="header">
	<a href="/" class="back-link">
		<ArrowLeft size={16} /> Back to Home
	</a>
	<h1>{title}</h1>
</div>

<style>
	.header {
		margin-bottom: 2rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		font-size: 0.9rem;
		margin-bottom: 1rem;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: #fff;
	}

	h1 {
		font-size: 2.5rem;
		font-weight: 200;
		margin: 0;
		letter-spacing: 0.05em;
		background: linear-gradient(135deg, #fff 0%, #f093fb 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	@media (max-width: 640px) {
		h1 {
			font-size: 2rem;
		}
	}
</style>
