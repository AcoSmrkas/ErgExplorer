<script>
	export let text = ''; // Text to copy to clipboard
	export let label = 'Copy to clipboard'; // Accessibility label
	export let successMessage = 'Copied to clipboard!'; // Success toast message
	export let errorMessage = 'Failed to copy to clipboard.'; // Error toast message
	export let buttonClass = 'copy-btn'; // CSS class for styling
	export let size = 'normal'; // Size variant: 'small', 'normal', 'large'
	export let inline = false; // Whether to use inline styling
	
	// Copy text to clipboard
	function copyToClipboard(event) {
		event.preventDefault();
		event.stopPropagation();
		
		if (text && navigator.clipboard) {
			navigator.clipboard.writeText(text).then(() => {
				showToast(successMessage);
			}).catch(err => {
				console.error('Failed to copy to clipboard:', err);
				showToast(errorMessage);
			});
		}
	}
	
	// Show toast notification using global toast system
	function showToast(message) {
		if (typeof window !== 'undefined' && window.showToast) {
			const toastBody = document.getElementById('toastBody');
			if (toastBody) {
				toastBody.innerHTML = message;
			}
			window.showToast();
		}
	}
	
	// Determine final CSS class based on props
	$: finalClass = inline ? 'btn-icon copy-btn-inline' : `btn-icon ${buttonClass}`;
	$: sizeClass = size === 'small' ? 'copy-btn-small' : size === 'large' ? 'copy-btn-large' : '';
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<button 
	class="{finalClass} {sizeClass}" 
	onclick={copyToClipboard} 
	title={label}
	disabled={!text}
>
	<i class="fas fa-copy"></i>
</button>

<style>
	/* Component-specific variations on top of global .btn-icon class */
	
	/* Inline variant */
	.copy-btn-inline {
		padding: 2px 4px;
		font-size: 0.7em;
		opacity: 0.7;
		margin-left: 6px;
	}
	
	.copy-btn-inline:hover:not(:disabled) {
		transform: scale(1.1);
	}
	
	/* Size variants */
	.copy-btn-small {
		padding: 2px 4px;
		font-size: 0.7em;
	}
	
	.copy-btn-large {
		padding: 6px 8px;
		font-size: 0.9em;
	}
	
	/* Base styles inherited from global .btn-icon class */
</style>