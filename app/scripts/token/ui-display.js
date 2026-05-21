import { TokenState } from './state.js';
import { TokenAnalyzer } from './token-analyzer.js';

function getTokenUsdPrice() {
	if (typeof prices === 'undefined') return 0;

	const price = Number(prices[TokenState.tokenId]);
	return Number.isFinite(price) && price > 0 ? price : 0;
}

function formatTokenDollarPrice(tokenAmount, tokenDecimals) {
	const price = getTokenUsdPrice();
	if (!price) return '';

	const tokenValue = typeof getAssetValue === 'function'
		? getAssetValue(tokenAmount, tokenDecimals)
		: tokenAmount / Math.pow(10, tokenDecimals);
	const dollarValue = tokenValue * price;

	if (!Number.isFinite(dollarValue) || dollarValue <= 0) return '';

	return typeof formatDollarPriceString === 'function'
		? formatDollarPriceString(dollarValue)
		: '($' + dollarValue.toFixed(2) + ')';
}

function formatTokenDollarPriceHtml(tokenAmount, tokenDecimals) {
	const dollarPrice = formatTokenDollarPrice(tokenAmount, tokenDecimals);
	return dollarPrice ? ' <span class="text-light">' + dollarPrice + '</span>' : '';
}

function renderHolderCount() {
	const count = Math.max(TokenState.holderCount || 0, TokenState.holders ? TokenState.holders.length : 0);
	const formattedCount = typeof nFormatter === 'function' ? nFormatter(count) : count;
	const html = count > 0 ? `(of total ${formattedCount})` : '';

	$('#totalHolderCount').html(html);
	$('#totalHolderCountStandalone').html(html);
}

function setHoldersLayout(hasChart) {
	$('#priceInfo').toggleClass('holders-only', !hasChart);
	$('#financeHeader').toggle(hasChart);
	$('#chartColumn').toggle(hasChart);
	$('#holdersSectionHeader').toggle(!hasChart);
	$('#holdersInlineHeader, #totalHolderCount').toggle(hasChart);
	$('#holdersColumn').toggleClass('col-xl-6', hasChart);
}

