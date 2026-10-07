//The block list comes from whichever source answers first: sigmaspace's GraphQL explorer, then
//api.ergoplatform, which is added after HEDGE_DELAY or as soon as sigmaspace fails. api.ergoplatform
//alone is at times very slow. Blocks don't wait for prices; the dollar rewards fill in when they come
const BLOCKS_GQL_HOST = 'https://explore.sigmaspace.io/api/graphql';
const BLOCKS_HEDGE_DELAY = 1500;
const BLOCKS_SOURCE_TIMEOUT = 20000;
const BLOCK_SUMMARY_FIELDS = 'headerId height timestamp txsCount blockSize blockMiningTime minerAddress minerReward blockFee';

//"Lithos only" lists just the blocks mined through the Lithos pool, kept in the url like the page offset
const LITHOS_ONLY_PARAM = 'lithos';
const lithosOnly = params[LITHOS_ONLY_PARAM] == 'true';

$(function() {  
	$('#toggleLithos').prop('checked', lithosOnly);

	const pricesLoaded = new Promise(resolve => getPrices(resolve));

	printLatestBlocks(pricesLoaded);
});

function onToggleLithosOnly() {
	if ($('#toggleLithos').prop('checked')) {
		params[LITHOS_ONLY_PARAM] = 'true';
	} else {
		delete(params[LITHOS_ONLY_PARAM]);
	}

	params['offset'] = 0;

	window.location.assign(getCurrentUrlWithParams());
}

function printLatestBlocks(pricesLoaded) {
	//Each mode settles which of its blocks are Lithos blocks, for the chip
	let lithosHeights;
	const blocks = lithosOnly
		? fetchLithosBlocks().then(data => {
			lithosHeights = Promise.resolve(new Set(data.items.map(item => item.height)));
			return data;
		})
		: fetchLatestBlocks().then(data => {
			lithosHeights = data.items.length ? getLithosBlockHeights(Math.min(...data.items.map(item => item.height))) : Promise.resolve(new Set());
			return data;
		});

	blocks
	.then(data => {
		let formattedResult = '';
		let totalBlocks = data.total;
		let items = data.items;

        setupPagination(totalBlocks);

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

    		formattedResult += '<tr>';

            //Height
    		formattedResult += '<td><span class="d-lg-none"><strong>Height: </strong></span><a href="' + getBlockUrl(item.id) + '">' + nFormatter(item.height, 2, true, true) + '</a></td>';

            //Time
    		formattedResult += '<td><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString(item.timestamp) + '</td>';

            //Block time
    		formattedResult += '<td><span class="d-lg-none"><strong>Block time: </strong></span>' + formatBlockTime(getMiningTime(items, i)) + '</td>';
            
            //Transactions
    		formattedResult += '<td><span class="d-lg-none"><strong>TXs: </strong></span>' + item.transactionsCount + '</td>';

            //Mined by: the address book names the known pools. A Lithos block gets its chip once the Lithos blocks are known
            addAddress(item.miner.address);
    		formattedResult += '<td data-height="' + item.height + '"><span class="d-lg-none"><strong>Mined by: </strong></span><a class="address-string" addr="' + item.miner.address + '" href="' + getWalletAddressUrl(item.miner.address) + '">' + item.miner.name + '</a></td>';	

            //Reward. The dollar value fills in once the prices are in
    		formattedResult += '<td><span class="d-lg-none"><strong>Reward: </strong></span>' + formatErgValueString(item.minerReward) + ' <span class="text-light reward-usd" data-reward="' + item.minerReward + '"></span></td>';

            //Fees. Only the GraphQL source has them
    		formattedResult += '<td><span class="d-lg-none"><strong>Fees: </strong></span>' + (item.fees === undefined ? '<span class="block-meta">-</span>' : formatErgValueString(item.fees)) + '</td>';

            //Size
    		formattedResult += '<td><span class="d-lg-none"><strong>Size: </strong></span>' + formatKbSizeString(item.size) + '</td>';

			formattedResult += '</tr>';	
		}

		if (items.length == 0) {
			formattedResult = '<tr><td colspan="7">' + (lithosOnly ? 'No Lithos blocks yet.' : 'No blocks.') + '</td></tr>';
		}

		$('#transactionsTableBody').html(formattedResult);
        
        $('#blocksHolder').show();

        getAddressesInfo();
        tagLithosBlocks(lithosHeights);

        pricesLoaded.then(() => {
        	$('#transactionsTableBody .reward-usd').each(function() {
        		$(this).html(formatAssetDollarPriceString(Number($(this).attr('data-reward')), ERG_DECIMALS, 'ERG'));
        	});
        });
    })
    .catch(function(error) {
    	console.warn('Latest blocks unavailable:', error);
        showLoadError('Failed to fetch latest blocks.');
    })
    .finally(function() {        
        $('#txLoading').hide();
    });
}

