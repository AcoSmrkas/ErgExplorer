<script>
	export let size = 'md';
	export let text = 'Loading...';
</script>

<div class="loading-container">
	<div class="spinner-container">
		<img src="/images/logo-new.png" alt="Loading" class="loading-logo {size} animate-pulse-logo">
	</div>
	{#if text}
		<p class="loading-text">{text}</p>
	{/if}
</div>

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}
	
	.spinner-container {
		margin-bottom: 1rem;
	}
	
	/* Animation applied via global class animate-pulse-logo */
	
	.loading-logo.sm {
		width: 32px;
		height: 32px;
	}
	
	.loading-logo.md {
		width: 48px;
		height: 48px;
	}
	
	.loading-logo.lg {
		width: 64px;
		height: 64px;
	}
	
	.loading-text {
		color: var(--bs-secondary-color);
		margin: 0;
		font-size: 0.9rem;
	}
	
	/* Global keyframes defined in common-components.css */
</style>