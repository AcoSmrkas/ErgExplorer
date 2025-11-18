let circulatingSupply = 0;

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

$(function() {
    getRichList();
});

function getRichList() {
    // Fetch both rich list and supply data in parallel
    Promise.all([
        fetch('https://api.ergo.watch/lists/addresses/by/balance?limit=100').then(r => r.json()),
        fetch('https://api.ergoplatform.com/info').then(r => r.json())
    ])
    .then(([richListData, infoData]) => {
        circulatingSupply = infoData.supply;
        printRichList(richListData);
        calculateAndDisplayStats(richListData);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        showLoadError('Error fetching rich list or supply data.');
        $('#txLoading').hide();
    });
}

function printRichList(data) {
    let html = '';
    let rank = 1;
    const nanoErgsPerErg = 1000000000;
    const supplyErg = circulatingSupply / nanoErgsPerErg;

    data.forEach(item => {
        addAddress(item.address);
        const balanceErg = item.balance / nanoErgsPerErg;
        const percentOfSupply = (balanceErg / supplyErg) * 100;

        html += `
            <tr>
                <td><span class="d-lg-none"><strong>Rank: </strong></span>${rank}</td>
                <td><span class="d-lg-none"><strong>Address: </strong></span><a class="address-string" addr="${item.address}" href="${getWalletAddressUrl(item.address)}" >${formatAddressString(item.address, 8)}</a></td>
                <td class="text-end"><span class="d-lg-none"><strong>Balance: </strong></span>${nFormatter(balanceErg, 2, true)} <strong class="erg-span">ERG</strong></td>
                <td class="text-end"><span class="d-lg-none"><strong>% of Supply: </strong></span>${percentOfSupply.toFixed(3)}%</td>
            </tr>
        `;
        rank++;
    });

    $('#richListTableBody').html(html);
    $('#richListDataHolder').show();
    $('#txLoading').hide();

    getAddressesInfo();
}

function calculateAndDisplayStats(data) {
    const nanoErgsPerErg = 1000000000;

    // Convert all balances to ERG
    const balances = data.map(item => item.balance / nanoErgsPerErg);

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
    $('#stat-top100-percent').text(`${top100Percent.toFixed(2)}%`);

    $('#stat-cex-erg').html(`${nFormatter(cexTotal, 2, true)} <strong class="erg-span">ERG</strong>`);
    $('#stat-cex-percent').text(`${cexPercent.toFixed(2)}%`);

    $('#stat-supply').html(`${nFormatter(supplyErg, 2, true, true)} <strong class="erg-span">ERG</strong>`);
    $('#stat-supply-percent').text(`${supplyPercent.toFixed(2)}%`);

    // Show the stats holder
    $('#richListStatsHolder').show();
}
