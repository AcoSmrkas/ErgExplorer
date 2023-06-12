const TOKEN_TYPE_PARAM = 'type';
var tokenType = 'all';
var query = '';
var setup = true;

$(function() {
    query = params['query'];
    if (query == undefined) {
        query = '';
    }

    setupTypeSelect();
    printIssuedTokens();
});

function printIssuedTokens() {
	var jqxhr = $.get(ERGEXPLORER_API_HOST + 'tokens/search?limit=' + ITEMS_PER_PAGE + '&offset=' + offset + '&query=' + query + '&type=' + tokenType, function(data) {
        
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
                let type = 'Token';
                if (tokenData.type != undefined) {
                    switch (tokenData.type) {
                        case NFT_TYPE.Image:
                        type = 'NFT <img class="token-icon" src="./images/nft-image.png"/>';
                        break;
                        case NFT_TYPE.Audio:
                        type = 'NFT <img class="token-icon" src="./images/nft-audio.png"/>';
                        break;
                        case NFT_TYPE.Video:
                        type = 'NFT <img class="token-icon" src="./images/nft-video.png"/>';
                        break;
                        case NFT_TYPE.ArtCollection:
                        type = 'NFT <img class="token-icon" src="./images/nft-artcollection.png"/>';
                        break;
                        case NFT_TYPE.FileAttachment:
                        type = 'NFT <img class="token-icon" src="./images/nft-file.png"/>';
                        break;
                        case NFT_TYPE.MembershipToken:
                        type = 'NFT <img class="token-icon" src="./images/nft-membership.png"/>';
                        break;
                    }
                }

                formattedResult += '<td><span class="d-lg-none"><strong>Type: </strong></span>' + type + '</td>';

                //Emission amount
        		formattedResult += '<td><span class="d-lg-none"><strong>Amount: </strong></span>' + formatValue(tokenData.data.emissionAmount) + '</td>';

                //Description
        		formattedResult += '<td><pre class="tokenDescriptionPre">' + formatNftDescription(tokenData.data.description) + '</pre></td>';

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

function setupTypeSelect() {
    tokenType = params[TOKEN_TYPE_PARAM];

    if (tokenType == undefined) {
        tokenType = 'all';
    }

    $('#tokenType').val(tokenType);
    setup = false;
}