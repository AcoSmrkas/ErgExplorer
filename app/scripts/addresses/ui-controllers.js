import { AddressState } from './state.js';

/**
 * UI event handlers and user interactions
 * Handles all click events, toggles, and display state changes
 */
export const UIControllers = {
	/**
	 * Show full transaction value with all assets
	 */
	showFullValue(e, index) {
		$('#txValue' + index).html(AddressState.valueFieldsFull[index]);
		e.preventDefault();
	},

	/**
	 * Show truncated transaction value
	 */
	hideFullValue(e, index) {
		$('#txValue' + index).html(AddressState.valueFields[index]);
		scrollToElement($('#txValue' + index));
		e.preventDefault();
	},

	/**
	 * Copy wallet address to clipboard
	 */
	copyWalletAddress(e) {
		copyToClipboard(e, AddressState.walletAddress);
	},

	/**
	 * Copy address from element to clipboard
	 */
	copyAddress(e, element) {
		const address = $(element).attr('title');
		copyToClipboard(e, address);
	},

	/**
	 * Setup QR code display
	 */
	setupQrCode() {
		$('#showQRcodeBtn').on('click', function () {
			showQRcode(AddressState.walletAddress);
		});

		$('#qrCodeBack').on('click', function () {
			$('#qrCodeBack').fadeOut();
			$('body').css('height', 'inherit');
			$('body').css('overflow-y', 'auto');
		});
	},

	/**
	 * Show owned NFTs section
	 */
	showNfts(e) {
		if (typeof window.showAddressSectionTab === 'function') {
			window.showAddressSectionTab(e, 'ownedNfts');
			return;
		}

		$('#nftsHolder').show();
		$('#nftsShowAll').show();

		loadOwnedNfts();
		AddressState.ownedNftsShown = true;

		if (e) e.preventDefault();
	},

	/**
	 * Hide owned NFTs section
	 */
	hideNfts(e) {
		$('#nftsShowAll').hide();

		AddressState.ownedNftsShown = false;

		if (e) e.preventDefault();
	},

	/**
	 * Show issued NFTs/tokens section
	 */
	showIssuedNfts(e) {
		if (typeof window.showAddressSectionTab === 'function') {
			window.showAddressSectionTab(e, 'issuedAssets');
			return;
		}

		$('#issuedNftsHolder').show();
		$('#nftsShowIssued').show();

		loadIssuedNfts();
		AddressState.issuedNftsShown = true;

		if (e) e.preventDefault();
	},

	/**
	 * Hide issued NFTs/tokens section
	 */
	hideIssuedNfts(e) {
		$('#nftsShowIssued').hide();

		AddressState.issuedNftsShown = false;

		if (e) e.preventDefault();
	},

	/**
	 * Handle notification toast - yes button
	 */
	onNotificationToastYes() {
		requestNotificationPermission(() => {
			this.trackTransaction();
		});
		hideNotificationPermissionToast();
		this.trackTransaction();
	},

	/**
	 * Handle notification toast - no button
	 */
	onNotificationToastNo() {
		hideNotificationPermissionToast();
	},

	/**
	 * Start tracking pending transaction
	 */
	trackTransaction() {
		if (Notification.permission !== 'granted') {
			return;
		}

		if (AddressState.mempoolInterval !== undefined) {
			return;
		}

		showCustomToast('Monitoring mempool<span id="dots">...</span>');
		setInterval(this._animateDots, 300);

		AddressState.mempoolInterval = setInterval(checkMempoolChanged, 30000);
	},

	/**
	 * Animate dots in "Monitoring mempool..." message
	 */
	_animateDots() {
		const dots = $('#dots');
		let content = dots.html();
		content = content === '...' ? '.' : (content === '.' ? '..' : '...');
		dots.html(content);
	}
};
