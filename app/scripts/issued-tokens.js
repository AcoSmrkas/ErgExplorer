const TOKEN_TYPE_PARAM = 'type';
const UTILITY_TOKEN_PATAM = 'hideUtility';
var tokenType = 'all';
var query = '';
var hideUtility = false;
var setup = true;

$(function() {
    query = params['query'];
    if (query == undefined) {
        query = '';
    }

    setupTypeSelect();
    setupToggleUtilityTokens();
    printIssuedTokens();

    $('#searchType').val('2');
    $('#searchInput').val(query);

    setup = false;
});

function printIssuedTokens() {
	var jqxhr = $.get(ERGEXPLORER_API_HOST + 'tokens/search?limit=' + ITEMS_PER_PAGE + '&offset=' + offset + '&query=' + query + '&type=' + tokenType + '&hideUtility=' + hideUtility, function(data) {
        
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
        		formattedResult += '<td><span class="d-lg-none"><strong>Name: </strong></span>' + tokenData.data.name + '</td>';

                //Type
                let type = '<span class="text-info">Token</span>';
                if (tokenData.type != undefined) {
                    switch (tokenData.type) {
                        case NFT_TYPE.Image:
                        type = '<span class="text-warning">NFT </span><img class="token-icon" src="./images/nft-image.png"/>';
                        break;
                        case NFT_TYPE.Audio:
                        type = '<span class="text-warning">NFT </span><img class="token-icon" src="./images/nft-audio.png"/>';
                        break;
                        case NFT_TYPE.Video:
                        type = '<span class="text-warning">NFT </span><img class="token-icon" src="./images/nft-video.png"/>';
                        break;
                        case NFT_TYPE.ArtCollection:
                        type = '<span class="text-warning">NFT </span><img class="token-icon" src="./images/nft-artcollection.png"/>';
                        break;
                        case NFT_TYPE.FileAttachment:
                        type = '<span class="text-warning">NFT </span><img class="token-icon" src="./images/nft-file.png"/>';
                        break;
                        case NFT_TYPE.MembershipToken:
                        type = '<span class="text-warning">NFT </span><img class="token-icon" src="./images/nft-membership.png"/>';
                        break;
                    }
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

function onTokenTypeChanged() {
    if (setup) {
        return;
    }

    tokenType = $('#tokenType').val();

    params[TOKEN_TYPE_PARAM] = tokenType;
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