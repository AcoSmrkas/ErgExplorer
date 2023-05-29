var ITEMS_PER_PAGE = 30;
var offset = 0;

$(function() {
	offset = getOffsetFromUrl();
});

function getOffsetFromUrl() {
	let offset = 0;
	let hashArray = undefined;

	let temp = window.location.href.split('#')[1];
	if (temp != undefined && temp.includes('offset')) {
		if (temp.split('&')[1] != undefined) {
			temp = temp.split('&');
		} else {
			temp = [temp];
		}

		for (let i = 0; i < temp.length; i++) {
			if (temp[i].includes('offset')) {
				offset = temp[i].split('=')[1];
			}
		}
	}

	return offset
}

function setupPagination(totalItems) {
	let numPages = totalItems / ITEMS_PER_PAGE;
	let currentPageNum = getOffsetFromUrl() / ITEMS_PER_PAGE + 1;

	if (currentPageNum == 0) {
		currentPageNum = 1;
	}

	$('#pageNum').html(currentPageNum + ' of ' + Math.ceil(numPages));
	$('#firstPage').attr('href', getUrlWithOffset(0));
	$('#previousPage').attr('href', getUrlWithOffset((currentPageNum - 2) * ITEMS_PER_PAGE));
	$('#nextPage').attr('href', getUrlWithOffset(currentPageNum * ITEMS_PER_PAGE));
	$('#lastPage').attr('href', getUrlWithOffset((Math.ceil(numPages) - 1) * ITEMS_PER_PAGE));

	if (currentPageNum <= 1) {
		$('#firstPageHolder').addClass('disabled');
		$('#previousPageHolder').addClass('disabled');
	}

	if (currentPageNum >= Math.ceil(numPages)) {
		$('#nextPageHolder').addClass('disabled');
		$('#lastPageHolder').addClass('disabled');
	}
}

function getUrlWithOffset(offset) {
	let currentHash = window.location.hash.substring(1);
	let newHash = currentHash;

	if (currentHash.includes('&offset')) {
		newHash = currentHash.substring(0, currentHash.indexOf('&offset'));
	} else if (currentHash.includes('offset')) {
		newHash = currentHash.substring(0, currentHash.indexOf('offset'));
	}

	if (newHash != '') {
		newHash += '&';
	}

	return window.location.pathname + '/' + newHash + 'offset=' + offset;
}