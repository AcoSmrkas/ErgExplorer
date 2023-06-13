$(function() {
    $('#searchType').val('0');
});

function copyErgoWalletAddress(e) {
	copyToClipboard(e, DONATION_ADDRESS);
}