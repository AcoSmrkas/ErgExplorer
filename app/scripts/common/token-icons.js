//Token icons come from the database (tokens.iconurl), loaded by getTokenIcons(). Pages that render
//icons before it has answered get iconurl from tokens/byId instead (the token page and the token popup).

var tokenIconsDb = [];
var gotTokenIcons = false;

function getTokenIcons(callback) {
	$.get('https://api2.ergexplorer.com/tokens/getTokenIcons',
		function (data) {
			tokenIconsDb = data.items.reduce((acc, item) => {
				acc[item.id] = item.iconurl;
				return acc;
			  }, {});
			gotTokenIcons = true;
		}
	).always(function (data) {
		if (callback) {
			callback();
		}
	})
}

function hasIcon(tokenId) {
	return !!tokenIconsDb[tokenId];
}

function getIcon(tokenId) {
	return tokenIconsDb[tokenId] || undefined;
}

//Lists show icons at 18px, so they load a 64px thumbnail made by tools/token-thumbs.js. The originals
//are up to 3 MB. A token that has no thumbnail yet falls back to its full icon.
function getTokenThumbAttrs(tokenId, fullSrc) {
	if (!/^[0-9a-f]{64}$/.test(tokenId)) {
		return 'src="' + fullSrc + '"';
	}

	const escapedSrc = fullSrc.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

	return 'src="/images/tokens/thumbs/' + tokenId + '.webp" data-full-src="' + escapedSrc + '" onerror="onTokenThumbError(this)"';
}

//The token page shows its icon at 88px, so it loads the larger thumbnail, with the same fallback
function setLargeTokenThumb(element, tokenId, fullSrc) {
	if (!/^[0-9a-f]{64}$/.test(tokenId)) {
		element.src = fullSrc;
		return;
	}

	element.dataset.fullSrc = fullSrc;
	element.onerror = () => onTokenThumbError(element);
	element.src = '/images/tokens/thumbs/' + tokenId + '-176.webp';
}

function onTokenThumbError(element) {
	const fullSrc = element.dataset.fullSrc;

	if (fullSrc) {
		delete element.dataset.fullSrc;
		element.src = fullSrc;
	} else {
		element.remove();
	}
}
