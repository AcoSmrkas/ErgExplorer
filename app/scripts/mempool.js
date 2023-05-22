$(function() {  
    printMempool();
});

function printMempool() {
	var jqxhr = $.get('https://api.ergoplatform.com/transactions/unconfirmed?limit=30&sortBy=size&sortDirection=desc', function(data) {
		let formattedResult = '';
		let totalBlocks = data.total;
		let items = data.items;

		for (let i = 0; i < items.length; i++) {
    		formattedResult += '<tr>';

            //Id
    		formattedResult += '<td>' + items[i].id + '</td>';

            //Time
    		formattedResult += '<td>' + formatDateString(items[i].creationTimestamp) + '</td>';

            //Inputs
    		formattedResult += '<td>' + items[i].inputs.length + '</td>';

            //Outputs
    		formattedResult += '<td>' + items[i].outputs.length + '</td>';

            //Size
    		formattedResult += '<td>' + formatKbSizeString(items[i].size) + '</td>';

			formattedResult += '</tr>';	
		}

		$('#transactionsTableBody').html(formattedResult);
    })
    .fail(function() {
    	console.log('Latest blocks fetch failed.');
    });
}