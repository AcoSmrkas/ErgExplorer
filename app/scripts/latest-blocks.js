$(function() {  
    printLatestBlocks();
});

function printLatestBlocks() {
	var jqxhr = $.get('https://api.ergoplatform.com/blocks?limit=30&sortBy=height&sortDirection=desc', function(data) {
		let formattedResult = '';
		let totalBlocks = data.total;
		let items = data.items;

		for (let i = 0; i < items.length; i++) {
    		formattedResult += '<tr>';

            //Height
    		formattedResult += '<td><span class="d-lg-none"><strong>Height: </strong></span><a href="' + blockUrl(items[i].id) + '">' + items[i].height + '</a></td>';

            //Time
    		formattedResult += '<td><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString(items[i].timestamp) + '</td>';
            
            //Transactions
    		formattedResult += '<td><span class="d-lg-none"><strong>Transactions: </strong></span>' + items[i].transactionsCount + '</td>';

            //Mined by	
    		formattedResult += '<td><span class="d-lg-none"><strong>Mined by: </strong></span><a href="' + getWalletAddressUrl(items[i].miner.address) + '">' + items[i].miner.name + '</a></td>';	

            //Reward
    		formattedResult += '<td><span class="d-lg-none"><strong>Reward: </strong></span>' + formatErgValueString(items[i].minerReward) + '</td>';
            
            //Difficulty
    		formattedResult += '<td><span class="d-lg-none"><strong>Difficulty: </strong></span>' + items[i].difficulty + '</td>';

            //Size
    		formattedResult += '<td><span class="d-lg-none"><strong>Size: </strong></span>' + formatDateString(items[i].size) + '</td>';

			formattedResult += '</tr>';	
		}

		$('#transactionsTableBody').html(formattedResult);
        
        $('#blocksHolder').show();
    })
    .fail(function() {
        $('#loadError').show();
    	console.log('Latest blocks fetch failed.');
    })
    .always(function() {        
        $('#txLoading').hide();
    });
}