import { ORACLE_POOL_V1_TEMPLATES, ORACLE_POOL_V2_TEMPLATES } from '../addresses/constants.js?v=6';

export { ORACLE_POOLS } from './pools.js?v=1';

// Everything here is read from indexed nodes through our gateway (see api-client.js): pool, refresh,
// datapoint and buyback boxes by token id, refresh txs by the pool's address, balances, and block
// headers for timestamps. The explorer API is not needed: the node formats carry every register.
const GATEWAY = 'https://chain.mewfinance.com/';
const FETCH_TIMEOUT_MS = 20000;
// node.ergopool.io answers 403 ("forbidden by administrative rules") to any box or tx page over 100,
// and the gateway passes that on instead of asking another node, so no request asks for more.
const MAX_PAGE = 100;
const RETRIES = 2;
const RETRY_DELAY_MS = 700;
// Answers reused for this long, so the page's parallel calls share the pool box and refresh txs
const CACHE_MS = 30000;
const PARALLEL_REQUESTS = 6;
// The gateway answers over HTTP/2 and asks two nodes per balance, so balances go wider
const BALANCE_REQUESTS = 10;
// Datapoints posted within this many blocks of the newest get exact times (see datapointTimes)
const EXACT_TIME_BLOCKS = 720;

const BOX_PAGE = MAX_PAGE;
const MAX_DATAPOINT_PAGES = 5;
// Rate history reads at most 1 + RATE_SAMPLES box pages: every box while that covers the span,
// otherwise RATE_SAMPLES evenly spread runs of RATE_SAMPLE_SIZE boxes after the first page
const RATE_PAGE = MAX_PAGE;
const RATE_SAMPLES = 20;
const RATE_SAMPLE_SIZE = 25;
const RATE_DENSE_BOXES = RATE_PAGE * (RATE_SAMPLES + 1);
// Block headers read to place the box heights in time
const RATE_ANCHORS = 8;
const BLOCK_MS = 120000;

const cache = new Map();

// ---- Fetching ----

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(path, init) {
	for (let attempt = 0; ; attempt++) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
		let response;
		let body;

		try {
			response = await fetch(GATEWAY + path, Object.assign({}, init, { signal: controller.signal }));
			body = await response.text();
		} catch (error) {
			if (attempt < RETRIES) {
				await sleep(RETRY_DELAY_MS);
				continue;
			}
			throw new Error('Oracle data request failed: ' + path + ' (' + error.message + ')');
		} finally {
			clearTimeout(timer);
		}

		if (response.ok) return JSON.parse(body);

		const retryable = response.status === 403 || response.status === 429 || (response.status >= 500 && !body.includes('disagree'));
		if (retryable && attempt < RETRIES) {
			await sleep(RETRY_DELAY_MS);
			continue;
		}

		const error = new Error('Oracle data request failed: ' + path + ' (HTTP ' + response.status + ')');
		error.status = response.status;
		error.body = body;
		throw error;
	}
}

function cached(key, load) {
	const hit = cache.get(key);
	if (hit && Date.now() - hit.at < CACHE_MS) return hit.promise;

	const promise = load();
	cache.set(key, { at: Date.now(), promise });
	// A failure is not kept: the next call asks again
	promise.catch(() => cache.delete(key));
	return promise;
}

function get(path) {
	return cached('GET ' + path, () => request(path));
}

// text/plain keeps the POST a simple request: no CORS preflight
function post(path, text) {
	return cached('POST ' + path + ' ' + text, () => request(path, { method: 'POST', body: text, headers: { 'Content-Type': 'text/plain' } }));
}

/** Run `work` over `items`, `limit` at a time, keeping the order */
async function mapLimited(items, work, limit = PARALLEL_REQUESTS) {
	const results = new Array(items.length);
	let next = 0;

	async function worker() {
		while (next < items.length) {
			const index = next++;
			results[index] = await work(items[index], index);
		}
	}

	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
	return results;
}

// The node's token index lists some boxes more than once (SigUSD: ~193 unique boxes in 250 rows),
// on every node, so box lists are deduplicated by box id before use
function uniqueBoxes(boxes) {
	const seen = new Set();
	return boxes.filter(box => !seen.has(box.boxId) && seen.add(box.boxId));
}

