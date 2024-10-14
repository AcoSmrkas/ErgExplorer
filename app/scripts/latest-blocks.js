$(function() {  
    getPrices(printLatestBlocks)
});

function printLatestBlocks() {
	var jqxhr = $.get(API_HOST + 'blocks?limit=' + ITEMS_PER_PAGE + '&sortBy=height&sortDirection=desc&offset=' + offset, function(data) {
		let formattedResult = '';
		let totalBlocks = data.total;
		let items = data.items;

        setupPagination(totalBlocks);

		for (let i = 0; i < items.length; i++) {
    		formattedResult += '<tr>';

            //Height
    		formattedResult += '<td><span class="d-lg-none"><strong>Height: </strong></span><a href="' + getBlockUrl(items[i].id) + '">' + items[i].height + '</a></td>';

            //Time
    		formattedResult += '<td><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString(items[i].timestamp) + '</td>';
            
            //Transactions
    		formattedResult += '<td><span class="d-lg-none"><strong>Transactions: </strong></span>' + items[i].transactionsCount + '</td>';

            //Mined by
            addAddress(items[i].miner.address);
    		formattedResult += '<td><span class="d-lg-none"><strong>Mined by: </strong></span><a class="address-string" addr="' + items[i].miner.address + '" href="' + getWalletAddressUrl(items[i].miner.address) + '">' + items[i].miner.name + '</a></td>';	

            //Reward
    		formattedResult += '<td><span class="d-lg-none"><strong>Reward: </strong></span>' + formatErgValueString(items[i].minerReward) + ' <span class="text-light">' + formatAssetDollarPriceString(items[i].minerReward, ERG_DECIMALS, 'ERG') + '</span></td>';
            
            //Difficulty
    		formattedResult += '<td><span class="d-lg-none"><strong>Difficulty: </strong></span>' + items[i].difficulty + '</td>';

            //Size
    		formattedResult += '<td><span class="d-lg-none"><strong>Size: </strong></span>' + formatKbSizeString(items[i].size) + '</td>';

			formattedResult += '</tr>';	
		}

		$('#transactionsTableBody').html(formattedResult);
        
        $('#blocksHolder').show();

        getAddressesInfo();
    })
    .fail(function() {
        showLoadError('Failed to fetch latest blocks.');
    })
    .always(function() {        
        $('#txLoading').hide();
    });
}