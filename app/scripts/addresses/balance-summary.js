import { AddressState } from './state.js';
import { ApiClient } from './api-client.js';

/**
 * Balance summary display and token formatting
 */
export const BalanceSummary = {
	/**
	 * Print address summary with balance and tokens
	 */
	async printAddressSummary() {
		if (!gotPrices || AddressState.printedAddressSummary) return;

		AddressState.printedAddressSummary = true;

		try {
			const data = await ApiClient.getAddressSummary();
			this._displayBalance(data);
		} catch (error) {
			console.error('Failed to print address summary:', error);
			showLoadError('No results matching your query.');
		}
	},

	/**
	 * Display balance information on UI
	 */
	_displayBalance(data) {
		// ERG balance
		const ergBalance = formatErgValueString(data.confirmed.nanoErgs, 4, true);
		let balanceHtml = '<strong class="erg-span">ERG</strong><span class="gray-color"> balance:</span> <strong>' + ergBalance + '</strong>';

		const ergDollarValue = formatAssetDollarPrice(data.confirmed.nanoErgs, ERG_DECIMALS, 'ERG');
		if (gotPrices) {
			balanceHtml += ' ' + formatDollarPriceString(ergDollarValue, 2);
		}

		$('#finalErgBalance').html(balanceHtml);

		// Tokens
		if (data.confirmed.tokens && data.confirmed.tokens.length > 0) {
			$('#tokensHolder').show();

			AddressState.tokensArray = sortTokens(data.confirmed.tokens);

			const financialTokens = AddressState.tokensArray.filter((_, i, arr) => this._separateFinancialTokens(_, i, arr));
			const otherTokens = AddressState.tokensArray.filter((_, i, arr) => this._separateNonFinancialTokens(_, i, arr));

			if (financialTokens.length > 0) {
				const html = this._formatFinancialTokensHtmlString(financialTokens, ergDollarValue);
				$('#financialTokens').html(html);
				$('#financialAssetsHolder').show();
			}

			if (otherTokens.length > 0) {
				const html = this._formatOtherTokensHtmlString(otherTokens);
				$('#otherTokens').html(html);
				$('#otherTokensHolder').show();
			}
		}

		// Address display
		let addressString = AddressState.walletAddress;
		if (addressString.length > 70) {
			addressString = formatAddressString(addressString, 58);
		}

		$('#address').html(addressString + ' &#128203;');
		if (typeof getOfficialExplorereAddressUrl === 'function') {
			$('#officialLink').html(getOfficialExplorereAddressUrl(addressString));
			$('#officialLink').attr('href', getOfficialExplorereAddressUrl(AddressState.walletAddress));
			$('#officialLink').show();
		}
		$('#summaryOk').show();
	},

	/**
	 * Format financial tokens (tokens with prices)
	 */
	_formatFinancialTokensHtmlString(tokensArray, ergDollarValue) {
		let tokensToShow = AddressState.publicUser ? 15 : 6;
		AddressState.financialTokensContent = '';
		AddressState.financialTokensContentFull = '';
		let totalAssetsValue = 0;

		// Calculate prices and sort by USD value
		tokensArray.forEach(token => {
			let price = 0;
			if (gotPrices && prices[token.tokenId]) {
				price = formatAssetDollarPrice(token.amount, token.decimals, token.tokenId);
				totalAssetsValue += price;
			}
			token.usdPrice = price;
		});

		if (gotPrices) {
			tokensArray.sort((a, b) => (b.usdPrice || 0) - (a.usdPrice || 0));
		}

		let html = '';
		tokensArray.forEach((token, i) => {
			const isScan = AddressState.scamList.includes(token.tokenId);
			const priceStr = token.usdPrice > 0 ? '<span class="text-light"> ' + formatDollarPriceString(token.usdPrice) + '</span>' : '';
			const tokenStr = formatAssetNameAndValueString(
				getAssetTitle(token, true, isScan),
				formatAssetValueString(token.amount, token.decimals, 4) + priceStr,
				token.tokenId
			);

			AddressState.financialTokensContentFull += tokenStr;

			if (i <= tokensToShow) {
				html += tokenStr;
				if (i === tokensToShow && tokensArray.length > tokensToShow + 1) {
					html += '<p>...</p><p><strong><a href="#" onclick="showAllFinancialTokens(event)">Show all</a></strong></p>';
				}
			}
		});

		AddressState.financialTokensContent = html;

		if (totalAssetsValue > 0) {
			$('#finalAssetsBalance').html('<span class="gray-color">Tokens balance:</span> $' + formatValue(totalAssetsValue, 2));
			$('#finalAssetsBalance').show();
			$('#finalBalance').html('<span class="grey-color"><b>Total:</b></span> $' + formatValue(ergDollarValue + totalAssetsValue, 2));
			$('#finalBalance').show();
		}

		return AddressState.financialTokensContentFull;
	},

	/**
	 * Format non-financial tokens
	 */
	_formatOtherTokensHtmlString(tokensArray) {
		let tokensToShow = AddressState.publicUser ? 15 : 2;
		AddressState.tokensContent = '';
		AddressState.tokensContentFull = '';
		const nftSearchTokens = [];

		tokensArray.forEach((token, i) => {
			const isScan = AddressState.scamList.includes(token.tokenId);
			const tokenStr = formatAssetNameAndValueString(
				getAssetTitle(token, true, isScan),
				formatAssetValueString(token.amount, token.decimals, 4),
				token.tokenId
			);

			AddressState.tokensContentFull += tokenStr;
			nftSearchTokens.push(token.tokenId);

			if (i <= tokensToShow) {
				AddressState.tokensContent += tokenStr;
				if (i === tokensToShow && tokensArray.length > tokensToShow + 1) {
					AddressState.tokensContent += '<p>...</p><p><strong><a href="#" onclick="showAllTokens(event)">Show all</a></strong></p>';
				}
			}
		});

		// Fetch NFT info for these tokens
		if (nftSearchTokens.length > 0) {
			getNftsInfo(nftSearchTokens, window.onGotOwnedNftInfo);
		}

		return AddressState.tokensContentFull;
	},

	/**
	 * Check if token has price (is financial)
	 */
	_separateFinancialTokens(_, index, array) {
		const pricesKeys = Object.keys(prices || {});
		return pricesKeys.some(priceId => priceId === array[index].tokenId);
	},

	/**
	 * Check if token lacks price (is non-financial)
	 */
	_separateNonFinancialTokens(_, index, array) {
		const pricesKeys = Object.keys(prices || {});
		return !pricesKeys.some(priceId => priceId === array[index].tokenId);
	}
};