/** Rows as the index lists them (a box may repeat; page by the row count) */
function unspentByToken(tokenId, offset = 0, limit = BOX_PAGE) {
	return get('blockchain/box/unspent/byTokenId/' + tokenId + '?offset=' + offset + '&limit=' + limit);
}

/** Every box that held the token, newest first: { items, total } (total counts the index's rows) */
async function boxesByToken(tokenId, offset, limit) {
	const page = await get('blockchain/box/byTokenId/' + tokenId + '?offset=' + offset + '&limit=' + limit);
	return { items: uniqueBoxes(page.items), total: page.total };
}

/** Transactions touching the address, newest first, with full input and output boxes: { items, total } */
function txsByAddress(address, offset, limit) {
	return post('blockchain/transaction/byAddress?offset=' + offset + '&limit=' + limit, address);
}

function txById(txId) {
	return get('blockchain/transaction/byId/' + txId);
}

function boxById(boxId) {
	return get('blockchain/box/byId/' + boxId);
}

async function tipHeader() {
	const headers = await request('blocks/lastHeaders/1');
	return headers[0];
}

/**
 * Block timestamps (ms) by height. Heights close together share one header slice; chainSlice
 * returns heights fromHeight+1..toHeight.
 */
async function blockTimes(heights) {
	const sorted = [...new Set(heights)].sort((a, b) => a - b);
	const ranges = [];

	for (const height of sorted) {
		const last = ranges[ranges.length - 1];
		if (last && height - last.from <= 30) last.to = height;
		else ranges.push({ from: height, to: height });
	}

	const times = new Map();
	const slices = await mapLimited(ranges, range => get('blocks/chainSlice?fromHeight=' + (range.from - 1) + '&toHeight=' + range.to));
	slices.flat().forEach(header => times.set(header.height, header.timestamp));
	return times;
}

// ---- Decoding ----

/** ErgoTree of the template set's role, matched on the body after the segregated constants */
function hasTemplate(ergoTree, templates) {
	return templates.some(template => ergoTree.endsWith(template));
}

function readVlq(hex, start) {
	let value = 0n;
	let shift = 0n;
	let i = start;

	for (;;) {
		const byte = parseInt(hex.substr(i, 2), 16);
		i += 2;
		value |= BigInt(byte & 0x7f) << shift;
		shift += 7n;
		if (byte < 0x80) return value;
	}
}

/** An Int (04) or Long (05) register as a BigInt, or null */
function decodeNumber(register) {
	if (!register || (register.slice(0, 2) !== '04' && register.slice(0, 2) !== '05')) return null;
	const zigzag = readVlq(register, 2);
	return (zigzag >> 1n) ^ -(zigzag & 1n);
}

/** A GroupElement register (07 + 33 bytes) as the public key hex, or null */
function decodeGroupElement(register) {
	return register && register.slice(0, 2) === '07' ? register.slice(2, 68) : null;
}

/** A Coll[Byte] register (0e + length + bytes) as hex, or null */
function decodeBytes(register) {
	if (!register || register.slice(0, 2) !== '0e') return null;
	let i = 2;
	let length = 0;
	let shift = 0;

	for (;;) {
		const byte = parseInt(register.substr(i, 2), 16);
		i += 2;
		length |= (byte & 0x7f) << shift;
		shift += 7;
		if (byte < 0x80) break;
	}

	return register.substr(i, length * 2);
}

function addressOfKey(publicKey) {
	return qfleetSDKcore.ErgoAddress.fromPublicKey(publicKey, qfleetSDKcore.Network.Mainnet).toString();
}

/**
 * A datapoint (raw Long) in the pool's display unit:
 * - ERG/USD v1 and v2: nanoErg per 1 USD (3591497761 = 3.59 ERG per USD), so USD per ERG = 1e9 / raw.
 *   SigUSD divides the same value by 100 for its cent.
 * - XAU: nanoErg per kg of gold (454612676018062 = 454,612.68 ERG per kg), so ERG per kg = raw / 1e9.
 *   DexyGold divides it by 1e6 for its milligram.
 */
function displayRate(pool, raw) {
	if (raw == null || raw <= 0n) return null;
	return pool.slug === 'xau' ? Number(raw) / 1e9 : 1e9 / Number(raw);
}