export const TokenUIDisplay = {
	// Display token supply information
	printSupplyInfo() {
		if (!TokenState.amountsData || !TokenState.tokenData) return;

		const tokenUsdPrice = getTokenUsdPrice();
		let hasData = false;
		let tokenNameHtml = typeof getAssetTitleParams === 'function' ?
			getAssetTitleParams(TokenState.tokenData, TokenState.tokenData.id, TokenState.tokenData.name, false) :
			TokenState.tokenData.name;

		// Market Cap
		if (TokenState.amountsData.liquid_supply !== undefined && tokenUsdPrice) {
			let marketCap = TokenState.amountsData.liquid_supply * tokenUsdPrice;
			$('#tokenMarketCap').html('$' + (typeof nFormatter === 'function' ? nFormatter(marketCap, 2, true) : marketCap));
			$('#tokenMarketCapRow').show();
			hasData = true;
		} else {
			$('#tokenMarketCapRow').remove();
		}

		// Liquid Supply
		if (TokenState.amountsData.liquid_supply !== undefined) {
			let liquidHtml = (typeof nFormatter === 'function' ? nFormatter(TokenState.amountsData.liquid_supply, 0, true) : TokenState.amountsData.liquid_supply) + ' ' + tokenNameHtml;
			if (tokenUsdPrice) {
				liquidHtml += ' <span class="text-light">($' + (typeof nFormatter === 'function' ? nFormatter(TokenState.amountsData.liquid_supply * tokenUsdPrice, 2) : TokenState.amountsData.liquid_supply * tokenUsdPrice) + ')</span>';
			}
			$('#tokenLiquidSupply').html(liquidHtml);
			$('#tokenLiquidSupplyRow').show();
			hasData = true;
		} else {
			$('#tokenLiquidSupplyRow').remove();
		}

		// Locked Supply
		if (TokenState.amountsData.locked_supply !== undefined && TokenState.amountsData.locked_supply > 0) {
			let lockedHtml = (typeof nFormatter === 'function' ? nFormatter(TokenState.amountsData.locked_supply, 0, true) : TokenState.amountsData.locked_supply) + ' ' + tokenNameHtml;
			if (tokenUsdPrice) {
				lockedHtml += ' <span class="text-light">($' + (typeof nFormatter === 'function' ? nFormatter(TokenState.amountsData.locked_supply * tokenUsdPrice, 2) : TokenState.amountsData.locked_supply * tokenUsdPrice) + ')</span>';
			}
			$('#tokenLockedSupply').html(lockedHtml);
			$('#tokenLockedSupplyRow').show();
			hasData = true;
		} else {
			$('#tokenLockedSupplyRow').remove();
		}

		// Burned Supply
		if (TokenState.amountsData.burned_supply !== undefined && TokenState.amountsData.burned_supply > 0) {
			let burnedHtml = (typeof nFormatter === 'function' ? nFormatter(TokenState.amountsData.burned_supply, 0, true) : TokenState.amountsData.burned_supply) + ' ' + tokenNameHtml;
			if (tokenUsdPrice) {
				burnedHtml += ' <span class="text-light">($' + (typeof nFormatter === 'function' ? nFormatter(TokenState.amountsData.burned_supply * tokenUsdPrice, 2) : TokenState.amountsData.burned_supply * tokenUsdPrice) + ')</span>';
			}
			$('#tokenBurnedSupply').html(burnedHtml);
			$('#tokenBurnedSupplyRow').show();
			hasData = true;
		} else {
			$('#tokenBurnedSupplyRow').remove();
		}

		if (hasData) {
			$('#supplyHolder').show();
			$('#supplyInfoHolder > div:visible').each(function(index) {
				$(this).css('background-color', index % 2 === 0 ? 'var(--striped-1)' : '');
			});
		}
	},

	// Display transactions
	printTxs(data) {
		if (!data || data.length === 0 || !TokenState.tokenData) {
			$('#txsLoading').hide();
			return;
		}

		$('#txsHolder').show();
		$('#txsLoading').hide();

		let html = '';
		for (let i = 0; i < data.length; i++) {
			let item = data[i];
			html += '<tr>';
			html += '<td><span class="d-lg-none"><strong>Tx: </strong></span><a href="' + (typeof getTransactionsUrl === 'function' ? getTransactionsUrl(item.txId) : '#') + '"><i class="fas fa-link text-info"></i></a><span class="d-inline d-lg-none text-white float-end">' + (typeof formatDateString === 'function' ? formatDateString(item.timestamp) : item.timestamp) + '</span></td>';
			html += '<td class="d-none d-lg-table-cell"><span class="d-lg-none"><strong>Time: </strong></span>' + (typeof formatDateString === 'function' ? formatDateString(item.timestamp) : item.timestamp) + '</td>';

			let blockNr = item.blockHeight;
			html += '<td><span class="d-inline d-lg-none float-end"><strong>Block: </strong><a href="' + (typeof getBlockUrl === 'function' ? getBlockUrl(item.blockId) : '#') + '">' + blockNr + '</a></span><span class="d-none d-lg-inline"><a href="' + (typeof getBlockUrl === 'function' ? getBlockUrl(item.blockId) : '#') + '">' + blockNr + '</a></span></td>';

			const fromAddress = item.inputs && item.inputs.length == 1 ? item.inputs[0].address : 'Multiple';
			if (typeof addAddress === 'function') addAddress(fromAddress);
			let formattedAddressString = typeof formatTxAddressString === 'function' ? formatTxAddressString(fromAddress) : fromAddress;
			html += '<td><span class="d-lg-none"><strong>From: </strong></span>' + formattedAddressString + '</td>';

			const toAddress = item.outputs && item.outputs.length == 1 ? item.outputs[0].address : 'Multiple';
			if (typeof addAddress === 'function') addAddress(toAddress);
			formattedAddressString = typeof formatTxAddressString === 'function' ? formatTxAddressString(toAddress) : toAddress;
			html += '<td><span class="d-lg-none"><strong>To: </strong></span>' + formattedAddressString + '</td>';

			let value = TokenAnalyzer.calculateTransferredAmount(item);
			let assetTitle = typeof getAssetTitleParams === 'function' ? getAssetTitleParams(TokenState.tokenData, TokenState.tokenData.id, TokenState.tokenData.name, false) : TokenState.tokenData.name;
			
			html += `<td><span class="text-white">`
				+ (typeof formatAssetValueString === 'function' ? formatAssetValueString(value, TokenState.tokenData.decimals, 4) : value)
				+ ' '
				+ assetTitle;

			html += formatTokenDollarPriceHtml(value, TokenState.tokenData.decimals);
			html += '</span></td>';

			html += '</tr>';
		}

		$('#txsTableBody').html(html);
		$('#txsTable').show();

		if (typeof getAddressesInfo === 'function') {
			getAddressesInfo();
		}
	},

	// Display swaps
	printSwaps(data) {
		if (!data || data.length === 0 || !TokenState.tokenData) {
			$('#swapsLoading').hide();
			return;
		}

		$('#swapsHolder').show();
		$('#swapsLoading').hide();

		let html = '';
		for (let i = 0; i < data.length; i++) {
			let item = data[i];

			if (item.buyasset == TokenState.tokenId) {
				item.type = 'Buy';
				item.amount = item.buyamount;
			} else {
				item.type = 'Sell';
				item.amount = item.sellamount;
			}

			let assetTitle = typeof getAssetTitleParams === 'function' ? getAssetTitleParams(TokenState.tokenData, TokenState.tokenData.id, TokenState.tokenData.name, false) : TokenState.tokenData.name;
			let amountWithDecimals = item.amount * Math.pow(10, TokenState.decimals);

			html += '<tr>';
			html += '<td><a class="address-string" addr="' + item.address + '" href="' + (typeof getWalletAddressUrl === 'function' ? getWalletAddressUrl(item.address) : '#') + '">' + (typeof formatAddressString === 'function' ? formatAddressString(item.address, 4) : item.address) + '</a></td>';
			html += '<td><span class="' + (item.type == 'Sell' ? 'text-danger' : 'text-success') + '">' + item.type + '</span></td>';
			html += '<td>'
				+ '<span class="text-white">'
					+ (typeof formatAssetValueString === 'function' ? formatAssetValueString(amountWithDecimals, TokenState.decimals, 4) : item.amount)
					+ ' '
					+ assetTitle
					+ formatTokenDollarPriceHtml(amountWithDecimals, TokenState.decimals)
				+ '</span>'
			+ '</td>';
			html += '<td>' + item.dexname + '</td>';
			html += '<td><a class="" href="' + (typeof getTransactionsUrl === 'function' ? getTransactionsUrl(item.txid) : '#') + '">' + (typeof formatAddressString === 'function' ? formatAddressString(item.txid, 4) : item.txid) + '</a></td>';
			html += '<td>' + (item.timestamp.indexOf('.') == -1 ? item.timestamp : item.timestamp.substr(0, item.timestamp.indexOf('.'))) + '</td>';
			html += '</tr>';
		}

		$('#swapsHeader').show();
		$('#swapsTableBody').html(html);
		$('#swapsTable').show();
	},

	// Display addressbook info
	printAddressbookAddress(item, first, last) {
		let classString = '';

		if (first && last) {
			classString = ' border-no-flat';
		} else if (first && !last) {
			classString = ' border-bottom-flat';
		} else if (!first && last) {
			classString = ' border-top-flat';
		}

		return '<div class="' + classString + '"><div class="p-2' + classString + '"><p><a href="' + (typeof getWalletAddressUrl === 'function' ? getWalletAddressUrl(item.address) : '#') + '">' + (typeof formatAddressString === 'function' ? formatAddressString(item.address, 35) : item.address) + '</a>' + (item.urltype == '' ? '' : ' <span class="text-light">(' + item.urltype + ')</span>') + '</p></div></div>';
	},

	// Display holders list
	printHolders(data) {
		if (!data || data.length === 0 || !TokenState.tokenData) return;

		TokenState.holders = data;
		let formattedResult = '';

		for (let i = 0; i < data.length; i++) {
			formattedResult += '<tr>';

			// Address
			if (typeof addAddress === 'function') addAddress(data[i].address);
			formattedResult += '<td>#' + (i+1) + ' <a class="address-string" addr="' + data[i].address + '" href="' + (typeof getWalletAddressUrl === 'function' ? getWalletAddressUrl(data[i].address) : '#') + '">' + (typeof formatAddressString === 'function' ? formatAddressString(data[i].address, 4) : data[i].address) + '</a></td>';

			// Balance
			let dollarPriceHtml = formatTokenDollarPriceHtml(data[i].balance, TokenState.decimals);

			let percent = '0.00';
			if (TokenState.amountsData) {
				const totalSupply = ((TokenState.amountsData.liquid_supply || 0) + (TokenState.amountsData.locked_supply || 0)) * Math.pow(10, TokenState.decimals);
				if (totalSupply > 0) {
					percent = (typeof formatValue === 'function' ? formatValue(data[i].balance * 100 / totalSupply, 2) : ((data[i].balance * 100 / totalSupply).toFixed(2)));
				}
			}

			let assetTitle = typeof getAssetTitleParams === 'function' ? getAssetTitleParams(TokenState.tokenData, TokenState.tokenId, TokenState.tokenData.name, false) : TokenState.tokenData.name;
			let assetValue = typeof formatAssetValueString === 'function' ? formatAssetValueString(data[i].balance, TokenState.decimals) : data[i].balance;

			formattedResult += '<td class="">' + assetValue + ' ' + assetTitle + dollarPriceHtml + '<span style="text-align:right;float:right;" class="d-inline d-lg-none text-white"> ' + percent + '%</span></td>';

			// Percent
			formattedResult += '<td class="d-none d-lg-table-cell" style="text-align:right;">' + percent + '%</td>';

			formattedResult += '</tr>';
		}

		$('#holdersTableBody').html(formattedResult);
		$('#holdersLoading').hide();
		$('#holdersTable').show();
		$('#priceInfo').show();
		$('#priceLoading').hide();

		if (typeof getAddressesInfo === 'function') {
			getAddressesInfo();
		}

		renderHolderCount();
		setHoldersLayout(TokenState.hasPrice && !!getTokenUsdPrice());
	},

	// Display holder count
	printHolderCount(data) {
		const count = typeof data === 'number' ? data : (data && data.total ? data.total : 0);
		TokenState.holderCount = count;
		renderHolderCount();

		if (Math.max(count, TokenState.holders ? TokenState.holders.length : 0) == 0) {
			$('#priceInfo').hide();
		} else {
			$('#priceInfo').show();
		}

		$('#priceLoading').hide();
	}
};
