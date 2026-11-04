import { ApiClient } from './api-client.js?v=59';
import { AddressState } from './state.js';
import { isLpTokenData } from '../common/lp-tokens.js?v=4';

// After a watched tx confirms, the balance indexers can trail the lookup that saw it confirm
// by a block or more: the balance is re-read this often, this many times, until it changes.
const BALANCE_RECHECK_MS = 10000;
const BALANCE_RECHECKS = 12;

/**
 * Balance summary display and token formatting
 */
export const BalanceSummary = {
	_tokenHolderHeightObserver: null,
	_tokenHolderHeightResizeHandler: null,
	_isLoading: false,
	// balanceKey of the balance on screen, and of the one a confirmed tx made stale
	_shownBalanceKey: null,
	_staleBalanceKey: null,
	_balanceRechecksLeft: 0,
	_balanceRecheckTimer: null,

	showLoading() {
		this._isLoading = true;
		$('#summaryOk').hide();
		this.syncLoadingVisibility();
	},

	syncLoadingVisibility() {
		if (!this._isLoading) {
			$('#summaryLoading').hide();
			return;
		}

		const txLoadingVisible = $('#txLoading').length > 0 && $('#txLoading').is(':visible');
		$('#summaryLoading').css('display', txLoadingVisible ? 'none' : 'flex');
	},

	/**
	 * Print address summary with balance and tokens
	 */
	async printAddressSummary() {
		// Prices are optional here: without them the balance shows without USD values.
		if (AddressState.printedAddressSummary) return;

		AddressState.printedAddressSummary = true;
		clearTimeout(this._balanceRecheckTimer);

		try {
			const staleKey = this._staleBalanceKey;
			const data = staleKey !== null
				? await ApiClient.getChangedAddressSummary(staleKey)
				: await ApiClient.getAddressSummary();

			this._shownBalanceKey = ApiClient.balanceKey(data);
			this._recheckWhileStale();
			await this._displayBalance(data);
		} catch (error) {
			this._recheckWhileStale();
			this._isLoading = false;
			$('#summaryLoading').hide();
			console.error('Failed to print address summary:', error);
			showLoadError('No results matching your query.');
		}
	},

	/**
	 * A watched tx confirmed (pending-tracker.js): the balance on screen is out of date.
	 */
	expectBalanceChange() {
		if (this._shownBalanceKey === null) return;

		this._staleBalanceKey = this._shownBalanceKey;
		this._balanceRechecksLeft = BALANCE_RECHECKS;
	},

	_recheckWhileStale() {
		if (this._staleBalanceKey === null) return;

		if (this._shownBalanceKey !== this._staleBalanceKey || this._balanceRechecksLeft-- <= 0) {
			this._staleBalanceKey = null;
			return;
		}

		this._balanceRecheckTimer = setTimeout(() => {
			AddressState.printedAddressSummary = false;
			this.printAddressSummary();
		}, BALANCE_RECHECK_MS);
	},

	/**
	 * Display balance information on UI
	 */
	async _displayBalance(data) {
		// ERG balance
		const ergBalance = formatErgValueString(data.confirmed.nanoErgs, 4, true, true);
		const ergDollarValue = formatAssetDollarPrice(data.confirmed.nanoErgs, ERG_DECIMALS, 'ERG');

		$('#finalErgBalance')
			.html(this._formatBalanceRow('ERG', ergBalance, formatDollarPriceString(ergDollarValue, 2)))
			.css('display', 'grid');

		// Tokens. A refresh can find fewer than before (a tx spent them), so a group left empty is hidden.
		const hasTokens = Boolean(data.confirmed.tokens && data.confirmed.tokens.length > 0);
		$('#tokensHolder').toggle(hasTokens);

		if (hasTokens) {
			AddressState.tokensArray = sortTokens(data.confirmed.tokens);

			const lpTokens = AddressState.tokensArray.filter(token => this._isLpToken(token));
			const financialTokens = AddressState.tokensArray.filter(token => !this._isLpToken(token) && this._isDirectFinancialToken(token));
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
			} else {
				$('#financialAssetsHolder').hide();
				this._hideTokenValueRows();
			}

			if (otherTokens.length > 0) {
				const html = this._formatOtherTokensHtmlString(otherTokens);
				$('#otherTokensTitle').text('Tokens (' + otherTokens.length + ')');
				$('#otherTokens').html(html);
				$('#otherTokensHolder').show();
				this._loadOtherTokensNftInfo(otherTokens);
			} else {
				$('#otherTokensHolder').hide();
			}
		} else {
			this._hideTokenValueRows();
		}

		this._renderAddressHeader();
		this._isLoading = false;
		$('#summaryLoading').hide();
		$('#summaryOk').show();
		this._syncTokenHolderHeight();
	},

	_renderAddressHeader() {
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
		let totalBalanceAssetsValue = 0;
		let totalLiquidityValue = 0;
		let html = '';

		// Calculate prices and sort by USD value
		tokensArray.forEach(token => {
			let price = token.lpUsdPrice || 0;
			if (!price && gotPrices && prices[token.tokenId]) {
				price = formatAssetDollarPrice(token.amount, token.decimals, token.tokenId);
			}
			if (token.lpEstimated) {
				totalLiquidityValue += price;
			} else {
				totalBalanceAssetsValue += price;
			}
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
				getAssetTitle(token, true, isScan, true),
				formatAssetValueString(token.amount, token.decimals, 4) + priceStr,
				token.tokenId
			);

			html += tokenStr;
		});

		const totalPortfolioValue = ergDollarValue + totalBalanceAssetsValue + totalLiquidityValue;

		if (totalBalanceAssetsValue > 0) {
			$('#finalAssetsBalance')
				.html(this._formatUsdBalanceRow('Tokens', totalBalanceAssetsValue))
				.css('display', 'grid');
		} else {
			$('#finalAssetsBalance').hide();
		}

		if (totalLiquidityValue > 0) {
			$('#finalLiquidityBalance')
				.html(this._formatUsdBalanceRow('Liquidity', totalLiquidityValue))
				.css('display', 'grid');
		} else {
			$('#finalLiquidityBalance').hide();
		}

		if (totalBalanceAssetsValue > 0 || totalLiquidityValue > 0) {
			$('#finalBalance')
				.html(this._formatUsdBalanceRow('Total', totalPortfolioValue))
				.css('display', 'grid');
		} else {
			$('#finalBalance').hide();
		}

		return html;
	},

	// Only financial tokens fill these rows, so a refresh that finds none must clear them.
	_hideTokenValueRows() {
		$('#finalAssetsBalance, #finalLiquidityBalance, #finalBalance').hide();
	},

	_formatUsdBalanceRow(labelHtml, usdValue) {
		if (!prices || !prices.ERG || prices.ERG <= 0) {
			return this._formatBalanceRow(labelHtml, '$' + formatValue(usdValue, 2));
		}

		const ergValue = new BigNumber(usdValue)
			.dividedBy(prices.ERG)
			.times(Math.pow(10, ERG_DECIMALS))
			.toString();
		return this._formatBalanceRow(labelHtml, formatErgValueString(ergValue, 4, true, true), formatDollarPriceString(usdValue, 2));
	},

	async _loadLpTokenValues(lpTokens) {
		const values = {};
		if (!lpTokens || lpTokens.length === 0) return values;

		let lpPoolData = null;
		try {
			lpPoolData = await ApiClient.getLpPools(lpTokens.map(token => token.tokenId));
		} catch (error) {
			console.warn('Failed to fetch cached LP values:', error);
			return values;
		}

		const lpPools = lpPoolData && lpPoolData.items ? lpPoolData.items : {};
		lpTokens.forEach(token => {
			const value = this._getCachedLpTokenValue(token, lpPools[token.tokenId]);
			if (value && value.usdValue > 0) {
				values[token.tokenId] = value;
				AddressState.lpTokenValues[token.tokenId] = value;
			}
		});

		return values;
	},

	_getCachedLpTokenValue(token, lpPool) {
		if (!token || !lpPool || !lpPool.usdPerLpToken) return null;
		if (lpPool.poolAddress === AddressState.walletAddress) return null;

		this._hydrateTokenMetadata(token, lpPool);

		const walletLpAmountBigInt = this._safeBigInt(token.amount);
		const emission = this._safeBigInt(lpPool.emissionAmount);
		// A position NFT's whole supply is 1, so holding all of it is the normal case.
		if (!lpPool.position && emission > 0n && walletLpAmountBigInt > emission / 2n) return null;

		const lpReserveBigInt = this._safeBigInt(lpPool.lpReserveAmount);
		const circulatingSupplyBigInt = this._safeBigInt(lpPool.circulatingSupply);
		if (walletLpAmountBigInt === lpReserveBigInt) return null;
		if (circulatingSupplyBigInt > 0n && walletLpAmountBigInt > circulatingSupplyBigInt) return null;

		const usdPerLpToken = Number(lpPool.usdPerLpToken);
		const poolUsdValue = Number(lpPool.poolUsdValue);
		if (!Number.isFinite(usdPerLpToken) || usdPerLpToken <= 0) return null;

		const usdValue = typeof BigNumber !== 'undefined'
			? new BigNumber(token.amount).times(usdPerLpToken).toNumber()
			: Number(token.amount) * usdPerLpToken;
		if (!Number.isFinite(usdValue) || usdValue <= 0) return null;

		return {
			usdValue,
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

	_safeBigInt(value) {
		try {
			if (value === undefined || value === null) return 0n;
			return BigInt(value);
		} catch (error) {
			return 0n;
		}
	},

	_formatBalanceRow(labelHtml, valueHtml, fiatHtml = '') {
		return '<span class="address-balance-label">' + labelHtml + '</span><span class="address-balance-value">' + valueHtml + '</span><span class="address-balance-fiat">' + fiatHtml + '</span>';
	},

	/**
	 * Format non-financial tokens
	 */
	_formatOtherTokensHtmlString(tokensArray, nftInfos = []) {
		const nftInfoByTokenId = this._getNftInfoByTokenId(nftInfos);
		const sortedTokens = this._sortOtherTokens(tokensArray, nftInfoByTokenId);
		let html = '';

		sortedTokens.forEach(token => {
			const isScan = AddressState.scamList.includes(token.tokenId);
			const tokenStr = formatAssetNameAndValueString(
				this._formatNftTypeIcon(nftInfoByTokenId[token.tokenId]) + getAssetTitle(token, true, isScan, true),
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

	// These tokens have no price, and amounts mean nothing across tokens: a million of a joke token isn't worth
	// more than a few of a real one. So recognised tokens lead, then the rest, A-Z within each group (#2 before #10).
	_sortOtherTokens(tokensArray, nftInfoByTokenId) {
		const nftTypeOrder = this._getNftTypeOrder();
		const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

		const group = token => {
			if (AddressState.scamList.includes(token.tokenId)) return 300;

			const nftInfo = nftInfoByTokenId[token.tokenId];
			if (nftInfo) return 200 + this._getNftTypeSortOrder(nftInfo.type, nftTypeOrder);

			if (this._isLpToken(token)) return 100;
			if (token.iconurl || hasIcon(token.tokenId)) return 0;

			// Named in words first, then emoji-only or nameless
			return /^[\p{L}\p{N}]/u.test(token.name || '') ? 1 : 2;
		};

		return [...tokensArray].sort((a, b) => group(a) - group(b) || collator.compare(a.name || '', b.name || ''));
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
