const GATEWAY_HOST = 'https://chain.mewfinance.com/';
const MEMPOOL_REFRESH_MS = 20000;
// The gateway serves node boxes, which have this tree where the other two sources have FEE_ADDRESS
const FEE_ERGO_TREE = '1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304';

let shownMempoolRows = null;

$(function() {
    // Erg Explorer Live streams mainnet only
    if (networkType == 'testnet') {
        $('#liveCta').remove();
    }

    printMempool();
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

    // The refresh mostly finds nothing new: leave the rows, and any text selected in them, alone then.
    // Times count as new: rows from the gateway get their ages once our node's pool is back.
    const shownRows = items.map(item => item.id + ':' + item.creationTimestamp).join();
    if (shownRows !== shownMempoolRows) {
        shownMempoolRows = shownRows;
        $('#transactionsTableBody').html(items.length > 0
            ? items.map(formatMempoolRow).join('')
            : '<td colspan="12" class="p-2">No transactions currently in mempool.</td>');
    }

    $('#mempoolHolder').show();
}

function formatMempoolRow(item) {
    let row = '<tr>';

    //Id
    row += '<td><span class="d-lg-none"><strong>Id: </strong></span><a href="' + getTransactionsUrl(item.id) + '">' + formatAddressString(item.id, 40) + '</a></td>';

    //Age
    row += '<td><span class="d-lg-none"><strong>Age: </strong></span>' + formatAgeHtml(item.creationTimestamp) + '</td>';

    //Inputs
    row += '<td><span class="d-lg-none"><strong>Inputs: </strong></span>' + item.inputs.length + '</td>';

    //Outputs
    row += '<td><span class="d-lg-none"><strong>Outputs: </strong></span>' + item.outputs.length + '</td>';

    //Size
    row += '<td><span class="d-lg-none"><strong>Size: </strong></span>' + formatKbSizeString(item.size) + '</td>';

    //Fee
    row += '<td><span class="d-lg-none"><strong>Fee: </strong></span>' + formatFeeHtml(item) + '</td>';

    return row + '</tr>';
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
        .filter(output => output.address === FEE_ADDRESS || output.ergoTree === FEE_ERGO_TREE)
        .reduce((total, output) => total + output.value, 0);

    return fee > 0 ? formatErgValueString(fee) : '<span class="text-light">&mdash;</span>';
}
