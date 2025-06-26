<script>
	export let message = 'An error occurred';
	export let type = 'danger';
	export let dismissible = false;
	
	let visible = true;
	
	function dismiss() {
		visible = false;
	}
</script>

{#if visible}
	<div class="alert alert-{type}" class:alert-dismissible={dismissible} role="alert">
		<i class="fas fa-exclamation-triangle me-2"></i>
		{message}
		{#if dismissible}
			<button type="button" class="btn-close" onclick={dismiss} aria-label="Close"></button>
		{/if}
	</div>
{/if}

<style>
	.alert {
		border: none;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
</style>