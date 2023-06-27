const TOKEN_TYPE_PARAM = 'type';
const ORDER_BY_PARAM = 'order';
const UTILITY_TOKEN_PATAM = 'hideUtility';
const BURNED_TOKEN_PATAM = 'hideBurned';
var tokenType = 'all';
var query = '';
var hideUtility = false;
var hideBurned = false;
var orderBy = false;
var setup = true;

$(function() {
    query = params['query'];
    if (query == undefined) {
        query = '';
    }

    if (networkType == 'testnet') {
        $('#search').remove();
    }

    setupOrderSelect();
    setupTypeSelect();
    setupToggleBurnedTokens();
    setupToggleUtilityTokens();
    printIssuedTokens();

    $('#searchType').val('2');
    $('#searchInput').val(query);

    setup = false;
});

function printIssuedTokens() {
    let tokensSearchUrl = ERGEXPLORER_API_HOST + 'tokens/search?limit=' + ITEMS_PER_PAGE + '&offset=' + offset + '&query=' + query + '&type=' + tokenType + '&hideUtility=' + hideUtility + '&order=' + orderBy + '&hideBurned=' + hideBurned;

    if (networkType == 'testnet') {
        tokensSearchUrl = API_HOST + 'api/v1/tokens?limit=' + ITEMS_PER_PAGE + '&offset=' + offset;
    }

	var jqxhr = $.get(tokensSearchUrl, function(data) {
		let formattedResult = '';
		let items = data.items;

        if (items.length == 0) {
            formattedResult = '<tr><td colspan="5">No results matching your query.</td></tr>';
        } else {
    		for (let i = 0; i < items.length; i++) {
                let tokenData = processNftData(items[i]);

        		formattedResult += '<tr>';

                //Id
        		formattedResult += '<td><span class="d-lg-none"><strong>Id: </strong></span><a href="' + getTokenUrl(tokenData.data.id) + '">' + formatAddressString(tokenData.data.id) + '</a></td>';

                //Name
                if (tokenData.data.name == null || tokenData.data.name == '') {
                    tokenData.data.name = '';
                }

        		formattedResult += '<td><span class="d-lg-none"><strong>Name: </strong></span>' + tokenData.data.name + '</td>';

                //Type
                let type = '<span class="text-info">Token</span>';

                if (networkType == 'testnet') {
                    type = '<span class="text-light" id="tokenType-' + tokenData.data.id + '">Unknown</span>';

                    getNftInfo(tokenData.data.id, onGotNftInfo);
                }

                if (tokenData.type != undefined) {
                    type = tokenTypeSwitch(tokenData.type);
                }

                if (tokenData.data.isBurned == 't') {
                    type = '<span class="text-danger">Burned</span>';
                }

                formattedResult += '<td><span class="d-lg-none"><strong>Type: </strong></span>' + type + '</td>';

                //Emission amount
        		formattedResult += '<td><span class="d-lg-none"><strong>Amount: </strong></span>' + formatValue(tokenData.data.emissionAmount) + '</td>';

                //Description
                let asciiArt = isAsciiArt(tokenData.data.description);

        		formattedResult += '<td><pre class="tokenDescriptionPre' + (asciiArt ? ' pre-ascii' : '') + '">' + formatNftDescription(tokenData.data.description) + '</pre></td>';

    			formattedResult += '</tr>';	
    		}

            setupPagination(data.total);
        }

		$('#issuedTokensTableBody').html(formattedResult);

        $('#issuedTokensHolder').show();
    })
    .fail(function(data) {
        showLoadError('Failed to fetch issued tokens.');
    })
    .always(function() {        
        $('#txLoading').hide();
    });
}

function setupToggleBurnedTokens() {
    hideBurned = params[BURNED_TOKEN_PATAM];

    if (hideBurned == undefined) {
        hideBurned = 'false';
        $('#toggleBurned').prop('checked', '');
    } else {
        hideBurned = 'true';
        $('#toggleBurned').prop('checked', 'checked');
    }
}

function onToggleBurnedTokens() {
    let toggleBurned = $('#toggleBurned').prop('checked');
    
    if (toggleBurned == true) {
        params[BURNED_TOKEN_PATAM] = 'true';
    } else {  
        delete(params[BURNED_TOKEN_PATAM]);
    }

    params['offset'] = 0;

    window.location.assign(getCurrentUrlWithParams());
}

function setupToggleUtilityTokens() {
    hideUtility = params[UTILITY_TOKEN_PATAM];

    if (hideUtility == undefined) {
        hideUtility = 'false';
        $('#toggleUtility').prop('checked', '');
    } else {
        hideUtility = 'true';
        $('#toggleUtility').prop('checked', 'checked');
    }
}

function onToggleUtilityTokens() {
    let toggleUtility = $('#toggleUtility').prop('checked');
    
    if (toggleUtility == true) {
        params[UTILITY_TOKEN_PATAM] = 'true';
    } else {  
        delete(params[UTILITY_TOKEN_PATAM]);
    }

    params['offset'] = 0;

    window.location.assign(getCurrentUrlWithParams());
}

function setupTypeSelect() {
    tokenType = params[TOKEN_TYPE_PARAM];

    if (tokenType == undefined) {
        tokenType = 'all';
    }

    $('#tokenType').val(tokenType);
}

function onTokenTypeChanged() {
    if (setup) {
        return;
    }

    tokenType = $('#tokenType').val();

    params[TOKEN_TYPE_PARAM] = tokenType;
    params['offset'] = 0;

    window.location.assign(getCurrentUrlWithParams());
}

function setupOrderSelect() {
    orderBy = params[ORDER_BY_PARAM];

    if (orderBy == undefined) {
        orderBy = false;
    }

    if (orderBy == false) {
        $('#orderBy').val('recent');        
    } else {
        $('#orderBy').val(orderBy);
    }
}

function onOrderChanged() {
    if (setup) {
        return;
    }

    orderBy = $('#orderBy').val();

    params[ORDER_BY_PARAM] = orderBy;
    params['offset'] = 0;

    window.location.assign(getCurrentUrlWithParams());
}

function onGotNftInfo(nftInfo) {
    let typeString = tokenTypeSwitch(nftInfo.type);

    $('#tokenType-' + nftInfo.data.id).removeClass('text-light');
    $('#tokenType-' + nftInfo.data.id).html(typeString);
}

function tokenTypeSwitch(type) {
    switch (type) {
        case NFT_TYPE.Image:
        return '<span class="text-warning">NFT </span><img class="token-icon nft-icon" src="./images/nft-image.png"/>';
        case NFT_TYPE.Audio:
        return '<span class="text-warning">NFT </span><img class="token-icon nft-icon" src="./images/nft-audio.png"/>';
        case NFT_TYPE.Video:
        return '<span class="text-warning">NFT </span><img class="token-icon nft-icon" src="./images/nft-video.png"/>';
        case NFT_TYPE.ArtCollection:
        return '<span class="text-warning">NFT </span><img class="token-icon nft-icon" src="./images/nft-artcollection.png"/>';
        case NFT_TYPE.FileAttachment:
        return '<span class="text-warning">NFT </span><img class="token-icon nft-icon" src="./images/nft-file.png"/>';
        case NFT_TYPE.MembershipToken:
        return '<span class="text-warning">NFT </span><img class="token-icon nft-icon" src="./images/nft-membership.png"/>';
        default:
        return '<span class="text-info">Token</span>';
    }
}