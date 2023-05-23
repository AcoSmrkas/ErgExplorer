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
    		formattedResult += '<td><span class="d-lg-none"><strong>Id: </strong></span>' + formatAddressString(items[i].id, 15) + '</td>';

            //Time
    		formattedResult += '<td><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString(items[i].creationTimestamp) + '</td>';

            //Inputs
    		formattedResult += '<td><span class="d-lg-none"><strong>Inputs: </strong></span>' + items[i].inputs.length + '</td>';

            //Outputs
    		formattedResult += '<td><span class="d-lg-none"><strong>Outputs: </strong></span>' + items[i].outputs.length + '</td>';

            //Size
    		formattedResult += '<td><span class="d-lg-none"><strong>Size: </strong></span>' + formatKbSizeString(items[i].size) + '</td>';

			formattedResult += '</tr>';	
		}

		$('#transactionsTableBody').html(formattedResult);
    })
    .fail(function() {
    	console.log('Latest blocks fetch failed.');
    });
}