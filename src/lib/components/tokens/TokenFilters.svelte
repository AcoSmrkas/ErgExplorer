<script>
	import { isTestnet } from '$lib/stores/network.svelte.js';

	export let query = '';
	export let tokenType = 'all';
	export let orderBy = 'recent';
	export let hideUtility = false;
	export let hideBurned = false;
	export let onFilterChange = () => {};
	export let onSearch = () => {};

	const tokenTypes = [
		{ value: 'all', label: 'All' },
		{ value: 'token', label: 'Token' },
		{ value: 'nft', label: 'NFT' },
		{ value: 'image', label: 'Image' },
		{ value: 'audio', label: 'Audio' },
		{ value: 'video', label: 'Video' },
		{ value: 'artcollection', label: 'Art Collection' },
		{ value: 'file', label: 'File' },
		{ value: 'membership', label: 'Membership' }
	];

	const orderOptions = [
		{ value: 'recent', label: 'Recently Issued' },
		{ value: 'nameAsc', label: 'Alphabetical: A to Z' },
		{ value: 'nameDesc', label: 'Alphabetical: Z to A' }
	];

	function handleSearch(event) {
		if (event.key === 'Enter') {
			onFilterChange();
		}
	}
</script>

<!-- Filters -->
<div class="row mb-4 p-0">
	<div class="col-md-4 ps-unset ps-md-0 mb-2 mb-md-unset">
		<label class="form-label" for="query">Search:</label>
		<div class="input-group">
			<input 
				bind:value={query}
				on:keydown={handleSearch}
				type="text" 
				class="form-control" 
				id="query"
				placeholder="Search tokens..."
			>
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<button class="btn btn-primary" type="button" on:click={onFilterChange}>
				<i class="fas fa-search"></i>
			</button>
		</div>
	</div>
	<div class="col-md-2 mb-2 mb-md-unset">
		<label class="form-label" for="tokenType">Filter:</label>
		<select bind:value={tokenType} class="form-select" id="tokenType" on:change={onFilterChange}>
			{#each tokenTypes as type}
				<option value={type.value}>{type.label}</option>
			{/each}
		</select>
	</div>
	<div class="col-md-2 mb-2 mb-md-unset">
		<label class="form-label" for="orderBy">Order:</label>
		<select bind:value={orderBy} class="form-select" id="orderBy" on:change={onFilterChange}>
			{#each orderOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</div>
	{#if !isTestnet()}
		<div class="col-md-4 pe-unset pe-md-0">
			<label class="form-label">Options:</label>
			<div class="d-flex gap-3 mt-1">
				<div class="form-check">
					<input 
						bind:checked={hideUtility}
						on:change={onFilterChange}
						class="form-check-input" 
						type="checkbox" 
						id="hideUtility"
					>
					<label class="form-check-label" for="hideUtility">
						Hide utility
					</label>
				</div>
				<div class="form-check">
					<input 
						bind:checked={hideBurned}
						on:change={onFilterChange}
						class="form-check-input" 
						type="checkbox" 
						id="hideBurned"
					>
					<label class="form-check-label" for="hideBurned">
						Hide burned
					</label>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Form styling */
	.form-check-input:checked {
		background-color: var(--main-color);
		border-color: var(--main-color);
	}
</style>