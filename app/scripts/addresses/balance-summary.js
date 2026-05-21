import { ApiClient } from './api-client.js?v=44';
import { AddressState } from './state.js';
import { isLpTokenData } from '../common/lp-tokens.js?v=2';

const LP_UNDERLYING_MIN_LIQUIDITY_ERG = 1000;

/**
 * Balance summary display and token formatting
 */
export const BalanceSummary = {
	_tokenHolderHeightObserver: null,
	_tokenHolderHeightResizeHandler: null,
	_underlyingTokenPriceCache: {},
	_underlyingTokenLiquidityCache: {},

	/**
	 * Print address summary with balance and tokens
	 */
	async printAddressSummary() {
		if (!gotPrices || AddressState.printedAddressSummary) return;

		AddressState.printedAddressSummary = true;

		try {
			const data = await ApiClient.getAddressSummary();
			await this._displayBalance(data);
		} catch (error) {
			console.error('Failed to print address summary:', error);
			showLoadError('No results matching your query.');
		}
	},

	/**
	 * Display balance information on UI
	 */
	async _displayBalance(data) {
		// ERG balance
		const ergBalance = formatErgValueString(data.confirmed.nanoErgs, 4, true);
		let balanceHtml = ergBalance;

		const ergDollarValue = formatAssetDollarPrice(data.confirmed.nanoErgs, ERG_DECIMALS, 'ERG');
		if (gotPrices) {
			balanceHtml += '<span class="address-balance-fiat">' + formatDollarPriceString(ergDollarValue, 2) + '</span>';
		}

		$('#finalErgBalance').html(this._formatBalanceRow('<span class="erg-span">ERG</span>', balanceHtml));

		// Tokens
		if (data.confirmed.tokens && data.confirmed.tokens.length > 0) {
			$('#tokensHolder').show();

			AddressState.tokensArray = sortTokens(data.confirmed.tokens);

			const financialTokens = AddressState.tokensArray.filter(token => this._isDirectFinancialToken(token));
			const lpTokens = AddressState.tokensArray.filter(token => !this._isDirectFinancialToken(token) && this._isLpToken(token));
			const lpTokenValues = await this._loadLpTokenValues(lpTokens);
			const pricedLpTokens = lpTokens.filter(token => lpTokenValues[token.tokenId] && lpTokenValues[token.tokenId].usdValue > 0);
			const unpricedLpTokens = lpTokens.filter(token => !lpTokenValues[token.tokenId] || lpTokenValues[token.tokenId].usdValue <= 0);
			let otherTokens = AddressState.tokensArray.filter(token => !this._isDirectFinancialToken(token) && !this._isLpToken(token));

			pricedLpTokens.forEach(token => {
				token.lpUsdPrice = lpTokenValues[token.tokenId].usdValue;
				token.lpEstimated = true;
			});
			otherTokens = otherTokens.concat(unpricedLpTokens);
			financialTokens.push(...pricedLpTokens);

			const visibleTokenGroupCount = [financialTokens, otherTokens].filter(tokens => tokens.length > 0).length;

			$('#tokensHolder').toggleClass('has-single-token-group', visibleTokenGroupCount === 1);

			if (financialTokens.length > 0) {
				const html = this._formatFinancialTokensHtmlString(financialTokens, ergDollarValue);
				$('#financialAssetsTitle').text('Financial assets (' + financialTokens.length + ')');
				$('#financialTokens').html(html);
				$('#financialAssetsHolder').show();
			}

			if (otherTokens.length > 0) {
				const html = this._formatOtherTokensHtmlString(otherTokens);
				$('#otherTokensTitle').text('Tokens (' + otherTokens.length + ')');
				$('#otherTokens').html(html);
				$('#otherTokensHolder').show();
				this._loadOtherTokensNftInfo(otherTokens);
			}
		}

		// Address display
		const addressString = this._formatAddressDisplay(AddressState.walletAddress);
		const compactAddressString = this._formatCompactAddressDisplay(AddressState.walletAddress);
		$('#address')
			.attr('title', AddressState.walletAddress)
			.empty()
			.append($('<span>').addClass('address-text-full').text(addressString))
			.append($('<span>').addClass('address-text-compact').text(compactAddressString))
			.append($('<span>').addClass('address-copy-icon').attr('aria-hidden', 'true').text('📋'));
		if (typeof getOfficialExplorereAddressUrl === 'function') {
			$('#officialLink').html(getOfficialExplorereAddressUrl(addressString));
			$('#officialLink').attr('href', getOfficialExplorereAddressUrl(AddressState.walletAddress));
			$('#officialLink').show();
		}
		$('#summaryOk').show();
		this._syncTokenHolderHeight();
	},

	_formatAddressDisplay(address) {
		if (!address) return '';
		return address.length > 70 ? formatAddressString(address, 58) : address;
	},

	_formatCompactAddressDisplay(address) {
		if (!address || address.length <= 24) return address || '';
		return address.substring(0, 12) + '...' + address.substring(address.length - 8);
	},

	/**
	 * Format financial tokens (tokens with prices)
	 */
	_formatFinancialTokensHtmlString(tokensArray, ergDollarValue) {
		let totalAssetsValue = 0;
		let html = '';

		// Calculate prices and sort by USD value
		tokensArray.forEach(token => {
			let price = token.lpUsdPrice || 0;
			if (!price && gotPrices && prices[token.tokenId]) {
				price = formatAssetDollarPrice(token.amount, token.decimals, token.tokenId);
			}
			totalAssetsValue += price;
			token.usdPrice = price;
		});

		if (gotPrices) {
			tokensArray.sort((a, b) => (b.usdPrice || 0) - (a.usdPrice || 0));
		}

		tokensArray.forEach(token => {
			const isScan = AddressState.scamList.includes(token.tokenId);
			const priceTitle = token.lpEstimated ? ' title="Estimated LP locked value"' : '';
			const priceStr = token.usdPrice > 0 ? '<span class="text-light"' + priceTitle + '> ' + formatDollarPriceString(token.usdPrice) + '</span>' : '';
			const tokenStr = formatAssetNameAndValueString(
				getAssetTitle(token, true, isScan),
				formatAssetValueString(token.amount, token.decimals, 4) + priceStr,
				token.tokenId
			);

			html += tokenStr;
		});

		if (totalAssetsValue > 0) {
			$('#finalAssetsBalance')
				.html(this._formatBalanceRow('Tokens', '$' + formatValue(totalAssetsValue, 2)))
				.css('display', 'grid');
			$('#finalBalance')
				.html(this._formatBalanceRow('Total', '$' + formatValue(ergDollarValue + totalAssetsValue, 2)))
				.css('display', 'grid');
		}

		return html;
	},

	async _loadLpTokenValues(lpTokens) {
		const values = {};
		if (!lpTokens || lpTokens.length === 0) return values;

		await Promise.all(lpTokens.map(async token => {
			try {
				const value = await this._getLpTokenValue(token);
				if (value && value.usdValue > 0) {
					values[token.tokenId] = value;
					AddressState.lpTokenValues[token.tokenId] = value;
				}
			} catch (error) {
				console.warn('Failed to estimate LP value:', token.tokenId, error);
			}
		}));

		return values;
	},

	async _getLpTokenValue(token) {
		const [tokenInfo, boxesData] = await Promise.all([
			ApiClient.getTokenInfo(token.tokenId),
			ApiClient.getUnspentBoxesByTokenId(token.tokenId)
		]);
		this._hydrateTokenMetadata(token, tokenInfo);

		const poolBox = this._findLpPoolBox(boxesData.items || [], token.tokenId, tokenInfo.emissionAmount);
		if (!poolBox) return null;
		if (poolBox.address === AddressState.walletAddress) return null;

		const lpReserve = this._getAssetAmount(poolBox, token.tokenId);
		const circulatingSupply = this._getLpCirculatingSupply(tokenInfo.emissionAmount, lpReserve);
		if (circulatingSupply <= 0) return null;

		const walletLpAmount = Number(token.amount);
		const walletLpAmountBigInt = this._safeBigInt(token.amount);
		const lpReserveBigInt = this._safeBigInt(lpReserve);
		if (walletLpAmountBigInt === lpReserveBigInt || walletLpAmount > circulatingSupply) return null;

		const poolUsdValue = await this._getLpPoolUsdValue(poolBox, token);
		if (poolUsdValue <= 0) return null;

		return {
			usdValue: poolUsdValue * walletLpAmount / circulatingSupply,
			poolUsdValue
		};
	},

	_hydrateTokenMetadata(token, tokenInfo) {
		if (!token || !tokenInfo) return;

		if (!token.name && tokenInfo.name) token.name = tokenInfo.name;
		if ((token.decimals === undefined || token.decimals === null) && tokenInfo.decimals !== undefined && tokenInfo.decimals !== null) {
			token.decimals = tokenInfo.decimals;
		}
	},

	_findLpPoolBox(boxes, lpTokenId, emissionAmount) {
		const emission = this._safeBigInt(emissionAmount);
		const candidateBoxes = boxes
			.map(box => {
				const lpAsset = (box.assets || []).find(asset => asset.tokenId === lpTokenId);
				const reserveAssets = this._getLpReserveAssets(box, lpTokenId);
				return {
					box,
					lpAmount: lpAsset ? this._safeBigInt(lpAsset.amount) : 0n,
					reserveAssets
				};
			})
			.filter(candidate => candidate.lpAmount > 0n && candidate.reserveAssets.length > 0);

		if (candidateBoxes.length === 0) return null;

		const poolCandidates = emission > 0n
			? candidateBoxes.filter(candidate => candidate.lpAmount > emission / 2n)
			: candidateBoxes;
		if (poolCandidates.length === 0) return null;

		poolCandidates.sort((a, b) => a.lpAmount > b.lpAmount ? -1 : 1);
		return poolCandidates[0].box;
	},

	_getLpReserveAssets(poolBox, lpTokenId) {
		return (poolBox.assets || []).filter(asset => {
			const amount = Number(asset.amount);
			if (asset.tokenId === lpTokenId) return false;
			if (asset.decimals === undefined || asset.decimals === null) return false;
			if (asset.index === 0 && amount === 1) return false;
			return amount > 0;
		});
	},

	_getAssetAmount(box, tokenId) {
		const asset = (box.assets || []).find(boxAsset => boxAsset.tokenId === tokenId);
		return asset ? asset.amount : 0;
	},

	_getLpCirculatingSupply(emissionAmount, poolLpReserveAmount) {
		const emission = this._safeBigInt(emissionAmount);
		const poolReserve = this._safeBigInt(poolLpReserveAmount);
		if (emission <= poolReserve) return 0;
		return Number(emission - poolReserve);
	},

	async _getLpPoolUsdValue(poolBox, lpToken) {
		const reserveAssets = this._getLpReserveAssets(poolBox, lpToken.tokenId);
		let totalUsdValue = this._shouldIncludeLpErgReserve(lpToken, reserveAssets)
			? formatAssetDollarPrice(poolBox.value, ERG_DECIMALS, 'ERG')
			: 0;

		const reserveValues = await Promise.all(reserveAssets.map(asset => this._getTokenReserveUsdValue(asset)));
		if (reserveValues.some(value => value === null)) return 0;

		reserveValues.forEach(value => {
			totalUsdValue += value;
		});

		return totalUsdValue;
	},

	_shouldIncludeLpErgReserve(lpToken, reserveAssets) {
		const name = (lpToken.name || '').toLowerCase();
		return reserveAssets.length === 1 || name.includes('erg/') || name.includes('/erg') || name.includes('ergo_');
	},

	async _getTokenReserveUsdValue(asset) {
		const hasEnoughLiquidity = await this._hasEnoughLpUnderlyingLiquidity(asset);
		if (!hasEnoughLiquidity) return null;

		const usdPrice = await this._getTokenUsdUnitPrice(asset.tokenId);
		if (!usdPrice || !asset.decimals && asset.decimals !== 0) return null;
		return Number(asset.amount) / Math.pow(10, asset.decimals) * usdPrice;
	},

	async _hasEnoughLpUnderlyingLiquidity(asset) {
		const tokenData = await this._getSpectrumTokenData(asset);
		if (!tokenData) return false;

		const liquidity = Number(tokenData.liquidity_erg !== undefined ? tokenData.liquidity_erg : tokenData.liquidity);
		return Number.isFinite(liquidity) && liquidity >= LP_UNDERLYING_MIN_LIQUIDITY_ERG;
	},

	async _getSpectrumTokenData(asset) {
		if (!asset || !asset.tokenId) return null;

		if (this._underlyingTokenLiquidityCache[asset.tokenId] !== undefined) {
			return this._underlyingTokenLiquidityCache[asset.tokenId];
		}

		const tokenData = Array.isArray(pricesData)
			? pricesData.find(token => token.id === asset.tokenId)
			: null;
		if (tokenData) {
			this._underlyingTokenLiquidityCache[asset.tokenId] = tokenData;
			return tokenData;
		}

		if (!asset.name) {
			this._underlyingTokenLiquidityCache[asset.tokenId] = null;
			return null;
		}

		try {
			const tokenList = await ApiClient.getSpectrumTokenList(asset.name);
			const matchedToken = Array.isArray(tokenList)
				? tokenList.find(token => token.id === asset.tokenId)
				: null;
			this._underlyingTokenLiquidityCache[asset.tokenId] = matchedToken || null;
			return this._underlyingTokenLiquidityCache[asset.tokenId];
		} catch (error) {
			console.warn('Failed to fetch Spectrum token liquidity:', asset.tokenId, error);
			this._underlyingTokenLiquidityCache[asset.tokenId] = null;
			return null;
		}
	},

	async _getTokenUsdUnitPrice(tokenId) {
		if (prices && prices[tokenId]) return prices[tokenId];
		if (this._underlyingTokenPriceCache[tokenId] !== undefined) {
			return this._underlyingTokenPriceCache[tokenId];
		}

		const tokenPriceData = Array.isArray(pricesData)
			? pricesData.find(token => token.id === tokenId)
			: null;
		if (tokenPriceData && tokenPriceData.price_erg && prices && prices.ERG) {
			this._underlyingTokenPriceCache[tokenId] = tokenPriceData.price_erg * prices.ERG;
			return this._underlyingTokenPriceCache[tokenId];
		}

		const tokenInfo = await ApiClient.getCruxTokenInfo(tokenId);
		const price = tokenInfo && tokenInfo.value_in_erg && prices && prices.ERG
			? tokenInfo.value_in_erg * prices.ERG
			: 0;
		this._underlyingTokenPriceCache[tokenId] = price;
		return price;
	},

	_safeBigInt(value) {
		try {
			if (value === undefined || value === null) return 0n;
			return BigInt(value);
		} catch (error) {
			return 0n;
		}
	},

	_formatBalanceRow(labelHtml, valueHtml) {
		return '<span class="address-balance-label">' + labelHtml + '</span><span class="address-balance-value">' + valueHtml + '</span>';
	},

	/**
	 * Format non-financial tokens
	 */
	_formatOtherTokensHtmlString(tokensArray, nftInfos = []) {
		const nftInfoByTokenId = this._getNftInfoByTokenId(nftInfos);
		const sortedTokens = this._sortOtherTokensByNftType(tokensArray, nftInfoByTokenId);
		let html = '';

		sortedTokens.forEach(token => {
			const isScan = AddressState.scamList.includes(token.tokenId);
			const tokenStr = formatAssetNameAndValueString(
				this._formatNftTypeIcon(nftInfoByTokenId[token.tokenId]) + getAssetTitle(token, true, isScan),
				formatAssetValueString(token.amount, token.decimals, 4),
				token.tokenId
			);

			html += tokenStr;
		});

		return html;
	},

	_loadOtherTokensNftInfo(tokensArray) {
		const nftSearchTokens = tokensArray.map(token => token.tokenId);

		if (nftSearchTokens.length > 0) {
			getNftsInfo(nftSearchTokens, (nftInfos, message) => {
				if (nftInfos && nftInfos.length > 0) {
					$('#otherTokens').html(this._formatOtherTokensHtmlString(tokensArray, nftInfos));
				}

				if (typeof window.onGotOwnedNftInfo === 'function') {
					window.onGotOwnedNftInfo(nftInfos, message);
				}
			});
		}
	},

	_getNftInfoByTokenId(nftInfos) {
		const nftInfoByTokenId = {};
		if (!nftInfos) return nftInfoByTokenId;

		nftInfos.forEach(nftInfo => {
			if (nftInfo && nftInfo.isNft && nftInfo.data && nftInfo.data.id) {
				nftInfoByTokenId[nftInfo.data.id] = nftInfo;
			}
		});

		return nftInfoByTokenId;
	},

	_sortOtherTokensByNftType(tokensArray, nftInfoByTokenId) {
		const nftTypeOrder = this._getNftTypeOrder();

		return tokensArray
			.map((token, index) => ({ token, index }))
			.sort((a, b) => {
				const aType = nftInfoByTokenId[a.token.tokenId] ? nftInfoByTokenId[a.token.tokenId].type : null;
				const bType = nftInfoByTokenId[b.token.tokenId] ? nftInfoByTokenId[b.token.tokenId].type : null;
				const aOrder = this._getNftTypeSortOrder(aType, nftTypeOrder);
				const bOrder = this._getNftTypeSortOrder(bType, nftTypeOrder);

				if (aOrder !== bOrder) return aOrder - bOrder;
				return a.index - b.index;
			})
			.map(item => item.token);
	},

	_getNftTypeOrder() {
		return {
			[NFT_TYPE.Image]: 0,
			[NFT_TYPE.Audio]: 1,
			[NFT_TYPE.Video]: 2,
			[NFT_TYPE.ArtCollection]: 3,
			[NFT_TYPE.FileAttachment]: 4,
			[NFT_TYPE.MembershipToken]: 5
		};
	},

	_getNftTypeSortOrder(type, nftTypeOrder) {
		if (!type) return 100;
		if (Object.prototype.hasOwnProperty.call(nftTypeOrder, type)) {
			return nftTypeOrder[type];
		}

		return 99;
	},

	_formatNftTypeIcon(nftInfo) {
		if (!nftInfo || !nftInfo.isNft) return '';

		const iconPath = this._getNftTypeIconPath(nftInfo.type);
		if (!iconPath) return '';

		return '<img class="token-icon nft-icon address-token-type-icon" title="' + nftInfo.type + ' NFT" alt="' + nftInfo.type + ' NFT" src="' + iconPath + '"/> ';
	},

	_getNftTypeIconPath(type) {
		switch (type) {
			case NFT_TYPE.Image:
				return './images/nft-image.png';
			case NFT_TYPE.Audio:
				return './images/nft-audio.png';
			case NFT_TYPE.Video:
				return './images/nft-video.png';
			case NFT_TYPE.ArtCollection:
				return './images/nft-artcollection.png';
			case NFT_TYPE.FileAttachment:
				return './images/nft-file.png';
			case NFT_TYPE.MembershipToken:
				return './images/nft-membership.png';
			default:
				return '';
		}
	},

	/**
	 * Keep desktop token lists capped to the summary holder height
	 */
	_syncTokenHolderHeight() {
		const summaryMain = document.getElementById('addressSummaryContent');
		const tokensHolder = document.getElementById('tokensHolder');
		if (!summaryMain || !tokensHolder) return;

		const syncHeight = () => {
			if (!window.matchMedia('(min-width: 992px)').matches) {
				tokensHolder.style.maxHeight = '';
				return;
			}

			const height = summaryMain.getBoundingClientRect().height;
			tokensHolder.style.maxHeight = height > 0 ? height + 'px' : '';
		};

		if (this._tokenHolderHeightObserver) {
			this._tokenHolderHeightObserver.disconnect();
		}

		if (this._tokenHolderHeightResizeHandler) {
			window.removeEventListener('resize', this._tokenHolderHeightResizeHandler);
		}

		if (typeof ResizeObserver !== 'undefined') {
			this._tokenHolderHeightObserver = new ResizeObserver(syncHeight);
			this._tokenHolderHeightObserver.observe(summaryMain);
		}

		this._tokenHolderHeightResizeHandler = syncHeight;
		window.addEventListener('resize', syncHeight);
		syncHeight();
	},

	/**
	 * Check if token has price (is financial)
	 */
	_separateFinancialTokens(_, index, array) {
		return this._isDirectFinancialToken(array[index]);
	},

	/**
	 * Check if token lacks price (is non-financial)
	 */
	_separateNonFinancialTokens(_, index, array) {
		return !this._isDirectFinancialToken(array[index]);
	},

	_isDirectFinancialToken(token) {
		const pricesKeys = Object.keys(prices || {});
		return pricesKeys.some(priceId => priceId === token.tokenId);
	},

	_isLpToken(token) {
		return isLpTokenData(token);
	}
};
