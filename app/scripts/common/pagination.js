var ITEMS_PER_PAGE = 30;
var offset = 0;
var numPages = 1;
// A page that loads its pages in place (addresses/index.js) sets this, and the page links and
// page number call it with the new offset. Elsewhere they load the page at that offset.
var loadPageAtOffset = null;

// A modified click (new tab or window) still follows the link
$(document).on('click', '.firstPage, .previousPage, .nextPage, .lastPage', function(e) {
	if (loadPageAtOffset == null || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

	e.preventDefault();
	if ($(this).closest('.page-item').hasClass('disabled')) return;

	loadPageAtOffset($(this).data('offset'));
});

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
	setPageLink('.firstPage', 0);
	setPageLink('.previousPage', (currentPageNum - 2) * ITEMS_PER_PAGE);
	setPageLink('.nextPage', currentPageNum * ITEMS_PER_PAGE);
	setPageLink('.lastPage', (numPages - 1) * ITEMS_PER_PAGE);

	// Toggled, not only added: a page loaded in place can come back to the first or last page and leave it
	$('.firstPageHolder, .previousPageHolder').toggleClass('disabled', currentPageNum <= 1);
	$('.nextPageHolder, .lastPageHolder').toggleClass('disabled', currentPageNum >= numPages);
}

function setPageLink(selector, linkOffset) {
	$(selector)
		.attr('href', getUrlWithOffset(linkOffset))
		.data('offset', linkOffset);
}

function getUrlWithOffset(setOffset) {
	let temp = undefined;
	if (params['offset'] != undefined) {
		temp = params['offset'];
	}

	params['offset'] = setOffset;

	let urlWithOffset = getUrlWithParams(window.location.pathname.split('/')[1]);

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
	e.preventDefault();

	if (loadPageAtOffset != null) {
		loadPageAtOffset((num - 1) * ITEMS_PER_PAGE);
		return;
	}

	window.location.assign(getUrlWithOffset((num - 1) * ITEMS_PER_PAGE));
}