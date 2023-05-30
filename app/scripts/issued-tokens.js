const NFT_SWITCH_PARAM = 'hideNfts';
var nftSwitchActive = false;

$(function() {
    setupNftSwitch();
    printIssuedTokens();
});

function printIssuedTokens() {
	var jqxhr = $.get('https://api.ergoplatform.com/api/v1/tokens?limit=30&offset=' + offset + '&hideNfts=' + nftSwitchActive, function(data) {
		let formattedResult = '';
		let items = data.items;

		for (let i = 0; i < items.length; i++) {
    		formattedResult += '<tr>';

            //Id
    		formattedResult += '<td><span class="d-lg-none"><strong>Id: </strong></span><a href="' + tokenUrl(items[i].id) + '">' + formatAddressString(items[i].id) + '</a></td>';

            //Time
    		formattedResult += '<td><span class="d-lg-none"><strong>Name: </strong></span>' + items[i].name + '</td>';

            //Inputs
    		formattedResult += '<td><span class="d-lg-none"><strong>Amount: </strong></span>' + formatValue(items[i].emissionAmount) + '</td>';

            //Outputs
    		formattedResult += '<td><span class="d-lg-none"><strong>Decimals: </strong></span>' + items[i].decimals + '</td>';

            //Size
    		formattedResult += '<td><span class="d-lg-none"><strong>Description: </strong></span>' + items[i].description + '</td>';

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

    window.location.assign(getCurrentUrlWithParams());
}