function tokenAmount(box, tokenId) {
	const token = (box.assets || []).find(asset => asset.tokenId === tokenId);
	return token ? token.amount : 0;
}

// ---- Pool box ----

async function currentPoolBox(pool) {
	const boxes = await unspentByToken(pool.poolNft, 0, 5);
	if (!boxes.length) throw new Error('No unspent box holds the ' + pool.name + ' pool NFT');
	return boxes[0];
}

/** v1 only: the epoch preparation box carries no R6; the live epoch box keeps the preparation script's hash there */
function isV1LiveEpoch(box) {
	return hasTemplate(box.ergoTree, ORACLE_POOL_V1_TEMPLATES.LIVE_EPOCH);
}

/**
 * The pool's current state. epoch: v2 the refresh counter in R5, the epoch datapoints are posted for now;
 * v1 has no counter, so it is the end height in R5 (of the live epoch, or of the next one while the
 * pool box is an epoch preparation box). phase (v1): 'live' or 'prep'.
 */
export async function fetchPoolState(pool) {
	const box = await currentPoolBox(pool);
	const registers = box.additionalRegisters;
	const raw = decodeNumber(registers.R4);
	const times = await blockTimes([box.inclusionHeight]);

	const state = {
		rate: displayRate(pool, raw),
		rawDatapoint: raw == null ? null : raw.toString(),
		epoch: Number(decodeNumber(registers.R5)),
		height: box.inclusionHeight,
		timestamp: times.get(box.inclusionHeight),
		boxId: box.boxId,
		txId: box.transactionId,
		address: box.address
	};

	if (pool.version === 1) state.phase = isV1LiveEpoch(box) ? 'live' : 'prep';
	return state;
}

// ---- Operators ----

async function datapointBoxes(pool) {
	const templates = pool.version === 1 ? ORACLE_POOL_V1_TEMPLATES.DATAPOINT : ORACLE_POOL_V2_TEMPLATES.DATAPOINT;
	const boxes = [];

	for (let page = 0; page < MAX_DATAPOINT_PAGES; page++) {
		const items = await unspentByToken(pool.oracleToken, page * BOX_PAGE, BOX_PAGE);
		boxes.push(...items);
		if (items.length < BOX_PAGE) break;
	}

	// Wallets holding spare oracle tokens are not operators
	return uniqueBoxes(boxes).filter(box => hasTemplate(box.ergoTree, templates));
}

/** nanoErg, or null when the indexed nodes disagree on it (the gateway answers 502 then) */
async function ergBalance(address) {
	try {
		const balance = await post('blockchain/balance', address);
		return balance.confirmed.nanoErgs;
	} catch (error) {
		if (error.status === 502 && String(error.body).includes('indexed_nodes_disagree_on_this_balance')) return null;
		throw error;
	}
}

/** v1: the current live epoch box and the one the latest collection spent, by box id */
async function v1RecentEpochs(pool) {
	// Six rows: the index may repeat a box
	const recent = await boxesByToken(pool.poolNft, 0, 6);
	return new Map(recent.items.slice(0, 3).filter(isV1LiveEpoch).map(box => [box.boxId, box]));
}

/** A datapoint box test for "live", reading only the pool's own boxes (see v1Operators / v2Operators) */
async function liveTest(pool) {
	if (pool.version === 1) {
		const recentEpochs = await v1RecentEpochs(pool);
		return box => recentEpochs.has(decodeBytes(box.additionalRegisters.R5));
	}

	const poolBox = await currentPoolBox(pool);
	const poolEpoch = decodeNumber(poolBox.additionalRegisters.R5);
	return box => (box.additionalRegisters.R5 && decodeNumber(box.additionalRegisters.R5) === poolEpoch) || box.transactionId === poolBox.transactionId;
}

/**
 * { live, total } datapoint boxes, for the pools list: two parallel requests, none of the per-operator
 * lookups fetchOperators makes.
 */
export async function fetchOracleCounts(pool) {
	const [boxes, isLive] = await Promise.all([datapointBoxes(pool), liveTest(pool)]);
	return { live: boxes.filter(isLive).length, total: boxes.length };
}

