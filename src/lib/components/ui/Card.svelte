<script>
	export let title = '';
	export let icon = '';
	export let headerClass = '';
	export let bodyClass = '';
	export let noPadding = false;
	export let count = null;
</script>

<div class="card mb-4">
	{#if title || icon || $$slots.header}
		<div class="card-header {headerClass}">
			{#if $$slots.header}
				<slot name="header" />
			{:else}
				<h5 class="card-title mb-0">
					{#if icon}
						<i class="fas {icon} me-2"></i>
					{/if}
					{title}
					{#if count !== null}
						<span class="text-muted ms-2">({count})</span>
					{/if}
				</h5>
			{/if}
		</div>
	{/if}
	<div class="card-body {bodyClass}" class:p-0={noPadding}>
		<slot />
	</div>
</div>