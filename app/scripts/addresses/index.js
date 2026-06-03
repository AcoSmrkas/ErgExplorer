/**
 * Main entry point for refactored addresses.js
 * This file orchestrates initialization and data loading
 */

import { AddressState, FilterState } from './state.js';
import { ApiClient } from './api-client.js?v=47';
import { BalanceSummary } from './balance-summary.js?v=61';
import { AddressDetails } from './address-details.js?v=47';
import { TransactionFormatter } from './transaction-formatter.js';
import { UIControllers } from './ui-controllers.js';
import { TransactionFilters } from './filters.js';
import { NftManager } from './nft-manager.js';
import { getTxType, isWalletAddress, getTxInOutType, analyzeTransfers } from './transaction-analyzer.js';

/**
 * Friendly addressbook URLs, e.g. /addresses/FAKU-Treasury -> the real address.
 * A slug is built from an addressbook entry's name + urltype:
 *   { name: 'FAKU', urltype: 'Treasury' } -> 'faku-treasury'
 *   { name: 'Mew Finance', urltype: 'Treasury' } -> 'mew-finance-treasury'
 */
function isErgoAddress(value) {
	// Real Ergo addresses are Base58 and at least ~40 chars; slugs are short and/or contain '-'.
	return /^[1-9A-HJ-NP-Za-km-z]{40,}$/.test(value);
}

