const TOKEN_TYPE_PARAM = 'type';
const ORDER_BY_PARAM = 'order';
const QUERY_PARAM = 'query';
var addressType = 'all';
var orderBy = 'nameAsc';
var query = '';
var setup = true;

updateUi();

$(function() {  
    printAddresses();
});

function printAddresses() {
   var jqxhr = $.get(ERGEXPLORER_API_HOST + 'addressbook/getAddresses?offset=' + offset + '&limit=' + ITEMS_PER_PAGE + '&type=' + addressType + '&order=' + orderBy + '&query=' + encodeURIComponent(query) + '&testnet=' + (networkType == 'testnet' ? '1' : '0'),
    function (data) {
		let formattedResult = '';
		let items = data.items;

        if (data.total > 0) {
    		for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let nameItems = getAddressBookNameItems(items, i);

                formattedResult += '<div class="col-12 mb-md-3 ps-2 pe-2 ps-md-0 pe-md-0"><div class="row div-cell-dark">';
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
                            formattedResult += printToken(token);
                            break;
                        }
                    }
                }

                formattedResult += '</div>';
                formattedResult += '</div></div>';

                i += nameItems.length - 1;
    		}
        } else {
            formattedResult += '<div class="div-cell-dark mb-3">' + (query ? 'No address book entries matching "' + escapeHtml(query) + '".' : 'There are no entries in the address book.') + '</div>';
            $('[id=pagination]').remove();
        }

		$('#addressbookContentHolder').html(formattedResult);
        
        $('#addressbookHolder').show();
        
        setupPagination(data.total);

        printTemplateContracts();
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

function printToken(token) {
    let tokenName = token.tokenname ? escapeHtml(token.tokenname) : '';
    let shortId = formatAddressString(token.id, 18);
    let tokenLabel = tokenName || shortId;
    let idSuffix = tokenName && tokenName != token.id ? ' <span class="text-light">(' + shortId + ')</span>' : '';

    return '<br><p class="addressbook-token"><strong>Token: </strong><a href="' + getTokenUrl(token.id) + '">' + tokenLabel + idSuffix + '</a></p>';
}

function updateUi() {
    setupSearchInput();
    setupOrderSelect();
    setupTypeSelect();

    setup = false;
}

function setupSearchInput() {
    query = params[QUERY_PARAM];

    if (query == undefined) {
        query = '';
    } else {
        query = decodeURIComponent(query.replace(/\+/g, '%20'));
    }

    $('#addressbookSearchInput').val(query);
}

function onAddressBookSearch(e) {
    if (e) {
        e.preventDefault();
    }

    if (setup) {
        return;
    }

    setAddressBookSearchQuery($('#addressbookSearchInput').val());
}

function setAddressBookSearchQuery(searchQuery) {
    searchQuery = searchQuery.trim();

    if (searchQuery === '') {
        delete(params[QUERY_PARAM]);
    } else {
        params[QUERY_PARAM] = encodeURIComponent(searchQuery);
    }

    params['offset'] = 0;
    window.location.assign(getCurrentUrlWithParams());
}

