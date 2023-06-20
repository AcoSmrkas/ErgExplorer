//https://nftstorage.link
//https://cloudflare-ipfs.com
//https://gateway.ipfs.io
const IPFS_PROVIDER_HOST = 'https://gateway.ipfs.io';
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
			if (data.total > 0) {
				let items = data.items;

				for (let i = items.length - 1; i >= 0; i--) {
					let nft = null;

					nft = processNftData(data.items[i]);

					callback(nft, null);
				}
			}
		})
		.fail(function() {
			callback(null, 'Failed to fetch NFTs data.');
		});
}

function getNftInfo(tokenId, callback) {
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
}

function getIssuedNfts(address, callback) {
	var jqxhr = $.get(ERGEXPLORER_API_HOST + 'tokens/byIssuedAddress',
		{
			onlyNft: true,
			address: address
		}, function(data) {
		if (data.total > 0) {
			let items = data.items;

			for (let i = items.length - 1; i >= 0; i--) {
				let nft = null;

				nft = processNftData(data.items[i]);

				callback(nft, null);
			}
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

	let typeString = (nftData.additionalRegisters.R7 == undefined || nftData.additionalRegisters.R7.serializedValue == null ? undefined : nftData.additionalRegisters.R7.serializedValue);
	let hash = (nftData.additionalRegisters.R8 == undefined || nftData.additionalRegisters.R8.renderedValue == null ? undefined : nftData.additionalRegisters.R8.renderedValue);
	let tempLink = (nftData.additionalRegisters.R9 == undefined || nftData.additionalRegisters.R9.renderedValue == null ? undefined : nftData.additionalRegisters.R9.renderedValue.split(','));

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
		link = 'None';
	} else {
		link = formatLink(link);
	}

	let type = getNftType(typeString);

	let nft = new NftInfo(type, hash, link, additionalLinks, nftData);

	nft.isNft = type != undefined;

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
	link = hex2a(link);

	if (link.includes('ipfs://')) {
		link = link.replace('ipfs://', IPFS_PROVIDER_HOST + '/ipfs/');
	} else if (link.includes('https://ipfs.infura.io')) {
		link = link.replace('https://ipfs.infura.io', IPFS_PROVIDER_HOST);
	}

	return link;
}

function hex2a(hexx) {
	if (hexx == undefined) {
		return undefined;
	}

    let hex = hexx.toString();//force conversion
    let str = '';
    
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }

    return str;
}