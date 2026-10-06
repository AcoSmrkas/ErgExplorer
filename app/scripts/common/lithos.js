/**
 * Lithos: a mining pool whose payout rules are contracts on Ergo. A lender locks about
 * one block reward of ERG, plus a LIT permit, into the collateral queue. When a Lithos
 * miner finds a block, a transaction inside it (the "genesis" transaction) spends one
 * live collateral box and turns its ERG into the payout for the pool's miners. The
 * block's own reward is paid to the lender, because the collateral contract only lets
 * a block spend the box if the block's miner key is the lender's key.
 *
 * Ids are from the mainnet launch on 2026-10-05; testnet runs the same contracts.
 */
const LITHOS = {
	mainnet: {
		emissionNft: '1ddb641b785e9ac9baf455f64932295e48cbbf4aadc9645f74065d58d09cdc47',
		queueToken: '3508c83c692de0ac9dabe1ed6a57a36abe5fed40fba5e497967a848ee423bc08',
		collateralToken: 'a8a790e784e93ac0e68649181ae3d251e84fb5c741624100e7e945ae1e82dc98',
		litToken: 'c1980d829988229516430a47a5eca376060b6ce859616db0936e78ab25cb6de7',
		queueTree: '1b3903040004000e201ddb641b785e9ac9baf455f64932295e48cbbf4aadc9645f74065d58d09cdc47d1938cb2db6308b2a4730000730100017302',
		collateralTree: '1ba20730040005320e20c1980d829988229516430a47a5eca376060b6ce859616db0936e78ab25cb6de705000400050004020500040201010e214ec61f485b98eb87153f7c57db4f5ecd75556fddbc403b41acf8441fde8e16090004400400060100040604000402040405000440050205000500050205000400020005000580897a010105000400020005000580897a01010400020005000e20b4c11d0e04ff78de8d302c19cbc740ff7e88068aaf6db6c85a0d9769468057d8040005020400040004000e2034a44f069c15ff92038803c6c21194f2c9a194f3a610c40ee1ef2773bdfc5c3504000101d810d601b2a5730000d602e4c6a706410c4d0ed6038c720201d6049972039d72037301d6057302d606860272057303d607e4c672010464d608e4c672010711d6097ea305d60ab2db63087201730400d60bc5a7d60cdb6308a7d60d8c720202d60eb0720d7305d9010e414d0e9a8c720e018c8c720e0202d60f998cb2720c7306017206029a7203720ed610e4c6a70508ea02d19683060196830d0192c1720199c1a7e4c6a7040593cbc27201e4c6a7080e959172047307d801d611b2db630872017308017206ed938c7211017205938c721102720473099683060193db64017207730adb64057207db64067207db6407720793db64037207730befe6db6404720793e4c672010504730c93e4c672010606730d93b17208730e93b27208730f00720993b27208731000720993b27208731100731293b1e4c67201080e7313ed938c720a01720b938c720a02731493b0a57315d9011141639a8c721101b0db63088c7211027316d90113414d0ed802d6158c721302d6168c72130195938c721501720b9a72168c721502721673179591720f7318aea5d9011163d801d613b2db630872117319018602830102731a731bededed93c27211d0721092c17211731c938c7213017205938c721302720f731d9591720e731eaf720dd901114d0eaea5d9011363d801d615b2db63087213731f01860283010273207321ededed93cbc272138c72110192c172137322938c7215017205938c7215028c7211027323aea5d9011163d801d613b2db63087211732401860283010273257326edededed93cbc272117327938c7213018cb2720c73280001938c7213027329938cc7721101a393e4c67211040ecbd0721093d07210d0cddb6906db6503fe93c5b2a4732a00720b95947ee4c6a7070204732bd801d611b2db6501fe732c00ea02d1ed93732d8cb2db63087211732e000193cbe4e3000ee4c67211060ed40800d1732f'
	},
	testnet: {
		emissionNft: '1850d0f59e3cb9b450e56ec74416ed0b9dcbd0a058b99b8df3e93a5d0f34c5ad',
		queueToken: '07956fbd1db32606fa60687c64d4e5c6e8aff00ff34a8ca2c6ba074b5a9d5192',
		collateralToken: '0fd01935440fc42fc64ad79a6b27afbd6e295d7cb6d77064996b6b188fa373eb',
		litToken: '7b728ca02a23085f1f7093e949535938c55307ab1b61e848008201c5109bd18b',
		queueTree: '1b3903040004000e201850d0f59e3cb9b450e56ec74416ed0b9dcbd0a058b99b8df3e93a5d0f34c5add1938cb2db6308b2a4730000730100017302',
		collateralTree: '1ba20730040005320e207b728ca02a23085f1f7093e949535938c55307ab1b61e848008201c5109bd18b05000400050004020500040201010e214ec61f485b98eb87153f7c57db4f5ecd75556fddbc403b41acf8441fde8e16090004400400060100040604000402040405000440050205000500050205000400020005000580897a010105000400020005000580897a01010400020005000e208ae4e8effb3d830a6ddb766a46702da7a4216bc065d263c413e58ebfed564cdf040005020400040004000e203c0a153ce995f1a89bfc3293fd9356b80e0dd65721f75ea8435f50818471588b04000101d810d601b2a5730000d602e4c6a706410c4d0ed6038c720201d6049972039d72037301d6057302d606860272057303d607e4c672010464d608e4c672010711d6097ea305d60ab2db63087201730400d60bc5a7d60cdb6308a7d60d8c720202d60eb0720d7305d9010e414d0e9a8c720e018c8c720e0202d60f998cb2720c7306017206029a7203720ed610e4c6a70508ea02d19683060196830d0192c1720199c1a7e4c6a7040593cbc27201e4c6a7080e959172047307d801d611b2db630872017308017206ed938c7211017205938c721102720473099683060193db64017207730adb64057207db64067207db6407720793db64037207730befe6db6404720793e4c672010504730c93e4c672010606730d93b17208730e93b27208730f00720993b27208731000720993b27208731100731293b1e4c67201080e7313ed938c720a01720b938c720a02731493b0a57315d9011141639a8c721101b0db63088c7211027316d90113414d0ed802d6158c721302d6168c72130195938c721501720b9a72168c721502721673179591720f7318aea5d9011163d801d613b2db630872117319018602830102731a731bededed93c27211d0721092c17211731c938c7213017205938c721302720f731d9591720e731eaf720dd901114d0eaea5d9011363d801d615b2db63087213731f01860283010273207321ededed93cbc272138c72110192c172137322938c7215017205938c7215028c7211027323aea5d9011163d801d613b2db63087211732401860283010273257326edededed93cbc272117327938c7213018cb2720c73280001938c7213027329938cc7721101a393e4c67211040ecbd0721093d07210d0cddb6906db6503fe93c5b2a4732a00720b95947ee4c6a7070204732bd801d611b2db6501fe732c00ea02d1ed93732d8cb2db63087211732e000193cbe4e3000ee4c67211060ed40800d1732f'
	}
};

