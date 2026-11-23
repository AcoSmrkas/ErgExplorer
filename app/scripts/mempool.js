const GATEWAY_HOST = 'https://chain.mewfinance.com/';
const MEMPOOL_REFRESH_MS = 20000;
// The gateway serves node boxes, which have this tree where the other two sources have FEE_ADDRESS
const FEE_ERGO_TREE = '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304';

let shownMempoolRows = null;
let lastMempoolItems = null;

$(function() {
    // Erg Explorer Live streams mainnet only
    if (networkType == 'testnet') {
        $('#liveCta').remove();
    }

    printMempool();

    // Dollar values and contract names arrive after the first rows: draw those rows again with them
    getPrices(redrawMempoolRows);
    loadContractTemplates().then(function(analyzer) {
        contractAnalyzer = analyzer;
        redrawMempoolRows();
    });

    setInterval(updateAges, 1000);
    setInterval(() => {
        if (!document.hidden) printMempool(true);
    }, MEMPOOL_REFRESH_MS);
});

// Our node's pool first: it alone has both a total and when each tx arrived. The gateway has the same
// pool but no times, and the explorer's list intermittently returns empty pages (items: [] with
// total > 0) and misses txs that entered through other nodes. Each spells the sort its own way.
function getMempoolSources() {
    const query = '?limit=' + ITEMS_PER_PAGE + '&offset=' + offset + '&sortDirection=desc&sortBy=';

    if (!MEMPOOL_API_HOST) {
        return [() => $.get('https://api-testnet.ergoplatform.com/transactions/unconfirmed' + query + 'creationtimestamp')];
    }

    return [
        () => $.get(MEMPOOL_API_HOST + 'transactions' + query + 'creationTimestamp'),
        getGatewayPage,
        () => $.get('https://api.ergoplatform.com/transactions/unconfirmed' + query + 'creationtimestamp')
    ];
}

async function getGatewayPage() {
    const pool = await $.get(GATEWAY_HOST + 'transactions/unconfirmed?limit=500&offset=0');
    return { total: pool.length, items: pool.slice(Number(offset), Number(offset) + ITEMS_PER_PAGE) };
}

async function printMempool(isRefresh = false) {
    let data = null;

    for (const getPage of getMempoolSources()) {
        try {
            data = await getPage();
            break;
        } catch (error) {
            console.warn('Mempool source failed, trying the next:', error.statusText || error);
        }
    }

    $('#txLoading').hide();

    if (data) {
        printMempoolPage(data, isRefresh);
    } else if (!isRefresh) {
        showLoadError('Failed to fetch mempool transactions.');
    }
}

function printMempoolPage(data, isRefresh) {
    const items = data.items;

    // The pool shrank past this page while it was open
    if (offset > 0 && offset >= data.total) {
        offset = Math.max(0, (Math.ceil(data.total / ITEMS_PER_PAGE) - 1) * ITEMS_PER_PAGE);
        printMempool(isRefresh);
        return;
    }

    // An empty page of a pool that isn't empty is the glitch above: a refresh keeps what's on screen
    if (isRefresh && items.length == 0 && data.total > 0) return;

    setupPagination(data.total);
    $('#pagination').toggle(items.length > 0);
    $('#mempoolCount').html('<strong>' + Number(data.total).toLocaleString('en-US') + '</strong> ' + (data.total == 1 ? 'transaction' : 'transactions')).show();

    // The refresh mostly finds nothing new: leave the rows, and any text selected in them, alone then.
    // Times count as new: rows from the gateway get their ages once our node's pool is back.
    const shownRows = items.map(item => item.id + ':' + item.creationTimestamp).join();
    if (shownRows !== shownMempoolRows) {
        shownMempoolRows = shownRows;
        lastMempoolItems = items;
        drawMempoolRows(items);
    }

    $('#mempoolHolder').show();
}

function redrawMempoolRows() {
    if (lastMempoolItems) drawMempoolRows(lastMempoolItems);
}

function drawMempoolRows(items) {
    $('#transactionsTableBody').html(items.length > 0
        ? items.map(formatMempoolRow).join('')
        : '<td colspan="12" class="p-2">No transactions currently in mempool.</td>');

    lookupAddressNames();
}

// The address book's names. Rows draw again with them, since a name can also pick which address a
// side shows. Each address is asked about once, so that redraw doesn't ask again.
const askedAddresses = new Set();

function lookupAddressNames() {
    const fresh = addresses.filter(address => !askedAddresses.has(address));
    if (fresh.length == 0) return;

    fresh.forEach(address => askedAddresses.add(address));

    $.post(ERGEXPLORER_API_HOST + 'addressbook/getAddressesInfo', { addresses: addresses }, function(data) {
        if (data.total == 0) return;

        addressbook = data.items;
        redrawMempoolRows();
    });
}

