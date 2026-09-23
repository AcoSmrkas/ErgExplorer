$(function() {  
    printMempool();
});

function printMempool() {
    let apiUrl = 'https://api.ergoplatform.com/';

    if (networkType == 'testnet') {
        apiUrl = 'https://api-testnet.ergoplatform.com/';
    }

    const query = '?limit=' + ITEMS_PER_PAGE + '&offset=' + offset + '&sortBy=size&sortDirection=desc';
    const explorerUrl = apiUrl + 'transactions/unconfirmed' + query;

    // Our node's pool first: the explorer's list intermittently returns empty pages
    // (items: [] with total > 0) and misses txs that entered through other nodes.
    if (MEMPOOL_API_HOST) {
        $.get(MEMPOOL_API_HOST + 'transactions' + query, printMempoolPage)
            .fail(() => getMempoolPage(explorerUrl));
    } else {
        getMempoolPage(explorerUrl);
    }
}

function getMempoolPage(url) {
	var jqxhr = $.get(url, printMempoolPage)
    .fail(function() {
        showLoadError('Failed to fetch mempool transactions.');
    }).always(function() {        
        $('#txLoading').hide();
    });
}

function printMempoolPage(data) {
		let formattedResult = '';
		let totalBlocks = data.total;
		let items = data.items;

        if (items.length > 0) {
    		for (let i = 0; i < items.length; i++) {
        		formattedResult += '<tr>';

                //Id
        		formattedResult += '<td><span class="d-lg-none"><strong>Id: </strong></span><a href="' + getTransactionsUrl(items[i].id) + '">' + formatAddressString(items[i].id, 40) + '</a></td>';

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
        } else {
            formattedResult = '<td colspan="12" class="p-2">No transactions currently in mempool.</td>';
            $('#pagination').hide();
        }

        setupPagination(totalBlocks);

		$('#transactionsTableBody').html(formattedResult);

        $('#mempoolHolder').show();
        $('#txLoading').hide();
}