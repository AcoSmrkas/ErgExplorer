const NFT_SWITCH_PARAM = 'hideNfts';
var nftSwitchActive = false;
var query = '';

$(function() {
    query = params['query'];

    setupNftSwitch();
    printIssuedTokens();
});

function printIssuedTokens() {
    let apiUrl = '';

    if (query == undefined) {
        apiUrl = API_HOST + 'tokens?limit=' + ITEMS_PER_PAGE + '&offset=' + offset + '&hideNfts=' + nftSwitchActive;
    } else {
        apiUrl = API_HOST + 'tokens/search?limit=' + ITEMS_PER_PAGE + '&offset=' + offset + '&query=' + query;
    }

	var jqxhr = $.get(apiUrl, function(data) {
		let formattedResult = '';
		let items = data.items;

		for (let i = 0; i < items.length; i++) {
    		formattedResult += '<tr>';

            //Id
    		formattedResult += '<td><span class="d-lg-none"><strong>Id: </strong></span><a href="' + getTokenUrl(items[i].id) + '">' + formatAddressString(items[i].id) + '</a></td>';

            //Name
    		formattedResult += '<td><span class="d-lg-none"><strong>Name: </strong></span>' + items[i].name + '</td>';

            //Emission amount
    		formattedResult += '<td><span class="d-lg-none"><strong>Amount: </strong></span>' + formatValue(items[i].emissionAmount) + '</td>';

            //Decimals
    		formattedResult += '<td><span class="d-lg-none"><strong>Decimals: </strong></span>' + items[i].decimals + '</td>';

            //Description
    		formattedResult += '<td><pre class="tokenDescriptionPre">' + formatNftDescription(items[i].description) + '</pre></td>';

			formattedResult += '</tr>';	
		}

        setupPagination(data.total);

		$('#issuedTokensTableBody').html(formattedResult);

        $('#issuedTokensHolder').show();
    })
    .fail(function() {
        showLoadError('Failed to fetch issued tokens.');
    })
    .always(function() {        
        $('#txLoading').hide();
    });
}

function setupNftSwitch() {
    nftSwitchActive = params[NFT_SWITCH_PARAM];

    if (nftSwitchActive == 'true') {
        $('#nftSwitch').prop('checked', true);
        nftSwitchActive = true;
    } else {
        $('#nftSwitch').prop('checked', false);
        nftSwitchActive = false;
    }
}

function onNftSwitchClick(event) {
    params[NFT_SWITCH_PARAM] = $('#nftSwitch').prop('checked');
    params['offset'] = 0;

    if (params[NFT_SWITCH_PARAM]) {
        delete(params['query']);
    }

    window.location.assign(getCurrentUrlWithParams());
}