//Resolves with the first source to answer, in api.ergoplatform's shape ({ total, items })
function fetchLatestBlocks() {
	//sigmaspace's GraphQL explorer is mainnet only
	return raceSources(networkType == 'testnet' ? [fetchBlocksFromExplorer] : [fetchBlocksFromGql, fetchBlocksFromExplorer]);
}

//Starts the sources in order, the next after BLOCKS_HEDGE_DELAY or as soon as one fails; the first to answer wins
function raceSources(sources) {
	return new Promise((resolve, reject) => {
		let started = 0;
		let failed = 0;
		let done = false;
		let hedgeTimer = null;

		const startNext = () => {
			clearTimeout(hedgeTimer);

			if (done || started >= sources.length) {
				return;
			}

			sources[started++]()
			.then(data => {
				if (done) return;
				done = true;
				clearTimeout(hedgeTimer);
				resolve(data);
			})
			.catch(error => {
				console.warn('Blocks source failed:', error);

				if (++failed == sources.length) {
					reject(error);
				} else {
					startNext();
				}
			});

			hedgeTimer = setTimeout(startNext, BLOCKS_HEDGE_DELAY);
		};

		startNext();
	});
}

function fetchBlocksFromExplorer() {
	return fetchExplorerBlocks(offset, ITEMS_PER_PAGE);
}

function fetchBlocksFromGql() {
	const query = 'query($skip: Int, $take: Int) { state { height } blocks(skip: $skip, take: $take) { ' + BLOCK_SUMMARY_FIELDS + ' } }';

	return queryGql(query, { skip: Number(offset), take: Number(ITEMS_PER_PAGE) })
	.then(data => {
		if (!data.blocks || data.blocks.length == 0) {
			throw new Error('sigmaspace GraphQL: no blocks');
		}

		return {
			//The chain counts from height 1, so the tip height is the number of blocks
			total: data.state.height,
			items: data.blocks.map(gqlBlockToExplorer)
		};
	});
}

function queryGql(query, variables = {}) {
	return fetch(BLOCKS_GQL_HOST, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: query, variables: variables }),
		signal: AbortSignal.timeout(BLOCKS_SOURCE_TIMEOUT)
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('sigmaspace GraphQL HTTP ' + response.status);
		}

		return response.json();
	})
	.then(json => {
		if (!json.data || json.errors) {
			throw new Error('sigmaspace GraphQL: ' + JSON.stringify(json.errors || 'no data'));
		}

		return json.data;
	});
}

//Ergo aims for a block every 2 minutes; a gap of 3 targets or more is shown in orange
const TARGET_BLOCK_TIME = 120000;

//The GraphQL source gives each block's mining time; with the explorer it is the gap to the block below, when that is on the page
function getMiningTime(items, i) {
	if (items[i].miningTime !== undefined) {
		return items[i].miningTime;
	}

	const below = items[i + 1];
	return below && below.height == items[i].height - 1 ? items[i].timestamp - below.timestamp : undefined;
}

