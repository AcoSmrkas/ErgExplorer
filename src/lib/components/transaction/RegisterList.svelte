<script>
	import CopyButton from '$lib/components/ui/CopyButton.svelte';
	
	export let registers = [];
	export let expanded = false;
	
	// Toggle function
	export function toggle() {
		expanded = !expanded;
	}
</script>

{#if registers.length > 0}
	<div class="registers-field">
		<div class="field-label">
			<button 
				class="registers-toggle"
				on:click={toggle}
				aria-expanded={expanded}
			>
				<span class="toggle-icon">{expanded ? '▼' : '▶'}</span>
				Additional registers ({registers.length}):
			</button>
		</div>
		{#if expanded}
			<div class="registers-list w-100">
				{#each registers as register}
					<div class="register-item">
						<span class="register-key">{register.key}:</span>
						<div class="d-flex flex-row w-100">
							<div class="register-content flex-grow-1">
								<div class="register-type-line">
									<span class="register-type" title={register.typeDescription}>
										({register.actualType || register.type})
									</span>
									{#if register.parseError}
										<span class="parse-error" title={register.parseError}>⚠️</span>
									{/if}
								</div>
								
								{#if register.parsed}
									<div class="parsed-value">
										<span class="parsed-label">Parsed:</span>
										<pre class="parsed-content" title={register.parsed}>{register.parsed}</pre>
									</div>
								{/if}
								
								<div class="raw-value">
									<span class="raw-label">Raw:</span>
									<span class="register-value" title={register.value}>
										{register.value}
									</span>
								</div>
								
								{#if register.parseError}
									<div class="error-details">
										<span class="error-label">Error:</span>
										<span class="error-message">{register.parseError}</span>
									</div>
								{/if}
							</div>
							<CopyButton 
								text={register.parsed || register.value} 
								size="small" 
								inline={true}
								label="Copy register value"
							/>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.registers-field {
		flex-direction: column;
		align-items: stretch;
		gap: 0.3rem;
		margin-top: 0.3rem;
	}
	
	.field-label {
		align-self: flex-start;
		width: 100%;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-light);
		text-transform: uppercase;
		letter-spacing: 0.3px;
		min-width: 200px;
		flex-shrink: 0;
	}
	
	.registers-toggle {
		background: none;
		border: none;
		color: var(--text-light);
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.3px;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		transition: color 0.2s ease;
	}
	
	.registers-toggle:hover {
		color: var(--main-color);
	}
	
	.toggle-icon {
		font-size: 0.6rem;
		line-height: 1;
		color: var(--main-color);
		transition: transform 0.2s ease;
	}
	
	.registers-list {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: 0.2rem;
	}
	
	.register-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.5rem;
		background: var(--glass-bg);
		border: 1px solid var(--glass-border-light);
		border-radius: 4px;
		font-size: 0.75rem;
	}
	
	.register-key {
		font-weight: 600;
		color: var(--main-color);
		min-width: 2rem;
		font-family: 'Courier New', Monaco, monospace;
	}
	
	.register-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.register-type-line {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.register-type {
		font-size: 0.7rem;
		color: var(--text-light);
		font-style: italic;
		cursor: help;
	}
	
	.parse-error {
		font-size: 0.8rem;
		cursor: help;
	}
	
	.parsed-value, .raw-value, .error-details {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-top: 0.2rem;
	}
	
	.parsed-label, .raw-label, .error-label {
		font-size: 0.65rem;
		color: var(--text-light);
		font-weight: 600;
		text-transform: uppercase;
		min-width: 50px;
		flex-shrink: 0;
		text-align: left;
	}
	
	.error-label {
		color: #ef4444;
	}
	
	.error-message {
		font-family: 'Courier New', Monaco, monospace;
		color: #ef4444;
		word-break: break-all;
		font-size: 0.7rem;
		flex: 1;
	}
	
	.parsed-content {
		font-family: 'Courier New', Monaco, monospace;
		color: var(--text-strong);
		word-break: break-all;
		font-size: 0.75rem;
		background: rgba(var(--main-color-rgb), 0.1);
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		flex: 1;
		margin: 0;
		white-space: pre-wrap;
		overflow-x: auto;
		max-height: 200px;
		overflow-y: auto;
	}
	
	.register-value {
		font-family: 'Courier New', Monaco, monospace;
		color: var(--text-muted);
		word-break: break-all;
		font-size: 0.7rem;
		flex: 1;
	}
	
	/* Responsive adjustments */
	@media (max-width: 768px) {
		.register-item {
			padding: 0.25rem 0.4rem;
			font-size: 0.7rem;
		}
	}
</style>