<script>
	export let label;
	export let value = null;
	export let href = null;
	export let dataAttribute = null;
	export let dataValue = null;
	export let copyable = false;
	export let monospace = false;
</script>

<div class="info-row">
	<span class="info-label">{label}:</span>
	<span class="info-value" class:font-monospace={monospace}>
		{#if href}
			<a href={href} class="link-primary" {...dataAttribute && dataValue ? {[dataAttribute]: dataValue} : {}}>
				{value}
			</a>
		{:else}
			{value || 'N/A'}
		{/if}
	</span>
</div>

<style>
	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--glass-border-light);
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-label {
		font-weight: 500;
		color: var(--text-light);
		min-width: 120px;
		flex-shrink: 0;
	}

	.info-value {
		color: var(--text-strong);
		text-align: right;
		word-break: break-word;
	}

	/* .link-primary styles are defined globally in common-components.css */

	/* Mobile optimizations */
	@media (max-width: 768px) {
		.info-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.info-label {
			min-width: auto;
		}

		.info-value {
			text-align: left;
		}
	}
</style>