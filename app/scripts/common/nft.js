const NFT_TYPE = {
	Image: 'Image',
	Audio: 'Audio',
	Video: 'Video',
	ArtCollection: 'Art collection',
	FileAttachment: 'File attachment',
	MembershipToken: 'Membership token'
}

class NftInfo {
	constructor(description, type, rawLink, link, data) {
		this.description = description;
		this.type = type;
		this.rawLink = rawLink;
		this.link = link;
		this.data = data;
	}
}

function getNftInfo(tokenId, callback) {
	var jqxhr = $.get('https://api.ergoplatform.com/api/v0/assets/' + tokenId + '/issuingBox', function(data) {

		let nftData = data[0];

		if (data[0] == undefined) {
			return;
		}

		let description = hex2a(nftData.additionalRegisters.R5).substring(3);
		let typeString = nftData.additionalRegisters.R7;
		let hash = hex2a(nftData.additionalRegisters.R8);
		let link = hex2a(nftData.additionalRegisters.R9);
		let convertedLink = undefined;

		if (link != undefined) {
			convertedLink = link.substring(link.indexOf('ipfs://')).replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');	
		} else {
			link = 'None';
		}

		let type = undefined;
		switch (typeString) {
			case '0e020101':
				type = NFT_TYPE.Image;
				break;
			case '0e020102':
				type = NFT_TYPE.Audio;
				break;
			case '0e020103':
				type = NFT_TYPE.Video;
				break;
			case '0e020104':
				type = NFT_TYPE.ArtCollection;
				break;
			case '0e02010F':
				type = NFT_TYPE.FileAttachment;
				break;
			case '0e020201':
				type = NFT_TYPE.MembershipToken;
				break;
			default:
				break;
		}

		let nft = new NftInfo(description, type, link, convertedLink, nftData);

		callback(nft, null);
    })
    .fail(function() {
    	callback(null, 'Failed to fetch NFT data.');
    });
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