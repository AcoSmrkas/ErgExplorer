$(function() {
    getRichList();
});

function getRichList() {
    fetch('https://api.ergo.watch/lists/addresses/by/balance?limit=100')
        .then(response => response.json())
        .then(data => {
            printRichList(data);
        })
        .catch(error => {
            console.error('Error fetching rich list:', error);
            showLoadError('Error fetching rich list.');
            $('#txLoading').hide();
        });
}

function printRichList(data) {
    let html = '';
    let rank = 1;

    data.forEach(item => {
        addAddress(item.address);
        html += `
            <tr>
                <td><span class="d-lg-none"><strong>Rank: </strong></span>${rank}</td>
                <td><span class="d-lg-none"><strong>Address: </strong></span><a class="address-string" addr="${item.address}" href="${getWalletAddressUrl(item.address)}" >${formatAddressString(item.address, 8)}</a></td>
                <td class="text-end"><span class="d-lg-none"><strong>Balance: </strong></span>${nFormatter(item.balance / 1000000000, 2, true)} <strong class="erg-span">ERG</strong></td>
            </tr>
        `;
        rank++;
    });

    $('#richListTableBody').html(html);
    $('#richListDataHolder').show();
    $('#txLoading').hide();

    getAddressesInfo();
}
