let circulatingSupply = 0;
// The holders and the two emission contracts by balance, all pages of them; a page shows a slice
let richList = [];
// ergo.watch's holders, without the emission contracts: what the stats count
let holders = [];

// Known CEX addresses
const CEX_ADDRESSES = [
    '9iKFBBrryPhBYVGDKHuZQW7SuLfuTdUJtTPzecbQ5pQQzD4VykC',
    '9gD9khJaxi3SvcX9VVPQ3vnV3xUTonVQe3Fvg5X7cGGbXMRgd8i',
    '9fpUtN7d22jS3cMWeZxBbzkdnHCB46YRJ8qiiaVo2wRCkaBar1Z',
    '9how9k2dp67jXDnCM6TeRPKtQrToCs5MYL2JoSgyGHLXm1eHxWs',
    '9heCed7HKoDwUXAnKU6P4mZZq1emzX7s4wLgaKziaEtxnVQEod2'
];

// Maximum ERG supply
const MAX_ERG_SUPPLY = 97739924;

const RICH_LIST_SIZE = 1000;
ITEMS_PER_PAGE = 100;

// ergo.watch leaves out the ERG not yet in circulation: the emission contract, which pays each block's
// reward, and the re-emission contract (EIP-27), which pays it out again later. Each is one box,
// found by the NFT it holds.
const EMISSION_CONTRACTS = [
    { name: 'Emission contract', nft: '20fa2bf23962cdf51b07722d6237c0c7b8a44f78856c0f7ec308dc1ef1a92a51' },
    { name: 'Re-emission contract', nft: 'd3feeffa87f2df63a7a15b4905e618ae3ce4c69a7975f171bd314d0b877927b8' }
];
const CHAIN_GATEWAY_HOST = 'https://chain.mewfinance.com/';

$(function() {
    loadPageAtOffset = showRichListPage;
    getRichList();

    // The list doesn't wait for prices: it shows again with the $ values once they're in
    getPrices(() => {
        if (richList.length > 0) printRichList();
        if (holders.length > 0) calculateAndDisplayStats();
    });
});

window.addEventListener('popstate', () => {
    delete params['offset'];
    readParams();
    showRichListPage(params['offset'], false);
});

function getRichList() {
    // Fetch both rich list and supply data in parallel
    Promise.all([
        fetch('https://api.ergo.watch/lists/addresses/by/balance?limit=' + RICH_LIST_SIZE).then(r => r.json()),
        fetch('https://api.ergoplatform.com/info').then(r => r.json()),
        getEmissionContracts()
    ])
    .then(([richListData, infoData, emissionContracts]) => {
        circulatingSupply = infoData.supply;
        richList = richListData
            .concat(emissionContracts)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, RICH_LIST_SIZE);

        holders = richListData;
        printRichList();
        calculateAndDisplayStats();
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        showLoadError('Error fetching rich list or supply data.');
        $('#txLoading').hide();
    });
}

// The list still shows without them if the gateway doesn't answer
function getEmissionContracts() {
    return Promise.all(EMISSION_CONTRACTS.map(contract =>
        fetch(CHAIN_GATEWAY_HOST + 'blockchain/box/unspent/byTokenId/' + contract.nft + '?offset=0&limit=1', { signal: AbortSignal.timeout(10000) })
            .then(r => r.json())
            .then(boxes => {
                const box = Array.isArray(boxes) ? boxes[0] : null;
                return box ? { address: box.address, balance: box.value, name: contract.name } : null;
            })
            .catch(error => {
                console.warn('No balance for the ' + contract.name + ':', error);
                return null;
            })
    )).then(contracts => contracts.filter(contract => contract != null));
}