/**
 * v1 datapoints: R4 the oracle's key, R5 the id of the live epoch box posted to, R6 the datapoint.
 * Live: posted to the current live epoch box or to the one the latest collection spent (the pool NFT's
 * last three boxes hold both: live, prep, live or prep, live, prep). epoch: that live epoch's end height.
 */
async function v1Operators(pool, boxes) {
	const recentEpochs = await v1RecentEpochs(pool);

	const epochBoxIds = [...new Set(boxes.map(box => decodeBytes(box.additionalRegisters.R5)).filter(Boolean))];
	const epochEnds = new Map();
	await mapLimited(epochBoxIds, async boxId => {
		const epochBox = recentEpochs.get(boxId) || await boxById(boxId);
		epochEnds.set(boxId, Number(decodeNumber(epochBox.additionalRegisters.R5)));
	});

	return boxes.map(box => {
		const registers = box.additionalRegisters;
		const epochBoxId = decodeBytes(registers.R5);

		return {
			key: decodeGroupElement(registers.R4),
			box,
			rate: displayRate(pool, decodeNumber(registers.R6)),
			epoch: epochEnds.has(epochBoxId) ? epochEnds.get(epochBoxId) : null,
			live: recentEpochs.has(epochBoxId),
			wins: null
		};
	});
}

/**
 * v2 datapoints: R4 the oracle's key, R5 the pool epoch posted for, R6 the datapoint. A refresh
 * spends the datapoints it collects and gives them back holding only R4; their last datapoint and
 * epoch are then read from that refresh's inputs. Live: posted for the current epoch, or collected
 * by the latest refresh.
 */
async function v2Operators(pool, boxes) {
	const isLive = await liveTest(pool);

	const reset = boxes.filter(box => !box.additionalRegisters.R6);
	const txIds = [...new Set(reset.map(box => box.transactionId))];
	const txs = new Map();
	await mapLimited(txIds, async txId => txs.set(txId, await txById(txId)));

	return boxes.map(box => {
		const registers = box.additionalRegisters;
		const key = decodeGroupElement(registers.R4);
		let posted = registers;

		if (!registers.R6) {
			const input = txs.get(box.transactionId).inputs.find(candidate =>
				decodeGroupElement(candidate.additionalRegisters.R4) === key && candidate.additionalRegisters.R6);
			posted = input ? input.additionalRegisters : {};
		}

		const epoch = decodeNumber(posted.R5);

		return {
			key,
			box,
			rate: displayRate(pool, decodeNumber(posted.R6)),
			epoch: epoch == null ? null : Number(epoch),
			live: isLive(box),
			wins: null
		};
	});
}

/**
 * Times for datapoint heights. Heights within EXACT_TIME_BLOCKS of the newest get their block headers;
 * older ones (operators gone quiet for days or months) are counted back from the oldest exact header
 * at 2 minutes a block, which saves a header request per stale operator and is close enough for
 * "N days ago".
 */
async function datapointTimes(heights) {
	const newest = Math.max(...heights);
	const recent = heights.filter(height => newest - height <= EXACT_TIME_BLOCKS);
	const times = await blockTimes(recent);
	const anchor = Math.min(...recent);

	heights.forEach(height => {
		if (!times.has(height)) times.set(height, times.get(anchor) - (anchor - height) * BLOCK_MS);
	});

	return times;
}

/**
 * Every datapoint box of the pool, one per operator. height/timestamp/boxId/txId are of the box as
 * it is now. wins is the number of refreshes the operator collected among `history` (items from
 * fetchRefreshHistory), or null when no history is given: an all-time count would need every refresh
 * tx. Balances are not read here (a request per operator, the slowest part): see fetchErgBalances.
 */
export async function fetchOperators(pool, history = null) {
	// Started now, read by v1Operators / v2Operators from the cache
	currentPoolBox(pool).catch(() => {});

	const boxes = await datapointBoxes(pool);
	if (!boxes.length) return [];

	const addresses = boxes.map(box => addressOfKey(decodeGroupElement(box.additionalRegisters.R4)));
	const [operators, times] = await Promise.all([
		pool.version === 1 ? v1Operators(pool, boxes) : v2Operators(pool, boxes),
		datapointTimes(boxes.map(box => box.inclusionHeight))
	]);

	return operators.map((operator, index) => ({
		address: addresses[index],
		rate: operator.rate,
		epoch: operator.epoch,
		height: operator.box.inclusionHeight,
		timestamp: times.get(operator.box.inclusionHeight),
		boxId: operator.box.boxId,
		txId: operator.box.transactionId,
		live: !!operator.live,
		wins: history ? history.filter(item => item.collector === addresses[index]).length : null
	}));
}

