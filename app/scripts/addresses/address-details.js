import { AddressState } from './state.js';
import { ApiClient } from './api-client.js';
import { detectContractFromErgotree } from './transaction-analyzer.js';

export const AddressDetails = {
	async printAddressDetails() {
		this._reset();

		try {
			const data = await ApiClient.getAddressInfo();
			if (data && data.total > 0 && data.items && data.items.length > 0) {
				this._showVerifiedOwner(data.items[0]);
				return;
			}
		} catch (error) {
			console.warn('Failed to fetch address details:', error);
		}

		this._showDetectedContractName();
	},

	_reset() {
		$('#verifiedOwner').empty();
		$('#addressName').empty();
		$('#verifiedOwnerHolder').attr('class', 'address-detail-chip address-detail-owner');
		$('#verifiedOwnerHolder').hide();
		$('#addressNameHolder').hide();
		$('#addressDetailsHolder').hide();
	},

	_showVerifiedOwner(addressInfo) {
		if (!addressInfo) return;

		const ownerName = addressInfo.name || '';
		const ownerType = addressInfo.type || '';
		const ownerUrl = addressInfo.url || '';
		const addressType = addressInfo.urltype || '';

		if (ownerName) {
			const owner = $('#verifiedOwner');
			owner.empty();
			const ownerTypeClass = this._getOwnerTypeClass(ownerType);
			let nameElement;

			if (ownerName && this._isSafeUrl(ownerUrl)) {
				nameElement = $('<a>')
					.attr('href', ownerUrl)
					.attr('target', '_blank')
					.attr('rel', 'noopener noreferrer')
					.text(ownerName);
			} else if (ownerName) {
				nameElement = $('<span>').text(ownerName);
			}

			if (nameElement) {
				nameElement.addClass('address-detail-name');
				if (ownerTypeClass) {
					nameElement.addClass(ownerTypeClass);
				}

				nameElement.appendTo(owner);
			}

			if (addressType) {
				$('<span>')
					.addClass('address-detail-type')
					.text(' (' + addressType + ')')
					.appendTo(owner);
			}

			$('#verifiedOwnerHolder').show();
		}

		if (!ownerName && addressType) {
			$('#addressName').text(addressType);
			$('#addressNameHolder').show();
		}

		this._showHolderIfNeeded();
	},

	_showDetectedContractName() {
		const contractName = this._detectContractName();
		if (!contractName) return;

		$('#addressName').text(contractName);
		$('#addressNameHolder').show();
		this._showHolderIfNeeded();
	},

	_detectContractName() {
		const tx = AddressState.transactionsData && AddressState.transactionsData.items
			? AddressState.transactionsData.items[0]
			: null;

		if (!tx) return null;

		const boxes = [...(tx.inputs || []), ...(tx.outputs || [])];
		const box = boxes.find(item => item.address === AddressState.walletAddress && item.ergoTree);
		if (!box) return null;

		return detectContractFromErgotree(box.ergoTree);
	},

	_showHolderIfNeeded() {
		const hasDetails =
			$('#verifiedOwnerHolder').css('display') !== 'none' ||
			$('#addressNameHolder').css('display') !== 'none';

		$('#addressDetailsHolder').css('display', hasDetails ? 'flex' : 'none');
	},

	_getOwnerTypeClass(ownerType) {
		if (!ownerType || typeof getOwnerTypeClass !== 'function') return '';
		const ownerTypeClass = getOwnerTypeClass(ownerType);
		return ownerTypeClass ? 'address-detail-' + ownerTypeClass.replace('text-', '') : '';
	},

	_isSafeUrl(url) {
		if (!url) return false;

		try {
			const parsed = new URL(url, window.location.origin);
			return parsed.protocol === 'http:' || parsed.protocol === 'https:';
		} catch (error) {
			return false;
		}
	}
};
