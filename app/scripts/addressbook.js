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

        if (data.total > 0) {
    		for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let nameItems = getAddressBookNameItems(items, i);

                formattedResult += '<div class="col-12 mb-md-3"><div class="row div-cell-dark">';
                formattedResult += '<div class="col-12 col-sm-12 col-lg-4 col-xl-3">';
                
                //Name
                formattedResult +='<p><strong>Name: </strong>' + item.name + '</p>';

                 //Type
                let type = item.type;
                let spanClass = getOwnerTypeClass(type);

                formattedResult += '<p><strong>Type: </strong><span class="' + spanClass + '">' + type + '</span></p>';

                //Url
                if (item.url) {
                    formattedResult += '<p><strong>Url: </strong><a target="_new" href="' + item.url + '">' + item.url + '</a></p>';
                }
                
                formattedResult += '</div>';
                formattedResult += '<div class="col border-lg-start">';
                formattedResult += '<hr class="my-3 d-lg-none">';

                formattedResult += printAddressGroups(nameItems);

                if (data.tokens.length > 0) {
                    for (let j = 0; j < data.tokens.length; j++) {
                        let token = data.tokens[j];
                        if (token.addressname == item.name) {
                            formattedResult += '<br><p><strong>Token:</strong></p><a style="word-wrap:break-word;" href="' + getTokenUrl(token.id) + '">' + token.id + '</a>';
                            break;
                        }
                    }
                }

                formattedResult += '</div>';
                formattedResult += '</div></div>';

                i += nameItems.length - 1;
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

function countUniqueNames(arr) {
  const uniqueNames = new Set(); // Using Set to store unique names

  // Iterate through each object in the array
  arr.forEach(obj => {
    uniqueNames.add(obj.name); // Add each name to the Set
  });

  return uniqueNames.size; // Return the size of the Set (number of unique names)
}

function getAddressBookNameItems(items, startIndex) {
    let nameItems = [];
    let name = items[startIndex].name;

    for (let i = startIndex; i < items.length; i++) {
        if (items[i].name != name) {
            break;
        }

        nameItems.push(items[i]);
    }

    return nameItems;
}

function printAddressGroups(items) {
    let addressItems = [];
    let contractAddresses = [];

    for (let i = 0; i < items.length; i++) {
        if (isP2pkAddress(items[i].address)) {
            addressItems.push(items[i]);
        } else {
            contractAddresses.push(items[i]);
        }
    }

    return printAddressGroup('Addresses', addressItems) + printAddressGroup('Contracts', contractAddresses);
}

function printAddressGroup(title, items) {
    if (items.length == 0) {
        return '';
    }

    let formattedResult = '<div class="addressbook-address-group"><p><strong>' + title + ':</strong></p>';

    for (let i = 0; i < items.length; i++) {
        formattedResult += printAddress(items[i]);
    }

    return formattedResult + '</div>';
}

function isP2pkAddress(address) {
    try {
        return qfleetSDKcore.ErgoAddress.getAddressType(address) == qfleetSDKcore.AddressType.P2PK;
    } catch {
        return false;
    }
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
