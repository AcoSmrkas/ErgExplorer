/**
 * Main entry point for refactored addresses.js
 * This file orchestrates initialization and data loading
 */

import { AddressState, FilterState } from './state.js';
import { ApiClient } from './api-client.js';
import { BalanceSummary } from './balance-summary.js';
import { TransactionFormatter } from './transaction-formatter.js';
import { UIControllers } from './ui-controllers.js';
import { TransactionFilters } from './filters.js';
import { NftManager } from './nft-manager.js';
import { getTxType, isWalletAddress, getTxInOutType, analyzeTransfers } from './transaction-analyzer.js';

// Initialize on document ready
$(function() {
	AddressState.walletAddress = getWalletAddressFromUrl();
	setDocumentTitle(AddressState.walletAddress);
	initializeAddressPage();
});

/**
 * Initialize the address page
 */
async function initializeAddressPage() {
	try {
		AddressState.scamList = await ApiClient.getScamList();
	} catch (error) {
		console.warn('Failed to load scam list:', error);
	}

	// Coordinate initialization requests
	AddressState.initRequestCount = -1;
	AddressState.initRequestDone = 0;

	if (typeof getTokenIcons === 'function') {
		getTokenIcons(onInitRequestsFinished);
	} else {
		console.warn('getTokenIcons function not found');
		onInitRequestsFinished();
	}

	if (typeof getPrices === 'function') {
		getPrices(onInitRequestsFinished);
	} else {
		console.warn('getPrices function not found');
		onInitRequestsFinished();
	}

	if (typeof getIssuedNfts === 'function') {
		getIssuedNfts(AddressState.walletAddress, onGotIssuedNftInfo, false);
	} else {
		console.warn('getIssuedNfts function not found');
	}
}

/**
 * Called when all init requests complete
 */
function onInitRequestsFinished() {
	if (!gotTokenIcons) return;

	printAddressSummary();
	printTransactions();
	printUnspentBoxes();

	if (AddressState.rfT) {
		clearTimeout(AddressState.rfT);
		AddressState.rfT = null;
	}

	AddressState.rfT = setTimeout(refreshData, AddressState.rfTimeout);
}

/**
 * Print address summary
 */
async function printAddressSummary() {
	try {
		await BalanceSummary.printAddressSummary();
	} catch (error) {
		console.error('Failed to print address summary:', error);
	}
}

/**
 * Print transactions
 */
async function printTransactions() {
	if (AddressState.getTxData) return;
	AddressState.getTxData = true;

	try {
		await Promise.all([
			ApiClient.getMempoolData(),
			ApiClient.getTransactionsData()
		]);
		AddressState.mempoolRequestDone = true;
		AddressState.transactionsRequestDone = true;
		onMempoolAndTransactionsDataFetched();
	} catch (error) {
		console.error('Failed to fetch transactions:', error);
	}
}

/**
 * Fetch unspent boxes
 */
async function printUnspentBoxes() {
	if (AddressState.printedUnspentBoxes) return;
	AddressState.printedUnspentBoxes = true;

	// Hide unspent boxes on first load
	if (AddressState.firstTime) {
		hideUnspentBoxes(null);
	}

	try {
		const data = await ApiClient.getUnspentBoxes();
		if (data && data.items && data.items.length > 0) {
			let html = '';
			data.items.forEach(box => {
				html += formatBox(box, false, true).replace('row', 'col-12 col-md-6 ps-0 pe-0');
			});

			AddressState.unspentBoxesCount = data.total;
			$('#unspentBoxesHolder').html(html);
			$('#unspentBoxesHeading').html('<strong>Unspent Boxes</strong> (' + AddressState.unspentBoxesCount + ') ');
			$('#hideUnspentBoxesAction').hide();
		}
	} catch (error) {
		console.error('Failed to fetch unspent boxes:', error);
	}
}

/**
 * Show unspent boxes
 */
function showUnspentBoxes(e) {
	$('#unspentBoxesHolder').show();
	$('#showUnspentBoxesAction').hide();
	$('#hideUnspentBoxesAction').show();
	$('#unspentBoxesHeading').html('<strong>Unspent Boxes </strong>');
	scrollToElement($('#unspentBoxesHeading'));
	if (e) e.preventDefault();
}

/**
 * Hide unspent boxes
 */
function hideUnspentBoxes(e) {
	$('#unspentBoxesHolder').hide();
	$('#showUnspentBoxesAction').show();
	$('#hideUnspentBoxesAction').hide();
	$('#unspentBoxesHeading').html('<strong>Unspent Boxes</strong> (' + AddressState.unspentBoxesCount + ') ');
	if (e) {
		scrollToElement($('#unspentBoxesHeading'));
		e.preventDefault();
	}
}

/**
 * Called when mempool and transactions are both fetched
 */
function onMempoolAndTransactionsDataFetched() {
	if (!AddressState.mempoolRequestDone || !AddressState.transactionsRequestDone) {
		return;
	}

	if (AddressState.printed) return;

	if (typeof getAddressInfo === 'function') {
		getAddressInfo();
	}

	let html = '';
	const mempoolCount = AddressState.mempoolData && AddressState.mempoolData.items ? AddressState.mempoolData.items.length : 0;

	html += TransactionFormatter.formatTransactions(AddressState.mempoolData, true, AddressState.walletAddress, networkType, 0);
	html += TransactionFormatter.formatTransactions(AddressState.transactionsData, false, AddressState.walletAddress, networkType, mempoolCount);

	let updateHtml = false;
	if (AddressState.formattedResult === '' || AddressState.formattedResult !== html) {
		AddressState.formattedResult = html;
		updateHtml = true;
	}

	if (typeof setupPagination === 'function') {
		setupPagination(AddressState.transactionsData.total);
	}

	// Calculate total from API response totals
	const totalTxCount = (AddressState.mempoolData?.total || 0) + (AddressState.transactionsData?.total || 0);
	AddressState.totalTransactions = totalTxCount;
	$('#totalTransactions').html('<strong>Total transactions:</strong> ' + AddressState.totalTransactions);

	if (AddressState.totalTransactions > 0) {
		$('#transactionsTableBody').html(html);
		$('#txView').show();
	} else {
		showLoadError('No transactions.');
	}

	$('#txLoading').hide();
	if (typeof getAddressesInfo === 'function') {
		getAddressesInfo();
	}

	AddressState.printed = true;
}

