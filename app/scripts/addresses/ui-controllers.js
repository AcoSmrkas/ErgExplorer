import { AddressState } from './state.js';

/**
 * UI event handlers and user interactions
 * Handles all click events, toggles, and display state changes
 */
export const UIControllers = {
	/**
	 * Copy wallet address to clipboard
	 */
	copyWalletAddress(e) {
		copyToClipboard(e, AddressState.walletAddress);
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
	}
};
