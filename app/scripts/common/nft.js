const NFT_TYPE = {
	Image: 'Image',
	Audio: 'Audio',
	Video: 'Video',
	ArtCollection: 'Art collection',
	FileAttachment: 'File attachment',
	MembershipToken: 'Membership token'
}

class NftInfo {
	constructor(name, description, type, hash, link, additionalLinks, data) {
		this.name = name;
		this.description = description;
		this.type = type;
		this.hash = hash;
		this.link = link;
		this.additionalLinks = additionalLinks;
		this.data = data;
	}
}

function getNftInfo(boxId, callback) {
	var jqxhr = $.get(API_HOST + 'boxes/' + boxId, function(data) {

		let nftData = data;

		if (data == undefined) {
			callback(null, 'Data is undefined.');
		}

		let name = hex2a(nftData.additionalRegisters.R4.renderedValue);
		let description = hex2a(nftData.additionalRegisters.R5.renderedValue);
		let typeString = (nftData.additionalRegisters.R7 == undefined ? undefined : nftData.additionalRegisters.R7.serializedValue);
		let hash = (nftData.additionalRegisters.R8 == undefined ? undefined : nftData.additionalRegisters.R8.renderedValue);
		let tempLink = (nftData.additionalRegisters.R9 == undefined ? undefined : nftData.additionalRegisters.R9.renderedValue.split(','));

		let additionalLinks = new Array();
		if (tempLink.length > 1) {
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

		let nft = new NftInfo(name, description, type, hash, link, additionalLinks, nftData);

		if (type == undefined) {
			nft = null;
		}

		callback(nft, null);
    })
    .fail(function() {
    	callback(null, 'Failed to fetch NFT data.');
    });
}

function formatLink(link) {
	link = hex2a(link);

	if (link.includes('ipfs://')) {
		link = link.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
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