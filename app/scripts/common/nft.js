//https://nftstorage.link
//https://cloudflare-ipfs.com
//https://gateway.ipfs.io
//https://gateway.pinata.cloud
const NFT_LINK_MAX_LENGTH = 40;
const IPFS_PROVIDER_HOSTS = [
	'https://nftstorage.link',
	'https://gateway.pinata.cloud',
	'https://gateway.lighthouse.storage'
];
const IPFS_PROVIDER_HOST = 'https://nftstorage.link';
const NFT_TYPE = {
	Image: 'Image',
	Audio: 'Audio',
	Video: 'Video',
	ArtCollection: 'Art collection',
	FileAttachment: 'File attachment',
	MembershipToken: 'Membership token'
}

class NftInfo {
	constructor(type, hash, link, additionalLinks, data) {
		this.type = type;
		this.hash = hash;
		this.link = link;
		this.additionalLinks = additionalLinks;
		this.data = data;
	}
}

function getNftsInfo(tokenIds, callback, onlyNft = true) {
	var jqxhr = $.post(ERGEXPLORER_API_HOST + 'tokens/byId',
		{
			onlyNft: onlyNft,
			ids: tokenIds
		}, function(data) {
			let nfts = [];

			if (data.total > 0) {
				let items = data.items;

				for (let i = items.length - 1; i >= 0; i--) {
					nfts.push(processNftData(data.items[i]));
				}

				callback(nfts, null);
			}
		})
		.fail(function() {
			callback(null, 'Failed to fetch NFTs data.');
		});
}

function getNftInfo(tokenId, callback) {
	if (networkType != 'testnet') {
		var jqxhr = $.post(ERGEXPLORER_API_HOST + 'tokens/byId',
			{
				onlyNft: true,
				ids: [tokenId]
			}, function(data) {
			let nft = null;

			if (data.total > 0) {
				nft = processNftData(data.items[0]);
			}
			
			callback(nft, null);
	    })
	    .fail(function() {
	    	callback(null, 'Failed to fetch NFT data.');
	    });
	} else {
		$.get(API_HOST + 'api/v1/tokens/' + tokenId, function(data) {
			let tokenData = data;
			$.get(API_HOST + 'api/v1/boxes/byTokenId/' + tokenId, function(data) {
				let nftData = data;

				Object.assign(tokenData, nftData.items[0]);

				let nft = null;

				nft = processNftData(tokenData);

				callback(nft, null);
		    })
		    .fail(function() {
		    	callback(null, 'Failed to fetch NFT data.');
		    });	
	    })
	    .fail(function() {
	    	callback(null, 'Failed to fetch NFT data.');
	    });
	}
}

function getIssuedNfts(address, callback) {
	var jqxhr = $.get(ERGEXPLORER_API_HOST + 'tokens/byIssuedAddress',
		{
			onlyNft: true,
			address: address
		}, function(data) {
		let nfts = [];

		if (data.total > 0) {
			let items = data.items;

			for (let i = items.length - 1; i >= 0; i--) {
				nfts.push(processNftData(data.items[i]));
			}

			callback(nfts, null);
		}
    })
    .fail(function() {
    	callback(null, 'Failed to fetch NFT data.');
    });
}

function processNftData(nftData) {
	if (nftData == undefined) {
		return null;
	}

	let typeString = (nftData.additionalRegisters == undefined || nftData.additionalRegisters.R7 == undefined || nftData.additionalRegisters.R7.serializedValue == null ? undefined : nftData.additionalRegisters.R7.serializedValue);
	let hash = (nftData.additionalRegisters == undefined || nftData.additionalRegisters.R8 == undefined || nftData.additionalRegisters.R8.renderedValue == null ? undefined : nftData.additionalRegisters.R8.renderedValue);
	let tempLink = (nftData.additionalRegisters == undefined || nftData.additionalRegisters.R9 == undefined || nftData.additionalRegisters.R9.renderedValue == null ? undefined : nftData.additionalRegisters.R9.renderedValue.split(','));

	let additionalLinks = new Array();
	if (tempLink == undefined) {
		link = undefined;
	} else if (tempLink.length > 1) {
		link = tempLink[0].substr(1);

		for (let i = 1; i < tempLink.length; i++) {
			if (i == tempLink.length - 1) {
				tempLink[i] = tempLink[i].substr(0, tempLink[i].length - 1);
			}

			additionalLinks[i - 1] = formatLink(tempLink[i]);
		}
	} else {
		link = tempLink[0];
	}

	if (link == undefined) {
		link = formatLink(undefined);
	} else {
		link = formatLink(link);
	}

	let type = getNftType(typeString);

	let nft = new NftInfo(type, hash, link, additionalLinks, nftData);

	nft.isNft = type != undefined;

	if (nftData.cachedurl) {
		nft.cachedurl = nftData.cachedurl;
	}

	if (nftData.name == 'Mew Fun Lottery Ticket') {
		nft.cachedurl = 'https://api.ergexplorer.com/nftcache/bafybeie6z4zm7ahjvlawjfq4idojdrahklksygpfmb4zvlrx3id3h5dyty.png';
	}

	return nft;
}

function getNftType(typeString) {
	switch (typeString) {
		case '0e020101':
			return NFT_TYPE.Image;
			break;
		case '0e020102':
			return NFT_TYPE.Audio;
			break;
		case '0e020103':
			return NFT_TYPE.Video;
			break;
		case '0e020104':
			return NFT_TYPE.ArtCollection;
			break;
		case '0e02010F':
			return NFT_TYPE.FileAttachment;
			break;
		case '0e020201':
			return NFT_TYPE.MembershipToken;
			break;
		default:
			return undefined;
			break;
	}
}

function formatLink(link) {
	out = {
		url: 'None',
		ipfsCid: false
	}

	if (link == undefined) {
		return out;
	}

	link = hex2a(link);

	if (link.includes('ipfs://')) {
		out.url = link.replace('ipfs://', '');
		out.ipfsCid = true;
	} else if (link.includes('https://ipfs.infura.io')) {
		link = link.replace('https://ipfs.infura.io', IPFS_PROVIDER_HOST);
	} else {
		out.url = link;
	}

	return out;
}