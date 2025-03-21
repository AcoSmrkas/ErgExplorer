var ITEMS_PER_PAGE = 30;
var offset = 0;
var numPages = 1;

$(function() {
	offset = params['offset'];

	if (offset == undefined) {
		offset = 0;
	}

	let limit = params['limit'];

	if (limit != undefined) {
		ITEMS_PER_PAGE = limit;
	}
});

function setupPagination(totalItems) {
	numPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
	let currentPageNum = offset / ITEMS_PER_PAGE + 1;

	if (currentPageNum == 0) {
		currentPageNum = 1;
	}

	$('.pageNum').html(nFormatter(currentPageNum, 0, true, true) + ' of ' + nFormatter(numPages, 0, true, true));
	$('.firstPage').attr('href', getUrlWithOffset(0));
	$('.previousPage').attr('href', getUrlWithOffset((currentPageNum - 2) * ITEMS_PER_PAGE));
	$('.nextPage').attr('href', getUrlWithOffset(currentPageNum * ITEMS_PER_PAGE));
	$('.lastPage').attr('href', getUrlWithOffset((numPages - 1) * ITEMS_PER_PAGE));

	if (currentPageNum <= 1) {
		$('.firstPageHolder').addClass('disabled');
		$('.previousPageHolder').addClass('disabled');
	}

	if (currentPageNum >= numPages) {
		$('.nextPageHolder').addClass('disabled');
		$('.lastPageHolder').addClass('disabled');
	}
}

function getUrlWithOffset(setOffset) {
	let temp = undefined;
	if (params['offset'] != undefined) {
		temp = params['offset'];
	}

	params['offset'] = setOffset;

	let urlWithOffset = getUrlWithParams(window.location.pathname.substring(1));

	if (temp != undefined) {
		params['offset'] = temp;
	}

	return urlWithOffset;
}

function enterPageNum(e) {
	let num = prompt('Enter page number:');

	if (isNaN(num) || num == null) {
		return;
	}

	num = clamp(num, 1, numPages);

	window.location.assign(getUrlWithOffset((num - 1) * ITEMS_PER_PAGE));

	e.preventDefault();
}