function formatMempoolRow(item) {
    const flow = getMempoolFlow(item);
    let row = '<tr>';

    //Id
    row += '<td><span class="d-lg-none"><strong>Id: </strong></span><a href="' + getTransactionsUrl(item.id) + '">' + formatAddressString(item.id, 12) + '</a></td>';

    //Age
    row += '<td><span class="d-lg-none"><strong>Age: </strong></span>' + formatAgeHtml(item.creationTimestamp) + '</td>';

    //From
    row += '<td><span class="d-lg-none"><strong>From: </strong></span>' + formatMempoolParties(flow.senders, 'sending') + '</td>';

    //To
    row += '<td><span class="d-lg-none"><strong>To: </strong></span>' + formatMempoolParties(flow.receivers, 'receiving') + '</td>';

    //Value
    row += '<td><span class="d-lg-none"><strong>Value: </strong></span>' + formatMempoolValue(flow) + '</td>';

    //In/Out
    row += '<td><span class="d-lg-none"><strong>In/Out: </strong></span>' + item.inputs.length + ' &rarr; ' + item.outputs.length + '</td>';

    //Size
    row += '<td><span class="d-lg-none"><strong>Size: </strong></span>' + formatKbSizeString(item.size) + '</td>';

    //Fee
    row += '<td><span class="d-lg-none"><strong>Fee: </strong></span>' + formatFeeHtml(item) + '</td>';

    return row + '</tr>';
}

function isFeeBox(box) {
    return box.address === FEE_ADDRESS || box.ergoTree === FEE_ERGO_TREE;
}

// Who pays whom. Outputs back to a sender are change, so the receivers are everyone else. A tx that
// only pays its senders back (an oracle post, a contract updating its own box) moves nothing: its
// receivers are then those boxes, and its value is empty.
function getMempoolFlow(item) {
    const unique = list => [...new Set(list.filter(Boolean))];
    const senders = unique(item.inputs.map(getBoxAddress));
    const outputs = item.outputs.filter(output => !isFeeBox(output));
    const paid = outputs.filter(output => !senders.includes(getBoxAddress(output)));

    return {
        senders: senders,
        receivers: unique((paid.length > 0 ? paid : outputs).map(getBoxAddress)),
        value: paid.reduce((total, output) => total.plus(output.value.toString()), new BigNumber(0)),
        tokens: new Set(paid.flatMap(output => (output.assets || []).map(asset => asset.tokenId))).size
    };
}

function getPartyLabel(address) {
    return getOwner(address) || getContractLabel(address);
}

function isWalletAddress(address) {
    try {
        return qfleetSDKcore.ErgoAddress.getAddressType(address) == qfleetSDKcore.AddressType.P2PK;
    } catch {
        return false;
    }
}

// Several addresses on a side usually means a wallet using a contract (an oracle post spends the
// operator's wallet and the oracle's box). The wallet is who sent it; the named contract is what it's for.
function pickParty(parties, side) {
    const wallets = parties.filter(isWalletAddress);
    const named = parties.filter(getPartyLabel);
    const order = side == 'sending' ? [wallets, named] : [named, wallets];

    return (order.find(list => list.length == 1) || [])[0];
}

function formatMempoolParties(parties, side) {
    if (parties.length == 0) return '<span class="text-light">&mdash;</span>';

    parties.forEach(addAddress);

    const address = parties.length == 1 ? parties[0] : pickParty(parties, side);
    const others = parties.length - 1;
    const title = parties.length + ' ' + side + ' addresses. Check transaction link for more details.';

    if (address == undefined) {
        // Contracts of one service share the name before their role: "USD Oracle v2 (Refresh)"
        const names = new Set(parties.map(party => (getPartyLabel(party) || '').split(' (')[0]));
        const service = names.size == 1 ? [...names][0] : '';

        return '<span' + (service ? '' : ' class="text-light"') + ' title="' + title + '">' + (service || AddressType.Multiple) + '</span>';
    }

    return '<a class="address-string" title="' + address + '" addr="' + address + '" href="' + getWalletAddressUrl(address) + '">' +
        (getPartyLabel(address) || formatAddressString(address, 6)) + '</a>' +
        (others > 0 ? ' <span class="text-light" title="' + title + '">+' + others + '</span>' : '');
}

function formatMempoolValue(flow) {
    const tokens = flow.tokens > 0 ? ' <span class="text-light">+ ' + flow.tokens + (flow.tokens == 1 ? ' token' : ' tokens') + '</span>' : '';

    if (flow.value.isZero()) return tokens ? tokens.trim() : '<span class="text-light">&mdash;</span>';

    const dollars = formatAssetDollarPriceString(flow.value.toFixed(), ERG_DECIMALS, 'ERG');

    return '<span class="mempool-value">' + formatErgValueString(flow.value.toFixed(), 4, false, true) + (dollars ? ' <span class="text-light">' + dollars + '</span>' : '') + '</span>' + tokens;
}

// updateAges keeps these counting. The gateway has no times, so its rows have no age.
function formatAgeHtml(timestamp) {
    if (!timestamp) return '<span class="text-light">&mdash;</span>';

    return '<span class="mempool-age" data-time="' + timestamp + '" title="' + formatDateString(timestamp) + '">' + formatAge(timestamp) + '</span>';
}

function updateAges() {
    $('.mempool-age').each(function() {
        $(this).text(formatAge(Number($(this).attr('data-time'))));
    });
}

function formatAge(timestamp) {
    const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return seconds + 's ago';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + ' min ago';

    const hours = Math.floor(minutes / 60);
    return hours + (hours == 1 ? ' hour ago' : ' hours ago');
}

function formatFeeHtml(item) {
    const fee = item.outputs
        .filter(isFeeBox)
        .reduce((total, output) => total + output.value, 0);

    return fee > 0 ? formatErgValueString(fee, 4, false, true) : '<span class="text-light">&mdash;</span>';
}