function escapeHtml(value) {
    return $('<div>').text(value).html();
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

//ErgoTree search: contracts that run a known protocol script, found by the SHA-256 of
//their ErgoTree template, so contracts nobody added to the address book show up too.
//Anyone can deploy a contract with a known template, so a match tells which script a
//contract runs, never that it is the protocol's own.
const TEMPLATE_BOXES_PER_PAGE = 100;

//An all-time script loads its whole history at once; past this many boxes a build shows its oldest only
const ALL_TIME_MAX_BOXES = 2000;

//Shorter templates (a token check, a height lock) are shared by unrelated contracts
const MIN_TEMPLATE_BYTES = 40;

//A shorter query ("a", "er") would match nearly every contract name
const MIN_TEMPLATE_QUERY_LENGTH = 3;

var templateContracts = [];
var contractNamesImport = null;
var addressBookAddresses = null;

function loadContractNames() {
    if (contractNamesImport == null) {
        contractNamesImport = import('./addresses/contract-names.js?v=2').catch(function(e) {
            contractNamesImport = null;
            throw e;
        });
    }

    return contractNamesImport;
}

//Script matches follow the book's own entries as one result per protocol, on the first page only
function printTemplateContracts() {
    if (query.length < MIN_TEMPLATE_QUERY_LENGTH || offset != 0) {
        return;
    }

    loadContractNames().then(function(contractNames) {
        templateContracts = findTemplateContracts(contractNames.CONTRACT_TEMPLATES, query);

        let formattedResult = '';
        let protocols = new Set(templateContracts.map(contract => contract.protocol));

        for (const protocol of protocols) {
            formattedResult += printTemplateProtocol(protocol);
        }

        $('#addressbookContentHolder').append(formattedResult);
    })
    .catch(function() {
        $('#addressbookContentHolder').append('<div class="col-12 mb-md-3 ps-2 pe-2 ps-md-0 pe-md-0"><div class="div-cell-dark">Couldn\'t load the ErgoTree search.</div></div>');
    });
}

function printTemplateProtocol(protocol) {
    let formattedResult = '<div class="col-12 mb-md-3 ps-2 pe-2 ps-md-0 pe-md-0"><div class="row div-cell-dark">';
    formattedResult += '<div class="col-12 col-sm-12 col-lg-4 col-xl-3">';
    formattedResult += '<p><strong>Name: </strong>' + escapeHtml(protocol) + '</p>';
    //Anyone can deploy a contract with a known script, so a match proves nothing about who runs it
    formattedResult += '<p><strong>Type: </strong>Script match <span class="text-light">(unverified)</span></p>';
    formattedResult += '</div>';
    formattedResult += '<div class="col border-lg-start">';
    formattedResult += '<hr class="my-3 d-lg-none">';
    //Spent contracts hold nothing, so a list that includes them says so once, or per script if only some do
    let protocolContracts = templateContracts.filter(contract => contract.protocol == protocol);
    let allTime = protocolContracts.every(contract => contract.allTime);

    formattedResult += '<p><strong>Scripts:</strong>' + (allTime ? ' <span class="text-light">(all-time)</span>' : '') + '</p>';

    for (let i = 0; i < templateContracts.length; i++) {
        let contract = templateContracts[i];

        if (contract.protocol != protocol) {
            continue;
        }

        formattedResult += '<div class="template-contract">';
        formattedResult += '<a href="#" class="template-contract-toggle" onclick="toggleTemplateContract(event, ' + i + ')">'
            + '<i id="templateContractIcon' + i + '" class="fa-solid fa-chevron-right me-1"></i>' + escapeHtml(getTemplateScriptName(contract)) + '</a>';

        if (contract.allTime && !allTime) {
            formattedResult += ' <span class="text-light">(all-time)</span>';
        }

        formattedResult += '<div id="templateContract' + i + '" class="template-contract-addresses" style="display: none;"></div>';
        formattedResult += '</div>';
    }

    return formattedResult + '</div></div></div>';
}

//"Lithos Liquidity Pool" reads "Liquidity Pool" under its Lithos result
function getTemplateScriptName(contract) {
    let prefix = contract.protocol + ' ';

    return contract.name.startsWith(prefix) && contract.name.length > prefix.length ? contract.name.substring(prefix.length) : contract.name;
}

//One entry per contract name that holds every word of the query, with every searchable build of its script
function findTemplateContracts(contractTemplates, searchQuery) {
    let words = searchQuery.toLowerCase().split(/\s+/).filter(word => word != '');
    let contracts = [];
    let contractsByName = {};

    for (const contractTemplate of contractTemplates) {
        let name = contractTemplate.name;

        if (contractTemplate.exactTree || contractTemplate.template.length < MIN_TEMPLATE_BYTES * 2) {
            continue;
        }

        if (!words.every(word => name.toLowerCase().includes(word))) {
            continue;
        }

        if (contractsByName[name] == undefined) {
            contractsByName[name] = { protocol: contractTemplate.protocol, name: name, allTime: contractTemplate.allTime, templates: [], hashes: null, totals: null, history: null, page: 0, request: 0, loaded: false };
            contracts.push(contractsByName[name]);
        }

        contractsByName[name].templates.push(contractTemplate.template);
    }

    return contracts;
}

function toggleTemplateContract(e, index) {
    e.preventDefault();

    let contract = templateContracts[index];
    let holder = $('#templateContract' + index);

    if (holder.is(':visible')) {
        holder.hide();
        $('#templateContractIcon' + index).removeClass('fa-chevron-down').addClass('fa-chevron-right');
        return;
    }

    holder.show();
    $('#templateContractIcon' + index).removeClass('fa-chevron-right').addClass('fa-chevron-down');

    if (!contract.loaded) {
        loadTemplateContractPage(index, contract.page);
    }
}

function showTemplateContractPage(e, index, page) {
    e.preventDefault();

    loadTemplateContractPage(index, page);
}

function loadTemplateContractPage(index, page) {
    let contract = templateContracts[index];
    let request = ++contract.request;
    let holder = $('#templateContract' + index);

    holder.html('<p class="text-light">Loading...</p>');

    Promise.all([getTemplateHashes(contract), loadAddressBookAddresses()])
    .then(function(results) {
        let hashes = results[0];
        let offset = page * TEMPLATE_BOXES_PER_PAGE;

        //An all-time script pages its addresses, not its boxes: a pool that moved through hundreds of boxes is one address
        if (contract.allTime) {
            return contract.history || Promise.all(hashes.map(function(hash) {
                return fetchAllTemplateBoxes(hash).catch(function() {
                    return null;
                });
            }));
        }

        return Promise.all(hashes.map(function(hash, i) {
            //A build with fewer boxes than this page skips has nothing more to show
            if (contract.totals != null && contract.totals[i] != null && contract.totals[i] <= offset) {
                return { items: [], total: contract.totals[i] };
            }

            //A build that fails (the explorer times out on some big ones) is marked, not dropped
            return fetchTemplateBoxes(hash, offset).catch(function() {
                return null;
            });
        }));
    })
    .then(function(pages) {
        if (request != contract.request) {
            return;
        }

        if (pages.every(templatePage => templatePage == null)) {
            throw new Error('No build of the script could be loaded');
        }

        contract.totals = pages.map(templatePage => templatePage == null ? null : templatePage.total);
        contract.history = contract.allTime && !pages.includes(null) ? pages : null;
        contract.page = page;
        contract.loaded = true;

        holder.html(formatTemplateContractPage(index, contract, pages));
    })
    .catch(function() {
        if (request != contract.request) {
            return;
        }

        holder.html('<p>Couldn\'t load. <a href="#" onclick="showTemplateContractPage(event, ' + index + ', ' + page + ')">Try again</a></p>');
    });
}

function getTemplateHashes(contract) {
    if (contract.hashes == null) {
        contract.hashes = Promise.all(contract.templates.map(sha256Hex)).catch(function(e) {
            contract.hashes = null;
            throw e;
        });
    }

    return contract.hashes;
}

function sha256Hex(hex) {
    let bytes = new Uint8Array(hex.match(/../g).map(byte => parseInt(byte, 16)));

    return crypto.subtle.digest('SHA-256', bytes).then(function(digest) {
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    });
}

//Unspent boxes whose ErgoTree has this template (or every box ever, spent too), oldest first
function fetchTemplateBoxes(hash, offset, allTime) {
    let apiHost = API_HOST.endsWith('/api/v1/') ? API_HOST : API_HOST + 'api/v1/';

    return Promise.resolve($.ajax({
        url: apiHost + 'boxes/' + (allTime ? '' : 'unspent/') + 'byErgoTreeTemplateHash/' + hash + '?offset=' + offset + '&limit=' + TEMPLATE_BOXES_PER_PAGE,
        timeout: 30000
    }))
    .then(function(data) {
        if (!data || !Array.isArray(data.items) || typeof data.total != 'number') {
            throw new Error('Unexpected template search response');
        }

        return data;
    });
}

//Every box ever created with this template, up to ALL_TIME_MAX_BOXES, as one page
function fetchAllTemplateBoxes(hash) {
    return fetchTemplateBoxes(hash, 0, true).then(function(firstPage) {
        let offsets = [];

        for (let offset = TEMPLATE_BOXES_PER_PAGE; offset < Math.min(firstPage.total, ALL_TIME_MAX_BOXES); offset += TEMPLATE_BOXES_PER_PAGE) {
            offsets.push(offset);
        }

        return Promise.all(offsets.map(offset => fetchTemplateBoxes(hash, offset, true))).then(function(laterPages) {
            return { items: firstPage.items.concat(...laterPages.map(templatePage => templatePage.items)), total: firstPage.total };
        });
    });
}

//Every address in the book, so the search lists only the contracts it doesn't already name.
//Without it the search still works, it just can't leave those out.
function loadAddressBookAddresses() {
    if (addressBookAddresses != null) {
        return Promise.resolve(addressBookAddresses);
    }

    return Promise.resolve($.get(ERGEXPLORER_API_HOST + 'addressbook/getAddresses?offset=0&limit=1000&type=&order=&query=&testnet=' + (networkType == 'testnet' ? '1' : '0')))
    .then(function(data) {
        addressBookAddresses = new Set(data.items.map(item => item.address));

        return addressBookAddresses;
    })
    .catch(function() {
        return null;
    });
}

function formatTemplateContractPage(index, contract, pages) {
    let total = contract.totals.reduce((sum, templateTotal) => sum + (templateTotal || 0), 0);
    let failedBuilds = pages.filter(templatePage => templatePage == null).length;
    let contractAddresses = new Set();
    let unreadableBoxes = 0;

    for (const templatePage of pages) {
        if (templatePage == null) {
            continue;
        }

        for (const box of templatePage.items) {
            //The API's own address field is a placeholder for ErgoTree v3 contracts, so the address comes from the tree
            let address = getTemplateBoxAddress(box);

            if (address == null) {
                unreadableBoxes++;
                continue;
            }

            contractAddresses.add(address);
        }
    }

    if (total == 0 && failedBuilds == 0) {
        return contract.allTime ? '<p>None yet.</p>' : '<p>None right now.</p>';
    }

    let formattedResult = '';
    let addresses = Array.from(contractAddresses).filter(address => addressBookAddresses == null || !addressBookAddresses.has(address));
    let inAddressBook = contractAddresses.size - addresses.length;
    let pageCount;

    if (contract.allTime) {
        pageCount = Math.max(1, Math.ceil(addresses.length / TEMPLATE_BOXES_PER_PAGE));
        addresses = addresses.slice(contract.page * TEMPLATE_BOXES_PER_PAGE, (contract.page + 1) * TEMPLATE_BOXES_PER_PAGE);
    } else {
        pageCount = Math.max(1, ...contract.totals.map(templateTotal => Math.ceil((templateTotal || 0) / TEMPLATE_BOXES_PER_PAGE)));
    }

    for (const address of addresses) {
        formattedResult += '<p><a class="text-nowrap" href="' + getWalletAddressUrl(address) + '">' + escapeHtml(formatAddressString(address, 25)) + '</a></p>';
    }

    if (inAddressBook > 0) {
        formattedResult += '<p class="text-light">' + formatInAddressBookNote(inAddressBook, contractAddresses.size) + '</p>';
    }

    if (contract.allTime && contract.totals.some(templateTotal => templateTotal > ALL_TIME_MAX_BOXES)) {
        formattedResult += '<p class="text-light">Oldest ' + ALL_TIME_MAX_BOXES + ' boxes only.</p>';
    }

    if (unreadableBoxes > 0) {
        formattedResult += '<p class="text-light">' + unreadableBoxes + (unreadableBoxes == 1 ? ' box' : ' boxes') + ' with an unreadable ErgoTree.</p>';
    }

    if (failedBuilds > 0) {
        formattedResult += '<p>Couldn\'t load ' + failedBuilds + ' of ' + contract.templates.length + ' builds. '
            + '<a href="#" onclick="showTemplateContractPage(event, ' + index + ', ' + contract.page + ')">Try again</a></p>';
    }

    if (pageCount > 1) {
        let page = contract.page;

        formattedResult += '<div class="template-contract-pages">';
        formattedResult += '<button class="btn btn-info btn-sm"' + (page == 0 ? ' disabled' : '') + ' onclick="showTemplateContractPage(event, ' + index + ', ' + (page - 1) + ')">&lsaquo; Previous</button>';
        formattedResult += '<span class="text-light">Page ' + (page + 1) + ' of ' + pageCount + '</span>';
        formattedResult += '<button class="btn btn-info btn-sm"' + (page == pageCount - 1 ? ' disabled' : '') + ' onclick="showTemplateContractPage(event, ' + index + ', ' + (page + 1) + ')">Next &rsaquo;</button>';
        formattedResult += '</div>';
    }

    return formattedResult;
}

function formatInAddressBookNote(inAddressBook, addressCount) {
    if (inAddressBook == addressCount) {
        return 'Already in the address book.';
    }

    return inAddressBook + ' more in the address book.';
}

function getTemplateBoxAddress(box) {
    try {
        return qfleetSDKcore.ErgoAddress.fromErgoTree(box.ergoTree, getFleetNetwork()).toString();
    } catch (e) {
        return null;
    }
}
