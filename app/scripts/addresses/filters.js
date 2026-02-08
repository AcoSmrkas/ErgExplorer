import { FilterState, AddressState } from './state.js';

/**
 * Transaction filtering and export functionality
 * Handles filter application, clearing, and parameter management
 */
export const TransactionFilters = {
	/**
	 * Apply transaction filters from form inputs
	 */
	filterTransactions(e) {
		e.preventDefault();

		this.clearFilterParams();

		// Token ID filter
		const tokenId = $('#tokenId').val();
		if (tokenId && tokenId.trim() !== '') {
			FilterState.tokenId = tokenId;
			params['tokenId'] = tokenId;
		}

		// Min value filter
		const minValue = $('#minValue').val();
		if (minValue && minValue.trim() !== '') {
			FilterState.minValue = minValue;
			params['minValue'] = minValue;
		}

		// Max value filter
		const maxValue = $('#maxValue').val();
		if (maxValue && maxValue.trim() !== '') {
			FilterState.maxValue = maxValue;
			params['maxValue'] = maxValue;
		}

		// Date range filters
		if (AddressState.datePickerFrom && AddressState.datePickerFrom.dates && AddressState.datePickerFrom.dates._dates.length > 0) {
			FilterState.fromDate = AddressState.datePickerFrom.dates._dates[0].getTime();
			params['fromDate'] = FilterState.fromDate;
		}

		if (AddressState.datePickerTo && AddressState.datePickerTo.dates && AddressState.datePickerTo.dates._dates.length > 0) {
			FilterState.toDate = AddressState.datePickerTo.dates._dates[0].getTime();
			params['toDate'] = FilterState.toDate;
		}

		// Transaction type filter
		const txType = $('#txType').val() || 'all';
		FilterState.txType = txType;
		params['txType'] = txType;

		// Mark that filters are active and refresh
		params['filterTxs'] = 'true';
		params['offset'] = 0;

		window.location.assign(getCurrentUrlWithParams());
	},

	/**
	 * Clear all transaction filters
	 */
	clearFilter(e) {
		e.preventDefault();
		this.clearFilterParams();
		window.location.assign(getCurrentUrlWithParams());
	},

	/**
	 * Clear all filter state (called after clearing filters or before applying new ones)
	 */
	clearFilterParams() {
		// Clear from params object (global)
		delete params['filterTxs'];
		delete params['tokenId'];
		delete params['minValue'];
		delete params['maxValue'];
		delete params['fromDate'];
		delete params['toDate'];
		delete params['txType'];
		params['offset'] = 0;

		// Clear from FilterState object
		FilterState.reset();
	},

	/**
	 * Validate filter inputs before applying
	 */
	validateFilters() {
		const minValue = parseFloat($('#minValue').val() || 0);
		const maxValue = parseFloat($('#maxValue').val() || Infinity);

		if (isNaN(minValue) || isNaN(maxValue)) {
			showLoadError('Invalid min/max values. Please use numeric values.');
			return false;
		}

		if (minValue > maxValue) {
			showLoadError('Min value cannot be greater than max value.');
			return false;
		}

		return true;
	},

	/**
	 * Export transactions to CSV or XLSX
	 * Note: This integrates with existing exportTxs function from elsewhere
	 */
	exportTransactions(format) {
		// format: 1 = CSV, 2 = XLSX
		if (typeof exportTxs === 'function') {
			exportTxs(format);
		} else {
			console.warn('exportTxs function not found. Make sure it is loaded.');
		}
	},

	/**
	 * Reset filter form to defaults
	 */
	resetFilterForm() {
		$('#tokenId').val('');
		$('#minValue').val('');
		$('#maxValue').val('');
		$('#txType').val('all');

		// Clear date pickers if available
		if (AddressState.datePickerFrom) {
			AddressState.datePickerFrom.dates.clear();
		}
		if (AddressState.datePickerTo) {
			AddressState.datePickerTo.dates.clear();
		}
	}
};
