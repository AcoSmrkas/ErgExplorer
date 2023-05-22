function copyErgoWalletAddress(e) {
	navigator.clipboard.writeText(DONATION_ADDRESS);

	e.preventDefault();

	showToast();
}