<script>
	import { createEventDispatcher } from 'svelte';
	
	export let currentPage = 1;
	export let totalPages = 1;
	export let maxVisible = 5;
	
	const dispatch = createEventDispatcher();
	
	$: startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
	$: endPage = Math.min(totalPages, startPage + maxVisible - 1);
	$: pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
	
	function goToPage(page) {
		if (page >= 1 && page <= totalPages && page !== currentPage) {
			dispatch('pageChange', { page });
		}
	}
</script>

{#if totalPages > 1}
	<nav aria-label="Page navigation" class="glass-pagination">
		<ul class="pagination pagination-sm justify-content-center glass-pagination-list">
			<li class="page-item" class:disabled={currentPage === 1}>
				<button class="page-link" onclick={() => goToPage(1)} disabled={currentPage === 1}>
					<i class="fas fa-angle-double-left"></i>
				</button>
			</li>
			<li class="page-item" class:disabled={currentPage === 1}>
				<button class="page-link" onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
					<i class="fas fa-angle-left"></i>
				</button>
			</li>
			
			{#each pages as page}
				<li class="page-item" class:active={page === currentPage}>
					<button class="page-link" onclick={() => goToPage(page)}>
						{page}
					</button>
				</li>
			{/each}
			
			<li class="page-item" class:disabled={currentPage === totalPages}>
				<button class="page-link" onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
					<i class="fas fa-angle-right"></i>
				</button>
			</li>
			<li class="page-item" class:disabled={currentPage === totalPages}>
				<button class="page-link" onclick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
					<i class="fas fa-angle-double-right"></i>
				</button>
			</li>
		</ul>
	</nav>
{/if}

<style>
	.glass-pagination {
		padding: 1rem 0;
	}
	
	.glass-pagination-list {
		margin-bottom: 0;
		gap: 0.5rem;
	}
	
	.page-link {
		color: var(--text-strong);
		border: 1px solid var(--glass-border-light);
		background: var(--glass-bg-subtle);
		backdrop-filter: var(--glass-blur-sm);
		-webkit-backdrop-filter: var(--glass-blur-sm);
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
		font-weight: 500;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		min-width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.page-link:hover {
		color: white;
		background: var(--main-color);
		border-color: var(--main-color);
		transform: translateY(-2px);
		box-shadow: var(--glass-shadow-md);
	}
	
	.page-item.active .page-link {
		background: var(--main-color);
		border-color: var(--main-color);
		color: white;
		box-shadow: var(--glass-shadow-sm);
	}
	
	.page-item.disabled .page-link {
		color: var(--text-light);
		background: var(--glass-bg-subtle);
		border-color: var(--glass-border-light);
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.page-item.disabled .page-link:hover {
		transform: none;
		box-shadow: none;
		background: var(--glass-bg-subtle);
		color: var(--text-light);
	}
	
	.page-item {
		margin: 0;
	}
	
	@media (max-width: 768px) {
		.glass-pagination {
			padding: 0.75rem 1rem;
		}
		
		.page-link {
			padding: 0.4rem 0.6rem;
			min-width: 2rem;
			height: 2rem;
			font-size: 0.9rem;
		}
		
		.glass-pagination-list {
			gap: 0.25rem;
		}
	}
</style>