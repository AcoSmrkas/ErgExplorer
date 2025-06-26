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
	<nav aria-label="Page navigation">
		<ul class="pagination pagination-sm justify-content-center">
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
	.page-link {
		color: var(--main-color);
		border-color: var(--main-color);
		background: none;
	}
	
	.page-link:hover {
		color: white;
		background-color: var(--main-color);
		border-color: var(--main-color);
	}
	
	.page-item.active .page-link {
		background-color: var(--main-color);
		border-color: var(--main-color);
		color: white;
	}
	
	.page-item.disabled .page-link {
		color: var(--bs-secondary-color);
		background-color: transparent;
		border-color: var(--bs-border-color);
	}
</style>