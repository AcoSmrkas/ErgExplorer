$(function() {
    $('#address').attr('href', getWalletAddressUrl(DONATION_ADDRESS));
    $('#address').html(DONATION_ADDRESS);
});

function copyErgoWalletAddress(e) {
	copyToClipboard(e, DONATION_ADDRESS);
}