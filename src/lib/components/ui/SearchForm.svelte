<script>
	import { goto } from '$app/navigation';

	let searchInput = '';
	let searchType = '*';

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}

	async function handleSearch() {
		if (!searchInput.trim()) return;

		const input = searchInput.trim();
		
		// Auto-detect search type if set to auto
		if (searchType === '*') {
			const detectedType = detectSearchType(input);
			await performSearch(input, detectedType);
		} else {
			await performSearch(input, searchType);
		}
	}

	function detectSearchType(input) {
		// Address detection (P2PK addresses start with '9', P2S addresses vary)
		if (input.match(/^[1-9A-HJ-NP-Za-km-z]{48,}$/)) {
			return '0'; // Address
		}
		
		// Transaction ID detection (64 hex characters)
		if (input.match(/^[a-fA-F0-9]{64}$/)) {
			return '1'; // Transaction
		}
		
		// Token ID detection (64 hex characters, same as transaction but different context)
		if (input.match(/^[a-fA-F0-9]{64}$/)) {
			return '2'; // Token (will also check transactions)
		}
		
		// Block ID or height detection
		if (input.match(/^[a-fA-F0-9]{64}$/) || input.match(/^\d+$/)) {
			return '3'; // Block
		}
		
		// Box ID detection (64 hex characters)
		if (input.match(/^[a-fA-F0-9]{64}$/)) {
			return '4'; // Box
		}
		
		// Default to address if nothing else matches
		return '0';
	}

	async function performSearch(query, type) {
		switch (type) {
			case '0': // Address
				await goto(`/addresses/${query}`);
				break;
			case '1': // Transaction
				await goto(`/transactions/${query}`);
				break;
			case '2': // Token
				await goto(`/tokens/${query}`);
				break;
			case '3': // Block
				if (query.match(/^\d+$/)) {
					// Block height
					await goto(`/blocks/${query}`);
				} else {
					// Block ID
					await goto(`/blocks/${query}`);
				}
				break;
			case '4': // Box
				await goto(`/boxes/${query}`);
				break;
			default:
				await goto(`/addresses/${query}`);
		}
		
		// Clear search input after search
		searchInput = '';
	}
</script>

<div class="d-flex justify-content-center align-items-center h-100 mb-3 mb-md-4">
	<div class="row w-100">
		<div class="col-sm-12 col-md-12 mx-auto p-0">
			<div class="search-wrapper">
				<div class="input-group mb-0 w-100">
					<input 
						id="searchInput"
						bind:value={searchInput}
						onkeydown={handleKeydown}
						type="text" 
						class="form-control form-control-lg" 
						placeholder="Search for"
					>
					<select id="searchType" bind:value={searchType} class="form-select form-control form-control-lg">
						<option value="*">Auto</option>
						<option value="0">Address</option>
						<option value="1">Transaction</option>
						<option value="2">Token</option>
						<option value="3">Block</option>
						<option value="4">Box</option>
					</select>
					<!-- svelte-ignore a11y_consider_explicit_label -->
					<button onclick={handleSearch} class="btn btn-lg btn-primary" type="button">
						<i class="fas fa-search"></i>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.search-wrapper {
		border-radius: 8px;
		box-shadow: var(--glass-shadow-sm);
		overflow: hidden;
		transition: box-shadow 0.15s ease-in-out;
	}

	.search-wrapper:focus-within {
		box-shadow: 0 0 0 1px rgba(var(--main-color-rgb), 1), var(--glass-shadow-sm);
	}

	/* Remove border when button is focused */
	.search-wrapper:has(button:focus) {
		box-shadow: var(--glass-shadow-sm);
	}

	.form-control,
	.form-select {
		border: none;
		outline: none !important;
		box-shadow: none !important;
	}

	.form-control:focus,
	.form-select:focus {
		box-shadow: none !important;
		outline: none !important;
	}

	.btn:focus {
		box-shadow: none !important;
		outline: none !important;
	}

	/* Fix overlapping elements in input-group */
	.input-group .form-control:first-child {
		border-top-left-radius: 8px !important;
		border-bottom-left-radius: 8px !important;
		border-top-right-radius: 0 !important;
		border-bottom-right-radius: 0 !important;
		margin-right: 1px;
	}

	.input-group .form-select {
		border-radius: 0 !important;
		box-shadow: none !important;
		border: none;
	}

	select, option {
		text-align: end;
	}

	/* Responsive widths for search input */
	@media only screen and (min-width: 0px) {
		#searchInput {
			min-width: 45%;
		}
	}

	@media only screen and (min-width: 576px) {
		#searchInput {
			min-width: 65%;
		}
	}

	@media only screen and (min-width: 768px) {
		#searchInput {
			min-width: 65%;
		}
	}

	@media only screen and (min-width: 992px) {
		#searchInput {
			min-width: 75%;
		}
	}

	@media only screen and (min-width: 1200px) {
		#searchInput {
			min-width: 80%;
		}
	}
</style>
