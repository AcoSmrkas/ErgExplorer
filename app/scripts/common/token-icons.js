var tokenIcons = [];
//TokenIconsArrayStart
tokenIcons['3405d8f709a19479839597f9a22a7553bdfc1a590a427572787d7c44a88b6386'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/3405d8f709a19479839597f9a22a7553bdfc1a590a427572787d7c44a88b6386.svg';
tokenIcons['0779ec04f2fae64e87418a1ad917639d4668f78484f45df962b0dec14a2591d2'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/0779ec04f2fae64e87418a1ad917639d4668f78484f45df962b0dec14a2591d2.svg';
tokenIcons['02f31739e2e4937bb9afb552943753d1e3e9cdd1a5e5661949cb0cef93f907ea'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/02f31739e2e4937bb9afb552943753d1e3e9cdd1a5e5661949cb0cef93f907ea.svg';
tokenIcons['6de6f46e5c3eca524d938d822e444b924dbffbe02e5d34bd9dcd4bbfe9e85940'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/6de6f46e5c3eca524d938d822e444b924dbffbe02e5d34bd9dcd4bbfe9e85940.svg';
tokenIcons['d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/d71693c49a84fbbecd4908c94813b46514b18b67a99952dc1e6e4791556de413.svg';
tokenIcons['007fd64d1ee54d78dd269c8930a38286caa28d3f29d27cadcb796418ab15c283'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/007fd64d1ee54d78dd269c8930a38286caa28d3f29d27cadcb796418ab15c283.svg';
tokenIcons['00b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf3'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/00b1e236b60b95c2c6f8007a9d89bc460fc9e78f98b09faec9449007b40bccf3.svg';
tokenIcons['472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/472c3d4ecaa08fb7392ff041ee2e6af75f4a558810a74b28600549d5392810e8.svg';
tokenIcons['03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/03faf2cb329f2e90d6d23b58d91bbb6c046aa143261cc21f52fbe2824bfcbf04.svg';
tokenIcons['fcfca7654fb0da57ecf9a3f489bcbeb1d43b56dce7e73b352f7bc6f2561d2a1b'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/fcfca7654fb0da57ecf9a3f489bcbeb1d43b56dce7e73b352f7bc6f2561d2a1b.svg';
tokenIcons['089990451bb430f05a85f4ef3bcb6ebf852b3d6ee68d86d78658b9ccef20074f'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/089990451bb430f05a85f4ef3bcb6ebf852b3d6ee68d86d78658b9ccef20074f.svg';
tokenIcons['9a06d9e545a41fd51eeffc5e20d818073bf820c635e2a9d922269913e0de369d'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/9a06d9e545a41fd51eeffc5e20d818073bf820c635e2a9d922269913e0de369d.svg';
tokenIcons['00bd762484086cf560d3127eb53f0769d76244d9737636b2699d55c56cd470bf'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/00bd762484086cf560d3127eb53f0769d76244d9737636b2699d55c56cd470bf.svg';
tokenIcons['18c938e1924fc3eadc266e75ec02d81fe73b56e4e9f4e268dffffcb30387c42d'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/18c938e1924fc3eadc266e75ec02d81fe73b56e4e9f4e268dffffcb30387c42d.svg';
tokenIcons['01dce8a5632d19799950ff90bca3b5d0ca3ebfa8aaafd06f0cc6dd1e97150e7f'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/01dce8a5632d19799950ff90bca3b5d0ca3ebfa8aaafd06f0cc6dd1e97150e7f.svg';
tokenIcons['0cd8c9f416e5b1ca9f986a7f10a84191dfb85941619e49e53c0dc30ebf83324b'] = 'https://raw.githubusercontent.com/ergolabs/ergo-dex-asset-icons/master/light/0cd8c9f416e5b1ca9f986a7f10a84191dfb85941619e49e53c0dc30ebf83324b.svg';
//TokenIconsArrayStop

function hasIcon(tokenId) {
	return tokenIcons[tokenId] != undefined;
}

function getIcon(tokenId) {
	return tokenIcons[tokenId];
}

function addIcon(tokenId) {
	if (hasIcon(tokenId)) {
		return;
	}

	$.get(ERGEXPLORER_API_HOST + 'tokens/addIcon?id=' + tokenId);
}