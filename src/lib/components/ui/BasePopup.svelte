<script>
	import { fade } from 'svelte/transition';
	import CopyButton from './CopyButton.svelte';
	
	// Props
	export let visible = false;
	export let x = 0;
	export let y = 0;
	export let z = 1070;
	
	export let loading = false;
	
	// Header props
	export let icon = '';
	export let iconColor = 'text-info';
	export let title = '';
	export let copyText = '';
	export let copyLabel = 'Copy';
	export let copyMessage = 'Copied to clipboard!';
	
	// Footer props
	export let viewDetailsUrl = '';
	export let viewDetailsText = 'View Details';
	
	// Additional classes
	export let popupClass = '';
	
</script>

{#if visible}
	<div 
		class="popup-base {popupClass} show" 
		style="left: {x}px; top: {y}px; z-index: {z} !important;"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 150 }}
	>
		<!-- Header -->
		<div class="popup-header">
			<div class="popup-title">
				<slot name="header-icon">
					{#if icon}
						<i class="fas {icon} me-2 {iconColor}"></i>
					{/if}
				</slot>
				<span class="popup-title-text">
					{title}
				</span>
			</div>
			{#if copyText}
				<CopyButton 
					text={copyText}
					label={copyLabel}
					size="small"
					inline={true}
					successMessage={copyMessage}
				/>
			{/if}
		</div>
		
		<!-- Loading state -->
		{#if loading}
			<div class="popup-loading" in:fade={{ duration: 200 }}>
				<div class="popup-spinner"></div>
				<span>Loading...</span>
			</div>
		{/if}
		
		<!-- Main content slot -->
		<slot />
		
		<!-- Footer with view details -->
		{#if viewDetailsUrl}
			<div class="popup-actions">
				<a href={viewDetailsUrl} class="popup-link">
					<i class="fas fa-external-link-alt me-1"></i>
					{viewDetailsText}
				</a>
			</div>
		{/if}
	</div>
{/if}

<style>
	.popup-base {
		position: fixed;
		max-width: 320px;
		min-width: 280px;
		padding: 1rem;
		pointer-events: auto;
		border: 1px solid var(--glass-border-medium);
		backdrop-filter: var(--glass-blur-xl);
		-webkit-backdrop-filter: var(--glass-blur-xl);
		box-shadow: var(--glass-shadow-lg);
		background: var(--glass-bg);
		border-radius: 12px;
	}

	.popup-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--glass-border-light);
	}

	.popup-title {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
	}

	.popup-title-text {
		font-weight: 600;
		color: var(--text-strong);
		font-size: 0.9rem;
		word-break: break-word;
	}

	.popup-actions {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--glass-border-light);
		text-align: center;
	}

	.popup-link {
		color: var(--main-color);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 500;
		transition: color 0.3s ease;
	}

	.popup-link:hover {
		color: var(--main-color-hover);
		text-decoration: none;
	}

	.popup-loading {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
		color: var(--text-light);
		font-size: 0.85rem;
	}

	.popup-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid var(--glass-border-light);
		border-top: 2px solid var(--main-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>