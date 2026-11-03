import { AddressState } from './state.js';
import { ApiClient } from './api-client.js?v=59';
import { detectContractFromErgotree } from './transaction-analyzer.js?v=4';

// The rich list page's ranking: ergo.watch's top holders plus the two emission contracts it leaves out
const RICH_LIST_URL = 'https://api.ergo.watch/lists/addresses/by/balance?limit=1000';
const RICH_LIST_SIZE = 1000;
const RICH_LIST_PAGE_SIZE = 100;
const INDEXED_NODE_HOST = 'https://chain.mewfinance.com/';
const EMISSION_CONTRACT_NFTS = [
	'20fa2bf23962cdf51b07722d6237c0c7b8a44f78856c0f7ec308dc1ef1a92a51',
	'd3feeffa87f2df63a7a15b4905e618ae3ce4c69a7975f171bd314d0b877927b8'
];
const RICH_LIST_CACHE_KEY = 'richListRanking';
const RICH_LIST_CACHE_MS = 60 * 60 * 1000;

export const AddressDetails = {
	async printAddressDetails() {
		this._reset();
		this._showRichListRank();

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
		$('#richListHolder').hide();
		$('#addressDetailsHolder').hide();
	},

	async _showRichListRank() {
		const address = AddressState.walletAddress;
		const ranking = await this._getRichListRanking();
		const rank = ranking.indexOf(address) + 1;
		if (rank < 1 || address !== AddressState.walletAddress) return;

		const pageOffset = Math.floor((rank - 1) / RICH_LIST_PAGE_SIZE) * RICH_LIST_PAGE_SIZE;
		$('#richListHolder')
			.attr('href', getSearchQueryPage('rich-list', 'offset=' + pageOffset))
			.attr('title', 'Rank ' + rank + ' of the top ' + RICH_LIST_SIZE + ' ERG holders')
			.show();
		$('#richListRank').text('Rich list #' + rank);
		this._showHolderIfNeeded();
	},

	// Addresses in rank order, cached for the session; [] when it can't be had
	async _getRichListRanking() {
		try {
			const cached = JSON.parse(sessionStorage.getItem(RICH_LIST_CACHE_KEY));
			if (cached && Date.now() - cached.at < RICH_LIST_CACHE_MS) return cached.ranking;
		} catch (error) {}

		try {
			const [holders, contracts] = await Promise.all([
				fetch(RICH_LIST_URL, { signal: AbortSignal.timeout(15000) }).then(r => r.json()),
				Promise.all(EMISSION_CONTRACT_NFTS.map(nft => this._getEmissionContract(nft)))
			]);
			const ranking = holders
				.concat(contracts.filter(contract => contract != null))
				.sort((a, b) => b.balance - a.balance)
				.slice(0, RICH_LIST_SIZE)
				.map(item => item.address);

			try {
				sessionStorage.setItem(RICH_LIST_CACHE_KEY, JSON.stringify({ at: Date.now(), ranking }));
			} catch (error) {}
			return ranking;
		} catch (error) {
			console.warn('No rich list rank:', error);
			return [];
		}
	},

	_getEmissionContract(nft) {
		return fetch(INDEXED_NODE_HOST + 'blockchain/box/unspent/byTokenId/' + nft + '?offset=0&limit=1', { signal: AbortSignal.timeout(10000) })
			.then(r => r.json())
			.then(boxes => (Array.isArray(boxes) && boxes[0] ? { address: boxes[0].address, balance: boxes[0].value } : null))
			.catch(() => null);
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
			$('#addressNameHolder').css('display') !== 'none' ||
			$('#richListHolder').css('display') !== 'none';

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
