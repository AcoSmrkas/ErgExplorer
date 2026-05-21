import { AddressState } from './state.js';

function getOwnedAssetTypeTabs() {
	return [
		{ key: 'image', type: NFT_TYPE.Image, tab: '#ownedNftImagesTab', panel: '#nftImagesHolder', countSelector: '#ownedNftImagesTab .address-asset-type-tab-count' },
		{ key: 'audio', type: NFT_TYPE.Audio, tab: '#ownedNftAudioTab', panel: '#nftAudioHolder', countSelector: '#ownedNftAudioTab .address-asset-type-tab-count' },
		{ key: 'video', type: NFT_TYPE.Video, tab: '#ownedNftVideoTab', panel: '#nftVideoHolder', countSelector: '#ownedNftVideoTab .address-asset-type-tab-count' },
		{ key: 'artCollection', type: NFT_TYPE.ArtCollection, tab: '#ownedNftArtCollectionTab', panel: '#nftArtCollectionHolder', countSelector: '#ownedNftArtCollectionTab .address-asset-type-tab-count' },
		{ key: 'fileAttachment', type: NFT_TYPE.FileAttachment, tab: '#ownedNftFileTab', panel: '#nftFileHolder', countSelector: '#ownedNftFileTab .address-asset-type-tab-count' },
		{ key: 'membershipToken', type: NFT_TYPE.MembershipToken, tab: '#ownedNftMembershipTab', panel: '#nftMembershipHolder', countSelector: '#ownedNftMembershipTab .address-asset-type-tab-count' }
	];
}

function getIssuedAssetTypeTabs() {
	return [
		{ key: 'token', type: 'token', tab: '#issuedAssetTokensTab', panel: '#issuedTokenHolder', countSelector: '#issuedAssetTokensTab .address-asset-type-tab-count' },
		{ key: 'image', type: NFT_TYPE.Image, tab: '#issuedAssetImagesTab', panel: '#issuedNftImagesHolder', countSelector: '#issuedAssetImagesTab .address-asset-type-tab-count' },
		{ key: 'audio', type: NFT_TYPE.Audio, tab: '#issuedAssetAudioTab', panel: '#issuedNftAudioHolder', countSelector: '#issuedAssetAudioTab .address-asset-type-tab-count' },
		{ key: 'video', type: NFT_TYPE.Video, tab: '#issuedAssetVideoTab', panel: '#issuedNftVideoHolder', countSelector: '#issuedAssetVideoTab .address-asset-type-tab-count' },
		{ key: 'artCollection', type: NFT_TYPE.ArtCollection, tab: '#issuedAssetArtCollectionTab', panel: '#issuedNftArtCollectionHolder', countSelector: '#issuedAssetArtCollectionTab .address-asset-type-tab-count' },
		{ key: 'fileAttachment', type: NFT_TYPE.FileAttachment, tab: '#issuedAssetFileTab', panel: '#issuedNftFileHolder', countSelector: '#issuedAssetFileTab .address-asset-type-tab-count' },
		{ key: 'membershipToken', type: NFT_TYPE.MembershipToken, tab: '#issuedAssetMembershipTab', panel: '#issuedNftMembershipHolder', countSelector: '#issuedAssetMembershipTab .address-asset-type-tab-count' }
	];
}

function createAssetTypeCounts(configs) {
	return configs.reduce((counts, config) => {
		counts[config.key] = 0;
		return counts;
	}, {});
}

/**
 * NFT display and management
 * Handles owned and issued NFT data processing and display
 */
