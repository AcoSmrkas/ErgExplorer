$(function() {  
    printIssuedTokens();
});

function printIssuedTokens() {
	var jqxhr = $.get('https://api.ergoplatform.com/api/v1/tokens?limit=30&offset=' + offset, function(data) {
		let formattedResult = '';
		let items = data.items;

		for (let i = 0; i < items.length; i++) {
    		formattedResult += '<tr>';

            //Id
    		formattedResult += '<td><span class="d-lg-none"><strong>Id: </strong></span>' + items[i].name + '</td>';

            //Time
    		formattedResult += '<td><span class="d-lg-none"><strong>Name: </strong></span>' + items[i].name + '</td>';

            //Inputs
    		formattedResult += '<td><span class="d-lg-none"><strong>Amount: </strong></span>' + items[i].emissionAmount + '</td>';

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
        $('#loadError').show();
    	console.log('Issued tokens fetch failed.');
    })
    .always(function() {        
        $('#txLoading').hide();
    });
}