/**
 * ERG balances of `addresses`, BALANCE_REQUESTS at a time. onBalance(address, nanoErg) runs as each
 * one comes in; nanoErg is null when the indexed nodes disagree or the request fails.
 */
export async function fetchErgBalances(addresses, onBalance) {
	await mapLimited(addresses, async address => {
		let nanoErg = null;

		try {
			nanoErg = await ergBalance(address);
		} catch (error) {
			console.warn('No balance for ' + address + ':', error);
		}

		onBalance(address, nanoErg);
	}, BALANCE_REQUESTS);
}

// ---- Refresh history ----

/** v1: the address of the epoch preparation boxes, which every collection creates */
async function v1PrepAddress(pool) {
	const poolBox = await currentPoolBox(pool);
	if (!isV1LiveEpoch(poolBox)) return poolBox.address;

	const recent = await boxesByToken(pool.poolNft, 0, 4);
	const prep = recent.items.find(box => hasTemplate(box.ergoTree, ORACLE_POOL_V1_TEMPLATES.EPOCH_PREP));
	if (!prep) throw new Error('No epoch preparation box found for ' + pool.name);
	return prep.address;
}

/**
 * v2 collector: the datapoint whose reward grew most (every collected datapoint gets 1 reward token,
 * the collector as many again as there were datapoints).
 */
function v2Collector(pool, tx) {
	let best = null;

	for (const output of tx.outputs) {
		if (!tokenAmount(output, pool.oracleToken)) continue;
		const key = decodeGroupElement(output.additionalRegisters.R4);
		const input = tx.inputs.find(candidate => tokenAmount(candidate, pool.oracleToken) && decodeGroupElement(candidate.additionalRegisters.R4) === key);
		if (!input) continue;

		const gain = tokenAmount(output, pool.buybackToken) - tokenAmount(input, pool.buybackToken);
		if (gain > 1 && (!best || gain > best.gain)) best = { gain, key };
	}

	return best ? addressOfKey(best.key) : null;
}

function refreshItem(pool, tx, poolOutput, epoch, collector) {
	const raw = decodeNumber(poolOutput.additionalRegisters.R4);

	return {
		height: tx.inclusionHeight,
		timestamp: tx.timestamp,
		rate: displayRate(pool, raw),
		epoch,
		txId: tx.id,
		collector,
		rawDatapoint: raw == null ? null : raw.toString(),
		boxId: poolOutput.boxId
	};
}

/**
 * Refreshes, newest first. epoch is the epoch collected (v2: its counter; v1: its end height),
 * collector the address that collected it. total counts what the gateway's address index holds
 * (v1: about half the epoch preparation address's txs; its index there starts at height ~1460000).
 * limit: at most 49 (v1) or 100 (v2), see MAX_PAGE.
 */
export async function fetchRefreshHistory(pool, offset = 0, limit = 20) {
	if (pool.version === 1) {
		// The preparation address sees each collection (creates a prep box) and each epoch start
		// (spends it), alternating, so a refresh page is about two tx pages
		const address = await v1PrepAddress(pool);
		const page = await txsByAddress(address, offset * 2, Math.min(MAX_PAGE, limit * 2 + 2));
		const items = [];

		for (const tx of page.items) {
			const input = tx.inputs[0];
			const output = tx.outputs[0];
			if (!input || !output || !tokenAmount(output, pool.poolNft) || !tokenAmount(input, pool.poolNft) || !isV1LiveEpoch(input) || isV1LiveEpoch(output)) continue;

			// The collector's own box pays the fee as the second input
			const collector = tx.inputs[1] && tx.inputs[1].address && tx.inputs[1].address[0] === '9' ? tx.inputs[1].address : null;
			items.push(refreshItem(pool, tx, output, Number(decodeNumber(input.additionalRegisters.R5)), collector));
		}

		return { items: items.slice(0, limit), total: Math.floor(page.total / 2) };
	}

	const poolBox = await currentPoolBox(pool);
	const page = await txsByAddress(poolBox.address, offset, Math.min(MAX_PAGE, limit));
	const items = [];

	for (const tx of page.items) {
		const input = tx.inputs.find(box => tokenAmount(box, pool.poolNft));
		const output = tx.outputs.find(box => tokenAmount(box, pool.poolNft));
		// Only refreshes: they move the pool box together with the refresh box
		if (!input || !output || !tx.inputs.some(box => tokenAmount(box, pool.refreshNft))) continue;

		items.push(refreshItem(pool, tx, output, Number(decodeNumber(input.additionalRegisters.R5)), v2Collector(pool, tx)));
	}

	return { items, total: page.total };
}