/**
 * Refresh data
 */
function refreshData() {
	AddressState.printedUnspentBoxes = false;
	AddressState.printedAddressSummary = false;
	AddressState.mempoolRequestDone = false;
	AddressState.transactionsRequestDone = false;
	AddressState.printed = false;
	AddressState.getTxData = false;
	AddressState.totalTransactions = 0;
	AddressState.firstTime = false;

	if (typeof getPrices === 'function') {
		getPrices(onInitRequestsFinished);
	} else {
		console.warn('getPrices function not found');
		onInitRequestsFinished();
	}
}

/**
 * Check if mempool has changed
 */
function checkMempoolChanged() {
	const mempoolUrl = ApiClient.getMempoolUrl();

	$.get(mempoolUrl, function(data) {
		const newMempoolCount = data.total;

		if (newMempoolCount !== AddressState.mempoolCount) {
			const balanceUrl = ApiClient.getTxsDataUrl();

			$.get(balanceUrl, function(data) {
				for (let i = 0; i < data.items.length; i++) {
					let found = false;
					for (let j = 0; j < AddressState.mempoolTxIds.length; j++) {
						if (data.items[i].id === AddressState.mempoolTxIds[j]) {
							onMempoolTxConfirmed();
							found = true;
							break;
						}
					}

					if (found) {
						break;
					}

					if (i === data.items.length - 1 && !found && newMempoolCount === 0) {
						onMempoolEmptyNoConfirmation();
						break;
					}
				}
			});
		}
	});
}

/**
 * Handle mempool transaction confirmed
 */
function onMempoolTxConfirmed() {
	if (Notification.permission === 'granted') {
		const img = 'https://ergexplorer.com/images/logo.png';
		const text = 'Transaction on address ' + AddressState.walletAddress + ' has been confirmed.';
		AddressState.txNotification = new Notification('Transaction confirmed', { body: text, icon: img });

		AddressState.txNotification.onclick = function(x) {
			window.focus();
			this.close();
			location.reload();
		};
	}

	if (AddressState.mempoolInterval !== undefined) {
		clearTimeout(AddressState.mempoolInterval);
	}

	if (document.hasFocus()) {
		location.reload();
	}
}

/**
 * Handle mempool empty (no confirmation)
 */
function onMempoolEmptyNoConfirmation() {
	if (Notification.permission === 'granted') {
		const img = 'https://ergexplorer.com/images/logo.png';
		const text = 'Transaction on address ' + AddressState.walletAddress + ' status updated.';
		const notification = new Notification('Transaction updated', { body: text, icon: img });

		notification.onclick = function(x) {
			window.focus();
			this.close();
			location.reload();
		};
	}

	if (AddressState.mempoolInterval !== undefined) {
		clearTimeout(AddressState.mempoolInterval);
	}

	if (document.hasFocus()) {
		location.reload();
	}
}

// Expose functions to global scope for HTML onclick handlers

// Main orchestration
window.printAddressSummary = printAddressSummary;
window.printTransactions = printTransactions;
window.printUnspentBoxes = printUnspentBoxes;
window.refreshData = refreshData;

// UI Controllers - Token display
window.showAllTokens = (e) => UIControllers.showAllTokens(e);
window.hideAllTokens = (e) => UIControllers.hideAllTokens(e);
window.showAllFinancialTokens = (e) => UIControllers.showAllFinancialTokens(e);
window.hideAllFinancialTokens = (e) => UIControllers.hideAllFinancialTokens(e);

// UI Controllers - Transaction value
window.showFullValue = (e, index) => UIControllers.showFullValue(e, index);
window.hideFullValue = (e, index) => UIControllers.hideFullValue(e, index);

// UI Controllers - Clipboard
window.copyWalletAddress = (e) => UIControllers.copyWalletAddress(e);
window.copyAddress = (e, element) => UIControllers.copyAddress(e, element);
window.setupQrCode = () => UIControllers.setupQrCode();

// UI Controllers - NFT display
window.showNfts = (e) => UIControllers.showNfts(e);
window.hideNfts = (e) => UIControllers.hideNfts(e);
window.showIssuedNfts = (e) => UIControllers.showIssuedNfts(e);
window.hideIssuedNfts = (e) => UIControllers.hideIssuedNfts(e);

// UI Controllers - Notifications
window.onNotificationToastYes = () => UIControllers.onNotificationToastYes();
window.onNotificationToastNo = () => UIControllers.onNotificationToastNo();

// Filters
window.filterTransactions = (e) => TransactionFilters.filterTransactions(e);
window.clearFilter = (e) => TransactionFilters.clearFilter(e);

// Unspent Boxes
window.showUnspentBoxes = (e) => showUnspentBoxes(e);
window.hideUnspentBoxes = (e) => hideUnspentBoxes(e);

// Other functions
window.checkMempoolChanged = () => checkMempoolChanged();
