<script>
	export let size = 'md';
	export let text = 'Loading...';
</script>

<div class="loading-container">
	<div class="spinner-container">
		<img src="/images/logo-new.png" alt="Loading" class="loading-logo {size}">
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
	
	.loading-logo {
		animation: pulse 2s ease-in-out infinite;
	}
	
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
	
	@keyframes pulse {
		0% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.6; transform: scale(1.05); }
		100% { opacity: 1; transform: scale(1); }
	}
</style>