// ---- Rate history ----

/** Piecewise linear height -> time between header anchors */
function timeAtHeight(anchors, height) {
	for (let i = 1; i < anchors.length; i++) {
		const newer = anchors[i - 1];
		const older = anchors[i];
		if (height >= older.height || i === anchors.length - 1) {
			if (newer.height === older.height) return newer.time;
			return older.time + (height - older.height) * (newer.time - older.time) / (newer.height - older.height);
		}
	}

	return anchors[0].time;
}

/**
 * [{ time, rate }] oldest first, one point per refresh over the last `days`. Read from the pool NFT's
 * box history: page by page up to RATE_DENSE_BOXES boxes (7 days of any pool), otherwise the first
 * page plus RATE_SAMPLES evenly spread runs of RATE_SAMPLE_SIZE boxes. Boxes carry
 * heights only, so times are interpolated between RATE_ANCHORS + 2 block headers: up to ~30 minutes
 * off on a 30-day span (block times vary within a day), fine for a chart, not for a table.
 */
export async function fetchRateHistory(pool, days = 7) {
	const tip = await tipHeader();
	const since = Date.now() - days * 86400000;
	const sinceHeight = tip.height - Math.ceil(days * 86400000 / BLOCK_MS);

	const first = await boxesByToken(pool.poolNft, 0, RATE_PAGE);
	let boxes = first.items;

	if (boxes.length && boxes[boxes.length - 1].inclusionHeight > sinceHeight && boxes.length < first.total) {
		const span = Math.max(1, boxes[0].inclusionHeight - boxes[boxes.length - 1].inclusionHeight);
		const needed = Math.min(first.total, Math.ceil(boxes.length * (tip.height - sinceHeight) / span));
		let offsets;
		let size;

		if (needed <= RATE_DENSE_BOXES) {
			size = RATE_PAGE;
			offsets = [];
			for (let offset = RATE_PAGE; offset < needed; offset += RATE_PAGE) offsets.push(offset);
		} else {
			size = RATE_SAMPLE_SIZE;
			const step = (needed - RATE_PAGE) / RATE_SAMPLES;
			offsets = Array.from({ length: RATE_SAMPLES }, (_, i) => Math.round(RATE_PAGE + (i + 1) * step - size));
		}

		const pages = await mapLimited(offsets, offset => boxesByToken(pool.poolNft, offset, size));
		boxes = boxes.concat(...pages.map(page => page.items));
	}

	// v1: the live epoch box repeats the datapoint its preparation box set
	if (pool.version === 1) boxes = boxes.filter(box => !isV1LiveEpoch(box));
	if (!boxes.length) return [];

	const heights = boxes.map(box => box.inclusionHeight);
	const newest = Math.max(...heights);
	const oldest = Math.min(...heights);
	const anchorHeights = [...new Set(Array.from({ length: RATE_ANCHORS + 1 }, (_, i) => Math.round(newest - i * (newest - oldest) / RATE_ANCHORS)))];
	const times = await blockTimes(anchorHeights);
	const anchors = [{ height: tip.height, time: tip.timestamp }]
		.concat(anchorHeights.map(height => ({ height, time: times.get(height) })))
		.sort((a, b) => b.height - a.height);

	const seen = new Set();

	return boxes
		.filter(box => !seen.has(box.boxId) && seen.add(box.boxId))
		.map(box => ({ time: Math.round(timeAtHeight(anchors, box.inclusionHeight)), rate: displayRate(pool, decodeNumber(box.additionalRegisters.R4)) }))
		.filter(point => point.time >= since && point.rate != null)
		.sort((a, b) => a.time - b.time);
}