function formatBlockTime(ms) {
	if (ms === undefined || isNaN(ms)) {
		return '<span class="block-meta">-</span>';
	}

	const seconds = Math.max(0, Math.round(ms / 1000));
	const text = (seconds >= 60 ? Math.floor(seconds / 60) + 'm ' : '') + (seconds % 60) + 's';

	return ms >= 3 * TARGET_BLOCK_TIME ? '<span class="block-slow" title="Over 3 times the 2 minute target">' + text + '</span>' : text;
}

function gqlBlockToExplorer(block) {
	return {
		id: block.headerId,
		height: block.height,
		timestamp: Number(block.timestamp),
		transactionsCount: block.txsCount,
		//The explorer names a miner by the last 8 characters of its reward address
		miner: { address: block.minerAddress, name: block.minerAddress.slice(-8) },
		minerReward: Number(block.minerReward),
		fees: Number(block.blockFee),
		miningTime: Number(block.blockMiningTime),
		size: block.blockSize
	};
}

/**
 * A page of Lithos blocks, newest first. The heights come from the Lithos proof-of-spend
 * boxes (see getLithosBlockHeights), the rows from whichever block source answers first
 */
async function fetchLithosBlocks() {
	const heights = [...await getLithosBlockHeights(0, Infinity)].sort((a, b) => b - a);
	const pageHeights = heights.slice(Number(offset), Number(offset) + Number(ITEMS_PER_PAGE));

	if (pageHeights.length == 0) {
		return { total: heights.length, items: [] };
	}

	const sources = [() => fetchBlocksAtHeightsFromExplorer(pageHeights)];

	if (networkType != 'testnet') {
		sources.unshift(() => fetchBlocksAtHeightsFromGql(pageHeights));
	}

	const items = await raceSources(sources);

	return { total: heights.length, items: items };
}

//All the heights in one query, one alias each
function fetchBlocksAtHeightsFromGql(heights) {
	const query = '{ ' + heights.map((height, i) => 'b' + i + ': blocks(height: ' + Number(height) + ') { ' + BLOCK_SUMMARY_FIELDS + ' }').join(' ') + ' }';

	return queryGql(query)
	.then(data => heights.map((height, i) => {
		const block = (data['b' + i] || [])[0];

		if (!block) {
			throw new Error('sigmaspace GraphQL: no block at height ' + height);
		}

		return gqlBlockToExplorer(block);
	}));
}

//The explorer can't look a block up by height, but counting back from the tip is quick for recent blocks
async function fetchBlocksAtHeightsFromExplorer(heights) {
	const tip = (await fetchExplorerBlocks(0, 1)).items[0].height;

	return Promise.all(heights.map(async height => {
		let block = (await fetchExplorerBlocks(tip - height, 1)).items[0];

		//A block found since the tip was read shifts the list by one
		if (block && block.height != height) {
			block = (await fetchExplorerBlocks(tip - height + (block.height - height), 1)).items[0];
		}

		if (!block || block.height != height) {
			throw new Error('api.ergoplatform: no block at height ' + height);
		}

		return block;
	}));
}

function fetchExplorerBlocks(skip, limit) {
	return fetch(API_HOST + 'blocks?limit=' + limit + '&sortBy=height&sortDirection=desc&offset=' + skip, { signal: AbortSignal.timeout(BLOCKS_SOURCE_TIMEOUT) })
	.then(response => {
		if (!response.ok) {
			throw new Error('api.ergoplatform HTTP ' + response.status);
		}

		return response.json();
	});
}

//The miner of a Lithos block is the lender whose collateral it spent, so it reads like any solo miner without the chip
function tagLithosBlocks(lithosHeights) {
	lithosHeights
	.then(heights => {
		$('#transactionsTableBody td[data-height]').each(function() {
			if (heights.has(Number($(this).attr('data-height')))) {
				$(this).find('a.address-string').before(lithosChip() + ' ');
			}
		});
	})
	.catch(error => console.warn('Lithos blocks unavailable:', error));
}
