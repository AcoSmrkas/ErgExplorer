$(function() {  
    getPrices(printLatestBlocks)
});

function printLatestBlocks() {
   var jqxhr = $.get(ERGEXPLORER_API_HOST + 'addressbook/getAddresses?offset=' + offset,
    function (data) {
		let formattedResult = '';
		let items = data.items;

		for (let i = 0; i < items.length; i++) {
    		formattedResult += '<tr>';

            //Name
            formattedResult += '<td><span class="d-lg-none"><strong>Name: </strong></span>' + items[i].name + '</td>';

            //Type
            let type = items[i].type;
            let spanClass = '';
            switch (type) {
                case 'Exchange':
                    spanClass = 'text-success';
                    break;

                case 'Service':
                    spanClass = 'text-warning';
                    break;
            }

            formattedResult += '<td><span class="d-lg-none"><strong>Type: </strong></span><span class="' + spanClass + '">' + type + '</span></td>';
            
            //Address
            formattedResult += '<td><span class="d-lg-none"><strong>Address: </strong></span><a href="' + getWalletAddressUrl(items[i].address) + '">' + items[i].address + '</a></td>';
            
            //Url
    		formattedResult += '<td><span class="d-lg-none"><strong>Url: </strong></span><a target="_new" href="' + items[i].url + '">' + items[i].url + '</a></td>';

			formattedResult += '</tr>';	
		}

		$('#addressbookTableBody').html(formattedResult);
        
        $('#addressbookHolder').show();

        setupPagination(data.total);
    })
    .fail(function() {
        showLoadError('Failed to fetch addressbook.');
    })
    .always(function() {        
        $('#txLoading').hide();
    });
}