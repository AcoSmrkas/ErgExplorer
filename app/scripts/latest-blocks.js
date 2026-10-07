//The block list comes from whichever source answers first: sigmaspace's GraphQL explorer, then
//api.ergoplatform, which is added after HEDGE_DELAY or as soon as sigmaspace fails. api.ergoplatform
//alone is at times very slow. Blocks don't wait for prices; the dollar rewards fill in when they come
const BLOCKS_GQL_HOST = 'https://explore.sigmaspace.io/api/graphql';
const BLOCKS_HEDGE_DELAY = 1500;
const BLOCKS_SOURCE_TIMEOUT = 20000;

$(function() {  
	const pricesLoaded = new Promise(resolve => getPrices(resolve));

	printLatestBlocks(pricesLoaded);
});

function printLatestBlocks(pricesLoaded) {
	fetchLatestBlocks()
	.then(data => {
		let formattedResult = '';
		let totalBlocks = data.total;
		let items = data.items;

        setupPagination(totalBlocks);

		for (let i = 0; i < items.length; i++) {
    		formattedResult += '<tr>';

            //Height
    		formattedResult += '<td><span class="d-lg-none"><strong>Height: </strong></span><a href="' + getBlockUrl(items[i].id) + '">' + nFormatter(items[i].height, 2, true, true) + '</a></td>';

            //Time
    		formattedResult += '<td><span class="d-lg-none"><strong>Time: </strong></span>' + formatDateString(items[i].timestamp) + '</td>';
            
            //Transactions
    		formattedResult += '<td><span class="d-lg-none"><strong>Transactions: </strong></span>' + items[i].transactionsCount + '</td>';

            //Mined by. A Lithos block gets its chip once the Lithos blocks are known
            addAddress(items[i].miner.address);
    		formattedResult += '<td data-height="' + items[i].height + '"><span class="d-lg-none"><strong>Mined by: </strong></span><a class="address-string" addr="' + items[i].miner.address + '" href="' + getWalletAddressUrl(items[i].miner.address) + '">' + items[i].miner.name + '</a></td>';	

            //Reward. The dollar value fills in once the prices are in
    		formattedResult += '<td><span class="d-lg-none"><strong>Reward: </strong></span>' + formatErgValueString(items[i].minerReward) + ' <span class="text-light reward-usd" data-reward="' + items[i].minerReward + '"></span></td>';
            
            //Difficulty
    		formattedResult += '<td><span class="d-lg-none"><strong>Difficulty: </strong></span>' + items[i].difficulty + '</td>';

            //Size
    		formattedResult += '<td><span class="d-lg-none"><strong>Size: </strong></span>' + formatKbSizeString(items[i].size) + '</td>';

			formattedResult += '</tr>';	
		}

		$('#transactionsTableBody').html(formattedResult);
        
        $('#blocksHolder').show();

        getAddressesInfo();
        tagLithosBlocks(items);

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
	const sources = networkType == 'testnet' ? [fetchBlocksFromExplorer] : [fetchBlocksFromGql, fetchBlocksFromExplorer];

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
	return fetch(API_HOST + 'blocks?limit=' + ITEMS_PER_PAGE + '&sortBy=height&sortDirection=desc&offset=' + offset, { signal: AbortSignal.timeout(BLOCKS_SOURCE_TIMEOUT) })
	.then(response => {
		if (!response.ok) {
			throw new Error('api.ergoplatform HTTP ' + response.status);
		}

		return response.json();
	});
}

function fetchBlocksFromGql() {
	const query = 'query($skip: Int, $take: Int) { state { height } blocks(skip: $skip, take: $take) { headerId height timestamp txsCount blockSize minerAddress minerReward difficulty } }';

	return fetch(BLOCKS_GQL_HOST, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: query, variables: { skip: Number(offset), take: Number(ITEMS_PER_PAGE) } }),
		signal: AbortSignal.timeout(BLOCKS_SOURCE_TIMEOUT)
	})
	.then(response => {
		if (!response.ok) {
			throw new Error('sigmaspace GraphQL HTTP ' + response.status);
		}

		return response.json();
	})
	.then(json => {
		if (!json.data || !json.data.blocks || json.data.blocks.length == 0) {
			throw new Error('sigmaspace GraphQL: ' + JSON.stringify(json.errors || 'no blocks'));
		}

		return {
			//The chain counts from height 1, so the tip height is the number of blocks
			total: json.data.state.height,
			items: json.data.blocks.map(block => ({
				id: block.headerId,
				height: block.height,
				timestamp: Number(block.timestamp),
				transactionsCount: block.txsCount,
				//The explorer names a miner by the last 8 characters of its reward address
				miner: { address: block.minerAddress, name: block.minerAddress.slice(-8) },
				minerReward: Number(block.minerReward),
				difficulty: block.difficulty,
				size: block.blockSize
			}))
		};
	});
}

//The miner of a Lithos block is the lender whose collateral it spent, so it reads like any solo miner without the chip
function tagLithosBlocks(items) {
	if (items.length == 0) {
		return;
	}

	const lowest = Math.min(...items.map(item => item.height));

	getLithosBlockHeights(lowest)
	.then(heights => {
		$('#transactionsTableBody td[data-height]').each(function() {
			if (heights.has(Number($(this).attr('data-height')))) {
				$(this).find('a.address-string').before(lithosChip() + ' ');
			}
		});
	})
	.catch(error => console.warn('Lithos blocks unavailable:', error));
}