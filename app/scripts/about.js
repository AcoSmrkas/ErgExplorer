$(function() {
    $('#address').attr('href', getWalletAddressUrl(DONATION_ADDRESS));
    $('#address').html(DONATION_ADDRESS);
    $('#address').after(' ' + copyIcon(DONATION_ADDRESS));
});