function printRichList() {
    const lastOffset = Math.max(0, Math.ceil(richList.length / ITEMS_PER_PAGE) - 1) * ITEMS_PER_PAGE;
    offset = Math.max(0, Math.min(Number(offset) || 0, lastOffset));

    let html = '';
    const nanoErgsPerErg = 1000000000;
    const supplyErg = circulatingSupply / nanoErgsPerErg;

    richList.slice(offset, offset + ITEMS_PER_PAGE).forEach((item, i) => {
        const rank = offset + i + 1;
        const balanceErg = item.balance / nanoErgsPerErg;
        let addressHtml;
        let percentHtml;

        if (item.name) {
            addressHtml = `<a title="${item.address}" href="${getWalletAddressUrl(item.address)}">${item.name}</a>`;
            percentHtml = '<span title="Not in circulation yet: paid out to miners block by block">&mdash;</span>';
        } else {
            addAddress(item.address);
            addressHtml = `<a class="address-string" addr="${item.address}" href="${getWalletAddressUrl(item.address)}" >${formatAddressString(item.address, 8)}</a>`;
            percentHtml = ((balanceErg / supplyErg) * 100).toFixed(3) + '%';
        }

        html += `
            <tr>
                <td><span class="d-lg-none"><strong>Rank: </strong></span>${rank}</td>
                <td><span class="d-lg-none"><strong>Address: </strong></span>${addressHtml}</td>
                <td class="text-end"><span class="d-lg-none"><strong>Balance: </strong></span>${nFormatter(balanceErg, 2, true)} <strong class="erg-span">ERG</strong> <span class="text-light">${formatAssetDollarPriceString(item.balance, ERG_DECIMALS, 'ERG')}</span></td>
                <td class="text-end"><span class="d-lg-none"><strong>% of Supply: </strong></span>${percentHtml}</td>
            </tr>
        `;
    });

    $('#richListTableBody').html(html);
    setupPagination(richList.length);
    $('#richListDataHolder').show();
    $('#txLoading').hide();

    getAddressesInfo();
}

/**
 * Another page of the list, from the one already loaded: the page links (pagination.js) and
 * Back/Forward call this.
 */
function showRichListPage(pageOffset, addToHistory = true) {
    pageOffset = Number(pageOffset) || 0;
    if (pageOffset === Number(offset) || richList.length === 0) return;

    offset = pageOffset;
    params['offset'] = pageOffset;
    printRichList();

    if (addToHistory) {
        history.pushState(null, '', getUrlWithOffset(offset));
    }

    // Paged from the links below the table: back to its top
    if (document.documentElement.scrollTop > $('#richListDataHolder').offset().top) {
        scrollToElement($('#richListDataHolder'));
    }
}

function calculateAndDisplayStats() {
    const data = holders;
    const nanoErgsPerErg = 1000000000;

    // Convert the top 100's balances to ERG
    const balances = data.slice(0, 100).map(item => item.balance / nanoErgsPerErg);

    // Calculate totals
    const top100Total = balances.reduce((sum, bal) => sum + bal, 0);

    // Calculate circulating supply in ERG
    const supplyErg = circulatingSupply / nanoErgsPerErg;

    // Calculate CEX holdings
    const cexTotal = data
        .filter(item => CEX_ADDRESSES.includes(item.address))
        .reduce((sum, item) => sum + (item.balance / nanoErgsPerErg), 0);

    // Calculate percentages
    const top100Percent = (top100Total / supplyErg) * 100;
    const cexPercent = (cexTotal / supplyErg) * 100;
    const supplyPercent = (supplyErg / MAX_ERG_SUPPLY) * 100;

    // Update the DOM
    $('#stat-top100-erg').html(`${nFormatter(top100Total, 2, true)} <strong class="erg-span">ERG</strong>`);
    $('#stat-top100-usd').html(formatStatDollars(top100Total));
    $('#stat-top100-percent').text(`${top100Percent.toFixed(2)}%`);

    $('#stat-cex-erg').html(`${nFormatter(cexTotal, 2, true)} <strong class="erg-span">ERG</strong>`);
    $('#stat-cex-usd').html(formatStatDollars(cexTotal));
    $('#stat-cex-percent').text(`${cexPercent.toFixed(2)}%`);

    $('#stat-supply').html(`${nFormatter(supplyErg, 2, true, true)} <strong class="erg-span">ERG</strong>`);
    $('#stat-supply-usd').html(formatStatDollars(supplyErg));
    $('#stat-supply-percent').text(`${supplyPercent.toFixed(2)}%`);

    // Show the stats holder
    $('#richListStatsHolder').show();
}

// An amount in whole ERG, for the start of a card's small line: beside the ERG figure it wrapped below
// ~1200px and made the cards taller. Nothing until prices are in.
function formatStatDollars(ergAmount) {
    const dollars = formatAssetDollarPriceString(ergAmount, 0, 'ERG');
    return dollars ? dollars.replace(/^\(|\)$/g, '') + ' \u00b7 ' : '';
}
