const TOKEN_TYPE_PARAM = 'type';
const ORDER_BY_PARAM = 'order';
var addressType = 'all';
var orderBy = 'nameAsc';
var setup = true;

updateUi();

$(function() {  
    printAddresses();
});

function printAddresses() {
   var jqxhr = $.get(ERGEXPLORER_API_HOST + 'addressbook/getAddresses?offset=' + offset + '&limit=' + ITEMS_PER_PAGE + '&type=' + addressType + '&order=' + orderBy + '&testnet=' + (networkType == 'testnet' ? '1' : '0'),
    function (data) {
		let formattedResult = '';
		let items = data.items;
        let lastName = '';

        if (data.total > 0) {
    		for (let i = 0; i < items.length; i++) {
                if (lastName == items[i].name) {
                    formattedResult += printAddress(items[i]);
                } else {  
                    lastName = items[i].name;

                    formattedResult += '<div class="col-12 mb-md-3"><div class="row div-cell-dark">';
                    formattedResult += '<div class="col-12 col-sm-12 col-lg-4 col-xl-3">';
                    
                    //Name
                    formattedResult +='<p><strong>Name: </strong>' + items[i].name + '</p>';

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

                    formattedResult += '<p><strong>Type: </strong><span class="' + spanClass + '">' + type + '</span></p>';

                    //Url
                    formattedResult += '<p><strong>Url: </strong><a target="_new" href="' + items[i].url + '">' + items[i].url + '</a></p>';

                    formattedResult += '</div>';
                    formattedResult += '<div class="col border-lg-start">';
                    formattedResult += '<hr class="my-3 d-lg-none">';

                    formattedResult += '<p><strong>Address:</strong></p>';

                    formattedResult += printAddress(items[i]);
                }

                if (i == items.length - 1 || lastName != items[i + 1].name) {
                    formattedResult += '</div>';
                    formattedResult += '</div></div>';
                }
    		}
        } else {
            formattedResult += '<div class="div-cell-dark">There are no entries in the address book.</div>';
            $('#pagination').remove();
        }

		$('#addressbookContentHolder').html(formattedResult);
        
        $('#addressbookHolder').show();

       setupPagination(data.total);
    })
    .fail(function() {
        showLoadError('Failed to fetch the address book entries.');
    })
    .always(function() {        
        $('#txLoading').hide();
    });
}

function printAddress(item) {
    return '<p><a href="' + getWalletAddressUrl(item.address) + '">' + formatAddressString(item.address, 35) + '</a>' + (item.urltype == '' ? '' : ' <span class="text-light">(' + item.urltype + ')</span>') + '</p>';
}

function updateUi() {
    setupOrderSelect();
    setupTypeSelect();

    setup = false;
}

function setupTypeSelect() {
    addressType = params[TOKEN_TYPE_PARAM];

    if (addressType == undefined) {
        addressType = 'all';
    }

    $('#addressType').val(addressType);
}

function onAddressTypeChanged() {
    if (setup) {
        return;
    }

    addressType = $('#addressType').val();

    params[TOKEN_TYPE_PARAM] = addressType;
    params['offset'] = 0;

    window.location.assign(getCurrentUrlWithParams());
}

function setupOrderSelect() {
    orderBy = params[ORDER_BY_PARAM];

    if (orderBy == undefined) {
        orderBy = 'nameAsc';
    }

    $('#orderBy').val(orderBy);
}

function onOrderChanged() {
    if (setup) {
        return;
    }

    orderBy = $('#orderBy').val();

    params[ORDER_BY_PARAM] = orderBy;
    params['offset'] = 0;

    window.location.assign(getCurrentUrlWithParams());
}