function slugifyAddressbookName(value) {
	return String(value || '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

async function resolveAddressbookSlug(slug) {
	// Decode first so a literal/encoded space (e.g. "Mew Finance-Treasury" -> "Mew%20Finance-Treasury")
	// slugifies the same as the hyphenated form "Mew-Finance-Treasury".
	let decoded = slug;
	try { decoded = decodeURIComponent(slug); } catch (e) { /* malformed escape: use raw */ }

	const target = slugifyAddressbookName(decoded);
	if (target === '') return null;

	const url = ERGEXPLORER_API_HOST + 'addressbook/getAddresses?offset=0&limit=1000&type=&order=&query=&testnet=' + (networkType === 'testnet' ? '1' : '0');

	try {
		const response = await fetch(url);
		if (!response.ok) return null;

		const data = await response.json();
		const items = (data && data.items) || [];
		const match = items.find(item => slugifyAddressbookName((item.name || '') + ' ' + (item.urltype || '')) === target);

		return match ? match.address : null;
	} catch (error) {
		console.warn('Failed to resolve addressbook slug:', error);
		return null;
	}
}

const ADDRESS_SECTION_TABS = {
	ownedNfts: {
		tab: '#ownedNftsTab',
		holder: '#nftsHolder',
		panel: '#nftsShowAll',
		countSelector: '#ownedNftsTab .address-section-tab-count'
	},
	issuedAssets: {
		tab: '#issuedAssetsTab',
		holder: '#issuedNftsHolder',
		panel: '#nftsShowIssued',
		countSelector: '#issuedAssetsTab .address-section-tab-count'
	},
	unspentBoxes: {
		tab: '#unspentBoxesTab',
		holder: '#unspentBoxesSection',
		panel: '#unspentBoxesHolder',
		countSelector: '#unspentBoxesTab .address-section-tab-count'
	}
};
let activeAddressSectionTab = null;

// Initialize on document ready
$(async function() {
	const addressFromUrl = getWalletAddressFromUrl();
	BalanceSummary.showLoading();

	// Friendly addressbook URLs (e.g. /addresses/FAKU-Treasury): resolve the slug to the
	// real address but keep the friendly URL in the bar. Normal addresses skip this, so
	// no extra request is made for them.
	let walletAddress = addressFromUrl;
	if (addressFromUrl && !isErgoAddress(addressFromUrl)) {
		const resolved = await resolveAddressbookSlug(addressFromUrl);
		if (resolved) {
			walletAddress = resolved;
		}
	}

	AddressState.walletAddress = walletAddress;
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
async function printUnspentBoxes(force = false) {
	if (AddressState.printedUnspentBoxes && !force) return;

	// Hide unspent boxes on first load
	if (AddressState.firstTime && !force) {
		hideUnspentBoxes(null);
	}

	try {
		const data = await ApiClient.getUnspentBoxes();
		AddressState.printedUnspentBoxes = true;

		if (!data || !data.items || data.items.length === 0) {
			if (data && data.total > 0 && AddressState.unspentBoxesOffset > 0) {
				AddressState.unspentBoxesOffset = getLastUnspentBoxesOffset(data.total);
				AddressState.printedUnspentBoxes = false;
				await printUnspentBoxes(true);
				return;
			}

			AddressState.unspentBoxesCount = 0;
			$('#unspentBoxesHolder').empty();
			$('#unspentBoxesPagination').hide();
			$('#unspentBoxesHeading').html('<strong>Unspent Boxes</strong> (0) ');
			setAddressSectionTabAvailable('unspentBoxes', 0);
			return;
		}

		renderUnspentBoxes(data);
	} catch (error) {
		console.error('Failed to fetch unspent boxes:', error);
	}
}

function renderUnspentBoxes(data) {
	let html = '';
	data.items.forEach(box => {
		html += formatBox(box, false, true).replace('row', 'col-12 col-md-6 ps-0 pe-0');
	});

	AddressState.unspentBoxesCount = data.total;
	$('#unspentBoxesHolder').html(html);
	$('#unspentBoxesHeading').html('<strong>Unspent Boxes</strong> (' + AddressState.unspentBoxesCount + ') ');
	setAddressSectionTabAvailable('unspentBoxes', AddressState.unspentBoxesCount);
	renderUnspentBoxesPagination();
}

function renderUnspentBoxesPagination() {
	const totalPages = Math.ceil(AddressState.unspentBoxesCount / AddressState.unspentBoxesPageSize);
	const currentPage = Math.floor(AddressState.unspentBoxesOffset / AddressState.unspentBoxesPageSize) + 1;

	if (totalPages <= 1) {
		$('#unspentBoxesPagination').hide();
		return;
	}

	const previousOffset = Math.max(0, AddressState.unspentBoxesOffset - AddressState.unspentBoxesPageSize);
	const nextOffset = Math.min(getLastUnspentBoxesOffset(AddressState.unspentBoxesCount), AddressState.unspentBoxesOffset + AddressState.unspentBoxesPageSize);

	$('#unspentBoxesPageNum').html(nFormatter(currentPage, 0, true, true) + ' of ' + nFormatter(totalPages, 0, true, true));
	$('#unspentBoxesPagination').toggle($('#unspentBoxesHolder').is(':visible'));
	bindUnspentBoxesPageLink('.unspentFirstPageHolder', '.unspentFirstPage', 0, currentPage <= 1);
	bindUnspentBoxesPageLink('.unspentPreviousPageHolder', '.unspentPreviousPage', previousOffset, currentPage <= 1);
	bindUnspentBoxesPageLink('.unspentNextPageHolder', '.unspentNextPage', nextOffset, currentPage >= totalPages);
	bindUnspentBoxesPageLink('.unspentLastPageHolder', '.unspentLastPage', getLastUnspentBoxesOffset(AddressState.unspentBoxesCount), currentPage >= totalPages);
}

function bindUnspentBoxesPageLink(holderSelector, linkSelector, boxOffset, disabled) {
	$(holderSelector).toggleClass('disabled', disabled);
	$(linkSelector)
		.off('click')
		.on('click', function(e) {
			showUnspentBoxesPage(e, boxOffset);
		});
}

function getLastUnspentBoxesOffset(totalItems) {
	if (totalItems <= 0) return 0;
	return Math.floor((totalItems - 1) / AddressState.unspentBoxesPageSize) * AddressState.unspentBoxesPageSize;
}

async function showUnspentBoxesPage(e, boxOffset) {
	if (e) e.preventDefault();

	activeAddressSectionTab = 'unspentBoxes';
	syncAddressSectionTabs();
	AddressState.unspentBoxesOffset = Math.max(0, Math.min(boxOffset, getLastUnspentBoxesOffset(AddressState.unspentBoxesCount)));
	AddressState.printedUnspentBoxes = false;
	$('#unspentBoxesHolder').show();
	$('#unspentBoxesPagination').show();
	await printUnspentBoxes(true);
	scrollToElement($('#addressSectionTabs'));
}

/**
 * Show unspent boxes
 */
function showUnspentBoxes(e) {
	showAddressSectionTab(e, 'unspentBoxes');
}

/**
 * Hide unspent boxes
 */
function hideUnspentBoxes(e) {
	if (activeAddressSectionTab === 'unspentBoxes') {
		activeAddressSectionTab = null;
	}

	syncAddressSectionTabs();
	if (e) {
		e.preventDefault();
	}
}

function setAddressSectionTabAvailable(section, count) {
	const tabConfig = ADDRESS_SECTION_TABS[section];
	if (!tabConfig) return;

	const isAvailable = count > 0;
	$(tabConfig.tab)
		.data('available', isAvailable)
		.toggle(isAvailable);
	$(tabConfig.countSelector).text('(' + count + ')');

	if (!isAvailable && activeAddressSectionTab === section) {
		activeAddressSectionTab = null;
	}

	const hasVisibleTabs = Object.values(ADDRESS_SECTION_TABS).some(config => $(config.tab).data('available') === true);
	$('#addressSectionTabs').css('display', hasVisibleTabs ? 'flex' : 'none');
	syncAddressSectionTabs();
}

function showAddressSectionTab(e, section) {
	if (e) e.preventDefault();
	if (!isAddressSectionTabAvailable(section)) return;

	activeAddressSectionTab = section;
	syncAddressSectionTabs();
}

function isAddressSectionTabAvailable(section) {
	const tabConfig = ADDRESS_SECTION_TABS[section];
	return tabConfig && $(tabConfig.tab).data('available') === true;
}

function syncAddressSectionTabs() {
	Object.keys(ADDRESS_SECTION_TABS).forEach(section => {
		const tabConfig = ADDRESS_SECTION_TABS[section];
		const isActive = activeAddressSectionTab === section;

		$(tabConfig.tab)
			.toggleClass('active', isActive)
			.attr('aria-selected', isActive ? 'true' : 'false');
		$(tabConfig.holder).hide();
		$(tabConfig.panel).hide();
	});

	$('#unspentBoxesPagination').hide();
	AddressState.ownedNftsShown = false;
	AddressState.issuedNftsShown = false;

	if (!activeAddressSectionTab || !isAddressSectionTabAvailable(activeAddressSectionTab)) return;

	const tabConfig = ADDRESS_SECTION_TABS[activeAddressSectionTab];
	$(tabConfig.holder).show();
	$(tabConfig.panel).show();

	if (activeAddressSectionTab === 'ownedNfts') {
		AddressState.ownedNftsShown = true;
		if (typeof window.loadOwnedNfts === 'function') {
			window.loadOwnedNfts();
		}
	}

	if (activeAddressSectionTab === 'issuedAssets') {
		AddressState.issuedNftsShown = true;
		if (typeof window.loadIssuedNfts === 'function') {
			window.loadIssuedNfts();
		}
	}

	if (activeAddressSectionTab === 'unspentBoxes') {
		renderUnspentBoxesPagination();
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

	AddressDetails.printAddressDetails();

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
	BalanceSummary.syncLoadingVisibility();
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
window.showAddressSectionTab = (e, section) => showAddressSectionTab(e, section);
window.setAddressSectionTabAvailable = (section, count) => setAddressSectionTabAvailable(section, count);

// Other functions
window.checkMempoolChanged = () => checkMempoolChanged();