//The explorer's box search indexes contracts by the SHA-256 of their template, which both networks share
const LITHOS_QUEUE_TEMPLATE_HASH = 'db686aa7db208ce69f0088e66b731e3cd16a0f58332ccaad9b67bcb0555ea98d';
const LITHOS_COLLATERAL_TEMPLATE_HASH = '3328cef917f9983ffcae8a3117fba409a7780c672bdfc09343245d3376f207fd';

//A block's reward can be spent this many blocks after the block
const BLOCK_REWARD_DELAY = 720;

//EIP-27: a mainnet block reward carries these tokens, and spending it pays as many nanoERG to the re-emission contract
const REEMISSION_TOKEN_ID = 'd9a2cc8a09abfaed87afacfbb7daee79a6b26f10c6613fc13d3f3953e5521d1a';

function getLithos() {
	return LITHOS[networkType] || null;
}

//Testnet mode points API_HOST at the explorer's root, where only some v1 paths answer
function getExplorerV1Host() {
	return API_HOST.endsWith('/api/v1/') ? API_HOST : API_HOST + 'api/v1/';
}

const LITHOS_BLOCK_TITLE = 'Mined through the Lithos pool: the block spent a lender\'s collateral, which pays the pool\'s miners, and the block reward went to that lender';
const LITHOS_GENESIS_TITLE = 'Spends a lender\'s collateral box and starts the payout to the pool\'s miners';

function lithosChip(label = 'Lithos', title = LITHOS_BLOCK_TITLE) {
	return '<span class="lithos-chip" title="' + title + '">' + label + '</span>';
}

var p2sAddresses = {};

//Deriving a P2S address needs no script parsing, so it works for every ErgoTree version
function getP2SAddress(ergoTree) {
	const key = networkType + ergoTree;

	if (p2sAddresses[key] === undefined) {
		p2sAddresses[key] = qfleetSDKcore.ErgoAddress.fromErgoTree(ergoTree, getFleetNetwork()).toString();
	}

	return p2sAddresses[key];
}

function holdsOneOf(box, tokenId) {
	return (box.assets || []).some(asset => asset.tokenId == tokenId && Number(asset.amount) == 1);
}

/**
 * The genesis transaction of a Lithos block: the one that spends a collateral box.
 * The block API gives inputs an address but no tree, so they are matched by address.
 */
function findLithosGenesisTx(transactions) {
	const lithos = getLithos();

	if (!lithos) {
		return null;
	}

	const collateralAddress = getP2SAddress(lithos.collateralTree);

	return transactions.find(tx => tx.inputs.some(input => input.ergoTree
		? input.ergoTree == lithos.collateralTree
		: input.address == collateralAddress)) || null;
}

