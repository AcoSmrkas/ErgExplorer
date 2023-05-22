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
    		formattedResult += '<td>' + items[i].height + '</td>';

            //Time
    		formattedResult += '<td>' + formatDateString(items[i].timestamp) + '</td>';
            
            //TXs
    		formattedResult += '<td>' + items[i].transactionsCount + '</td>';

            //Mined by	
    		formattedResult += '<td><a href="' + getWalletAddressUrl(items[i].miner.address) + '">' + items[i].miner.name + '</a></td>';	

            //Reward
    		formattedResult += '<td>' + formatErgValueString(items[i].minerReward) + '</td>';
            
            //Difficulty
    		formattedResult += '<td>' + items[i].difficulty + '</td>';

            //Size
    		formattedResult += '<td>' + formatDateString(items[i].size) + '</td>';

			formattedResult += '</tr>';	
		}

		$('#transactionsTableBody').html(formattedResult);
    })
    .fail(function() {
    	console.log('Latest blocks fetch failed.');
    });
}