export const NftManager = {
	activeAssetTypeTabs: {
		owned: null,
		issued: null
	},

	getAssetTypeTabs(group) {
		return group === 'issued' ? getIssuedAssetTypeTabs() : getOwnedAssetTypeTabs();
	},

	getAssetTypeTabsHolder(group) {
		return group === 'issued' ? '#issuedAssetTypeTabs' : '#ownedNftTypeTabs';
	},

	updateAssetTypeTabs(group, counts) {
		const configs = this.getAssetTypeTabs(group);
		let firstAvailable = null;
		const activeKey = this.activeAssetTypeTabs[group];

		configs.forEach(config => {
			const count = counts[config.key] || 0;
			const isAvailable = count > 0;

			$(config.tab)
				.data('available', isAvailable)
				.toggle(isAvailable);
			$(config.countSelector).text('(' + count + ')');

			if (isAvailable && !firstAvailable) {
				firstAvailable = config.key;
			}
		});

		const activeStillAvailable = configs.some(config => {
			return config.key === activeKey && $(config.tab).data('available') === true;
		});

		this.activeAssetTypeTabs[group] = activeStillAvailable ? activeKey : firstAvailable;
		$(this.getAssetTypeTabsHolder(group)).css('display', firstAvailable ? 'flex' : 'none');
		this.syncAssetTypeTabs(group);
	},

	showAssetTypeTab(e, group, key) {
		if (e) e.preventDefault();

		const config = this.getAssetTypeTabs(group).find(assetType => assetType.key === key);
		if (!config || $(config.tab).data('available') !== true) return;

		this.activeAssetTypeTabs[group] = key;
		this.syncAssetTypeTabs(group);

		if (group === 'owned') {
			this.loadOwnedNfts();
		} else if (group === 'issued') {
			this.loadIssuedNfts();
		}
	},

	syncAssetTypeTabs(group) {
		const activeKey = this.activeAssetTypeTabs[group];

		this.getAssetTypeTabs(group).forEach(config => {
			const isActive = activeKey === config.key;

			$(config.tab)
				.toggleClass('active', isActive)
				.attr('aria-selected', isActive ? 'true' : 'false');
			$(config.panel).toggle(isActive);
		});
	},

	/**
	 * Handle owned NFT info response
	 */
	onGotOwnedNftInfo(nftInfos, message) {
		if (!nftInfos || nftInfos.length === 0) return;

		nftInfos.sort((a, b) => a.data.isBurned === 't' ? 1 : -1);
		nftInfos.sort((a, b) => {
			if (a.data.isBurned !== 't' || b.data.isBurned !== 't') return 0;
			return a.data.name > b.data.name ? 1 : -1;
		});
		nftInfos.sort((a, b) => {
			if (a.data.isBurned === 't' || b.data.isBurned === 't') return 0;
			return a.data.name > b.data.name ? 1 : -1;
		});

		const html = {};
		const assetTypeTabs = this.getAssetTypeTabs('owned');
		const assetTypeCounts = createAssetTypeCounts(assetTypeTabs);
		AddressState.nftsCount = 0;
		html['token'] = '';
		html[NFT_TYPE.Image] = '';
		html[NFT_TYPE.Audio] = '';
		html[NFT_TYPE.Video] = '';
		html[NFT_TYPE.ArtCollection] = '';
		html[NFT_TYPE.FileAttachment] = '';
		html[NFT_TYPE.MembershipToken] = '';

		nftInfos.forEach((nft, i) => {
			if (!nft.isNft) return;

			let imgSrc = '';
			let cSrc = '';
			let nftHolderId = '';
			let nftContentHolderId = '';

			switch (nft.type) {
				case NFT_TYPE.Image:
					cSrc = nft.link.ipfsCid
						? IPFS_PROVIDER_HOSTS[0] + '/ipfs/' + nft.link.url
						: nft.link.url;
					if (nft.cachedurl) cSrc = nft.cachedurl;
					if (nft.data.nsfw) cSrc = '';
					imgSrc = './images/nft-image.png';
					nftHolderId = '#nftImagesHolder';
					nftContentHolderId = '#nftImagesContentHolder';
					break;
				case NFT_TYPE.Audio:
					imgSrc = './images/nft-audio.png';
					nftHolderId = '#nftAudioHolder';
					nftContentHolderId = '#nftAudioContentHolder';
					break;
				case NFT_TYPE.Video:
					imgSrc = './images/nft-video.png';
					nftHolderId = '#nftVideoHolder';
					nftContentHolderId = '#nftVideoContentHolder';
					break;
				case NFT_TYPE.ArtCollection:
					imgSrc = './images/nft-artcollection.png';
					nftHolderId = '#nftArtCollectionHolder';
					nftContentHolderId = '#nftArtCollectionContentHolder';
					break;
				case NFT_TYPE.FileAttachment:
					imgSrc = './images/nft-file.png';
					nftHolderId = '#nftFileHolder';
					nftContentHolderId = '#nftFileContentHolder';
					break;
				case NFT_TYPE.MembershipToken:
					imgSrc = './images/nft-membership.png';
					nftHolderId = '#nftMembershipHolder';
					nftContentHolderId = '#nftMembershipContentHolder';
					break;
			}

			const assetTypeConfig = assetTypeTabs.find(config => config.type === nft.type);
			if (!assetTypeConfig || !nftHolderId || !nftContentHolderId) return;

			html[nft.type] += '<a href="' + getTokenUrl(nft.data.id) + '"><div class="card m-1" style="width: 100px;"><div class="cardImgHolder"><img onload="onNftImageLoaded(this, \'nft-img-owned\')" onerror="onNftImageLoaded(this, \'nft-img-owned\')" csrc="' + cSrc + '" src="' + imgSrc + '" class="nft-img-owned card-img-top p-4"></div><div class="card-body p-2"><p class="card-text">' + nft.data.name + '</p></div></div></a>';

			assetTypeCounts[assetTypeConfig.key]++;
			AddressState.nftsCount++;
		});

		if (AddressState.nftsCount > 0) {
			$('#nftImagesContentHolder').html(html[NFT_TYPE.Image]);
			$('#nftAudioContentHolder').html(html[NFT_TYPE.Audio]);
			$('#nftVideoContentHolder').html(html[NFT_TYPE.Video]);
			$('#nftArtCollectionContentHolder').html(html[NFT_TYPE.ArtCollection]);
			$('#nftFileContentHolder').html(html[NFT_TYPE.FileAttachment]);
			$('#nftMembershipContentHolder').html(html[NFT_TYPE.MembershipToken]);

			this.updateAssetTypeTabs('owned', assetTypeCounts);
			$('#nftsHolder').show();
			$('#nftsTitle').html('<strong>Owned NFTs</strong> (' + AddressState.nftsCount + ') ');
			if (typeof window.setAddressSectionTabAvailable === 'function') {
				window.setAddressSectionTabAvailable('ownedNfts', AddressState.nftsCount);
			}
		}

		if (AddressState.ownedNftsShown) {
			AddressState.loadingOwnedNfts = false;
			this.loadOwnedNfts();
		}
	},

	/**
	 * Load owned NFTs
	 */
	loadOwnedNfts() {
		if (!AddressState.loadingOwnedNfts) {
			AddressState.loadingOwnedNfts = true;
			this.loadMoreNfts(10, 'nft-img-owned');
		}
	},

	/**
	 * Load issued NFTs
	 */
	loadIssuedNfts() {
		if (!AddressState.loadingIssuedNfts) {
			AddressState.loadingIssuedNfts = true;
			this.loadMoreNfts(10, 'nft-img-issued');
		}
	},

	/**
	 * Load more NFT images
	 */
	loadMoreNfts(amount, type) {
		let loadIndex = 0;
		$('.' + type).each((index, element) => {
			if (loadIndex >= amount) return;

			const cSrc = $(element).attr('csrc');
			const src = $(element).attr('src');

			if (cSrc && cSrc !== src) {
				$(element).attr('src', cSrc);
				loadIndex++;
			}
		});
	},

	/**
	 * Handle NFT image load
	 */
	onNftImageLoaded(element, type) {
		const cSrc = $(element).attr('csrc');
		const src = $(element).attr('src');

		if (cSrc === src) {
			$(element).removeClass('p-4');
			$(element).attr('csrc', '');
			setTimeout(() => this.loadMoreNfts(1, type), 50);
		}
	},

	/**
	 * Handle issued NFT info response
	 */
	onGotIssuedNftInfo(nftInfos, message) {
		if (!nftInfos || nftInfos.length === 0) return;

		nftInfos.sort((a, b) => a.data.isBurned === 't' ? 1 : -1);
		nftInfos.sort((a, b) => {
			if (a.data.isBurned !== 't' || b.data.isBurned !== 't') return 0;
			return a.data.name > b.data.name ? 1 : -1;
		});
		nftInfos.sort((a, b) => {
			if (a.data.isBurned === 't' || b.data.isBurned === 't') return 0;
			return a.data.name > b.data.name ? 1 : -1;
		});

		const html = {};
		const assetTypeTabs = this.getAssetTypeTabs('issued');
		const assetTypeCounts = createAssetTypeCounts(assetTypeTabs);
		AddressState.issuedNftsCount = 0;
		html['token'] = '';
		html[NFT_TYPE.Image] = '';
		html[NFT_TYPE.Audio] = '';
		html[NFT_TYPE.Video] = '';
		html[NFT_TYPE.ArtCollection] = '';
		html[NFT_TYPE.FileAttachment] = '';
		html[NFT_TYPE.MembershipToken] = '';

		nftInfos.forEach(nft => {
			let nftHolderId = '';

			if (nft.isNft) {
				let imgSrc = '';
				let cSrc = '';

				switch (nft.type) {
					case NFT_TYPE.Image:
						cSrc = nft.link.ipfsCid
							? IPFS_PROVIDER_HOSTS[0] + '/ipfs/' + nft.link.url
							: nft.link.url;
						if (nft.cachedurl) cSrc = nft.cachedurl;
						if (nft.data.nsfw) cSrc = '';
						imgSrc = './images/nft-image.png';
						nftHolderId = '#issuedNftImagesHolder';
						break;
					case NFT_TYPE.Audio:
						imgSrc = './images/nft-audio.png';
						nftHolderId = '#issuedNftAudioHolder';
						break;
					case NFT_TYPE.Video:
						imgSrc = './images/nft-video.png';
						nftHolderId = '#issuedNftVideoHolder';
						break;
					case NFT_TYPE.ArtCollection:
						imgSrc = './images/nft-artcollection.png';
						nftHolderId = '#issuedNftArtCollectionHolder';
						break;
					case NFT_TYPE.FileAttachment:
						imgSrc = './images/nft-file.png';
						nftHolderId = '#issuedNftFileHolder';
						break;
					case NFT_TYPE.MembershipToken:
						imgSrc = './images/nft-membership.png';
						nftHolderId = '#issuedNftMembershipHolder';
						break;
				}

				const assetTypeConfig = assetTypeTabs.find(config => config.type === nft.type);
				if (!assetTypeConfig || !nftHolderId) return;

				const isBurned = nft.data.isBurned === 't';
				html[nft.type] += '<a href="' + getTokenUrl(nft.data.id) + '"><div class="card m-1" style="width: 100px;' + (isBurned ? 'border:1.5px solid red;' : '') + '"><div class="cardImgHolder"><img onload="onNftImageLoaded(this, \'nft-img-issued\')" onerror="onNftImageLoaded(this, \'nft-img-issued\')" csrc="' + cSrc + '" ' + (isBurned ? 'style="opacity: 0.4;"' : '') + 'src="' + imgSrc + '" class="nft-img-issued card-img-top p-4"></div><div class="card-body p-2"><p class="card-text">' + nft.data.name + '</p></div></div></a>';
				assetTypeCounts[assetTypeConfig.key]++;
			} else {
				nftHolderId = '#issuedTokenHolder';
				html['token'] += '<p><a href="' + getTokenUrl(nft.data.id) + '">' + nft.data.name + ' - ' + formatAddressString(nft.data.id) + '</a>' + (nft.data.isBurned === 't' ? ' (<span class="text-danger">Burned</span>)' : '') + '</p>';
				assetTypeCounts.token++;
			}

			AddressState.issuedNftsCount++;
		});

		$('#issuedTokenContentHolder').html(html['token']);
		$('#issuedNftImagesContentHolder').html(html[NFT_TYPE.Image]);
		$('#issuedNftAudioContentHolder').html(html[NFT_TYPE.Audio]);
		$('#issuedNftVideoContentHolder').html(html[NFT_TYPE.Video]);
		$('#issuedNftArtCollectionContentHolder').html(html[NFT_TYPE.ArtCollection]);
		$('#issuedNftFileContentHolder').html(html[NFT_TYPE.FileAttachment]);
		$('#issuedNftMembershipContentHolder').html(html[NFT_TYPE.MembershipToken]);

		this.updateAssetTypeTabs('issued', assetTypeCounts);
		$('#issuedNftsHolder').show();
		$('#issuedNftsTitle').html('<strong>Issued Assets</strong> (' + AddressState.issuedNftsCount + ') ');
		if (typeof window.setAddressSectionTabAvailable === 'function') {
			window.setAddressSectionTabAvailable('issuedAssets', AddressState.issuedNftsCount);
		}

		if (AddressState.issuedNftsShown) {
			AddressState.loadingIssuedNfts = false;
			this.loadIssuedNfts();
		}
	}
};

// Expose to global scope for HTML onclick handlers
window.loadOwnedNfts = () => NftManager.loadOwnedNfts();
window.loadIssuedNfts = () => NftManager.loadIssuedNfts();
window.onNftImageLoaded = (element, type) => NftManager.onNftImageLoaded(element, type);
window.showAddressAssetTypeTab = (e, group, key) => NftManager.showAssetTypeTab(e, group, key);

// Make available for callbacks from common modules
window.onGotOwnedNftInfo = (nfts, msg) => NftManager.onGotOwnedNftInfo(nfts, msg);
window.onGotIssuedNftInfo = (nfts, msg) => NftManager.onGotIssuedNftInfo(nfts, msg);