async function lithosSearch(path, query) {
	const response = await fetch(getExplorerV1Host() + path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(query)
	});

	if (!response.ok) {
		throw new Error('Lithos box search failed: HTTP ' + response.status);
	}

	return response.json();
}

/**
 * Heights of the Lithos blocks from minHeight up. Each Lithos block leaves one
 * proof-of-spend box at its own height: a queue-contract box holding one collateral
 * token and nothing but R4. The explorer's search lists them oldest first whatever
 * order is asked for, so this reads back from the end, a page at a time.
 */
async function getLithosBlockHeights(minHeight, maxPages = 5) {
	const lithos = getLithos();
	const heights = new Set();

	if (!lithos) {
		return heights;
	}

	const query = { ergoTreeTemplateHash: LITHOS_QUEUE_TEMPLATE_HASH, assets: [lithos.collateralToken] };
	let end = (await lithosSearch('boxes/search?offset=0&limit=1', query)).total;

	for (let page = 0; page < maxPages && end > 0; page++) {
		const start = Math.max(0, end - 100);
		const items = (await lithosSearch('boxes/search?offset=' + start + '&limit=' + (end - start), query)).items;
		let lowest = Infinity;

		for (const box of items) {
			if (isLithosProofOfSpend(box, lithos)) {
				heights.add(box.settlementHeight);
			}

			lowest = Math.min(lowest, box.settlementHeight);
		}

		if (items.length == 0 || lowest < minHeight) {
			break;
		}

		end = start;
	}

	return heights;
}

function isLithosProofOfSpend(box, lithos) {
	return box.ergoTree == lithos.queueTree
		&& box.assets.length == 1
		&& holdsOneOf(box, lithos.collateralToken)
		&& Object.keys(box.additionalRegisters || {}).join() == 'R4';
}

/**
 * A key's Lithos positions, found by the key in R5: boxes still waiting in the queue,
 * and live collateral any Lithos miner may spend. Both queries need the template hash,
 * and the queue's template is shared by unrelated contracts, so results are filtered
 * to the exact trees and tokens.
 */
async function getLithosPositions(publicKey) {
	const lithos = getLithos();

	if (!lithos) {
		return { queued: [], live: [] };
	}

	const byKey = templateHash => lithosSearch('boxes/unspent/search?offset=0&limit=100', {
		ergoTreeTemplateHash: templateHash,
		registers: { R5: publicKey }
	}).then(data => data.items);

	const [queue, collateral] = await Promise.all([
		byKey(LITHOS_QUEUE_TEMPLATE_HASH),
		byKey(LITHOS_COLLATERAL_TEMPLATE_HASH)
	]);

	return {
		queued: queue.filter(box => box.ergoTree == lithos.queueTree && holdsOneOf(box, lithos.queueToken)),
		live: collateral.filter(box => box.ergoTree == lithos.collateralTree && holdsOneOf(box, lithos.collateralToken))
	};
}

//The queue position the next activation takes, from the emission box's R6
async function getLithosQueueHead() {
	const lithos = getLithos();

	if (!lithos) {
		return null;
	}

	const response = await fetch(getExplorerV1Host() + 'boxes/unspent/byTokenId/' + lithos.emissionNft);

	if (!response.ok) {
		return null;
	}

	const box = (await response.json()).items[0];
	const head = box && box.additionalRegisters.R6 ? Number(box.additionalRegisters.R6.renderedValue) : NaN;

	return Number.isFinite(head) ? head : null;
}

/**
 * The permit a lender posted, in LIT base units. A queue box holds only the permit. A
 * collateral box holds the permit plus the LIT its activation emitted, and R6 records
 * that emission as (public amount, [(recipient, amount), ...]).
 */
function getLithosPermit(box) {
	const lithos = getLithos();
	const lit = (box.assets || []).find(asset => asset.tokenId == lithos.litToken);
	const held = lit ? Number(lit.amount) : 0;

	if (box.ergoTree == lithos.queueTree) {
		return held;
	}

	try {
		const split = JSON.parse(box.additionalRegisters.R6.renderedValue.replace(/([0-9a-f]{64})/g, '"$1"'));
		const emitted = Number(split[0]) + split[1].reduce((sum, entry) => sum + Number(entry[1]), 0);

		return held - emitted;
	} catch (e) {
		return null;
	}
}

//Ergo pays a block's reward to this script for the miner's key: only that key can spend it, BLOCK_REWARD_DELAY blocks on
function getMinerRewardTree(publicKey) {
	return '100204a00b08cd' + publicKey + 'ea02d192a39a8cc7a70173007301';
}

//Unspent block rewards for a key, newest first
async function getBlockRewards(publicKey) {
	const address = getP2SAddress(getMinerRewardTree(publicKey));
	const response = await fetch(getExplorerV1Host() + 'boxes/unspent/byAddress/' + address + '?offset=0&limit=100');

	if (!response.ok) {
		throw new Error('Block reward lookup failed: HTTP ' + response.status);
	}

	return response.json();
}
