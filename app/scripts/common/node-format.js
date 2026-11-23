//Transactions from the indexed nodes behind chain.mewfinance.com (/blockchain/...), in the explorer
//API's shape, for the pages that ask the nodes when the explorer is slow or lacks a tx. A node gives
//tokens without name or decimals and registers as bare hex: names and decimals come from GraphQL,
//and the registers render from serializedValue (see main.js).
const NODE_FORMAT_GATEWAY = 'https://chain.mewfinance.com/';
const NODE_FORMAT_TIMEOUT_MS = 15000;
//GraphQL takes at most 20 token ids per field; one query asks up to 10 fields, each under an alias
const NODE_FORMAT_TOKENS_PER_FIELD = 20;
const NODE_FORMAT_FIELDS_PER_QUERY = 10;

//Token id -> { name, decimals }, kept for the page's life
const nodeFormatTokens = new Map();

//A page of pool txs can hold 100+ tokens, and one lookup each would run into the gateway's
//per-client rate limit, so they go in one GraphQL query. A token GraphQL doesn't know yet (just
//minted) is asked of the indexed nodes on its own. Rejects when a token can't be looked up:
//amounts without their decimals would be wrong.
async function loadNodeTokenInfo(ids) {
	const missing = [...new Set(ids)].filter(id => !nodeFormatTokens.has(id));
	const fields = [];

	for (let i = 0; i < missing.length; i += NODE_FORMAT_TOKENS_PER_FIELD) {
		fields.push(missing.slice(i, i + NODE_FORMAT_TOKENS_PER_FIELD));
	}

	const queries = [];

	for (let i = 0; i < fields.length; i += NODE_FORMAT_FIELDS_PER_QUERY) {
		queries.push(fields.slice(i, i + NODE_FORMAT_FIELDS_PER_QUERY));
	}

	await Promise.all(queries.map(async batch => {
		const variables = {};
		const params = [];
		const selections = [];

		batch.forEach((tokenIds, i) => {
			variables['ids' + i] = tokenIds;
			params.push('$ids' + i + ': [String!]');
			selections.push('t' + i + ': tokens(tokenIds: $ids' + i + ', take: ' + NODE_FORMAT_TOKENS_PER_FIELD + ') { tokenId name decimals }');
		});

		const response = await fetch(NODE_FORMAT_GATEWAY + 'graphql', {
			method: 'POST',
			// text/plain keeps it a simple request: no CORS preflight
			headers: { 'Content-Type': 'text/plain' },
			body: JSON.stringify({ query: 'query(' + params.join(', ') + ') { ' + selections.join(' ') + ' }', variables: variables }),
			signal: AbortSignal.timeout(NODE_FORMAT_TIMEOUT_MS)
		});

		if (!response.ok) throw new Error('Token lookup HTTP ' + response.status);

		const json = await response.json();

		if (!json.data || json.errors) throw new Error('Token lookup: ' + JSON.stringify(json.errors || 'no data'));

		batch.forEach((tokenIds, i) => {
			for (const token of json.data['t' + i] || []) {
				if (tokenIds.includes(token.tokenId)) {
					nodeFormatTokens.set(token.tokenId, { name: token.name || null, decimals: Number(token.decimals) || 0 });
				}
			}
		});
	}));

	await Promise.all(missing.filter(id => !nodeFormatTokens.has(id)).map(async id => {
		const response = await fetch(NODE_FORMAT_GATEWAY + 'blockchain/token/byId/' + id, { signal: AbortSignal.timeout(NODE_FORMAT_TIMEOUT_MS) });

		if (!response.ok) throw new Error('Token lookup HTTP ' + response.status + ' for ' + id);

		const token = await response.json();

		if (!token || token.id !== id) throw new Error('Token lookup: no ' + id);

		nodeFormatTokens.set(id, { name: token.name || null, decimals: Number(token.decimals) || 0 });
	}));
}

async function nodeTxsToExplorer(txs) {
	const ids = [];

	for (const tx of txs) {
		for (const box of [...(tx.inputs || []), ...(tx.dataInputs || []), ...(tx.outputs || [])]) {
			(box.assets || []).forEach(asset => ids.push(asset.tokenId));
		}
	}

	await loadNodeTokenInfo(ids);

	return txs.map(tx => nodeTxToExplorer(tx, nodeFormatTokens));
}

function nodeTxToExplorer(tx, tokens) {
	return {
		id: tx.id,
		blockId: tx.blockId,
		inclusionHeight: tx.inclusionHeight,
		timestamp: tx.timestamp,
		index: tx.index,
		globalIndex: tx.globalIndex,
		numConfirmations: tx.numConfirmations,
		size: tx.size,
		//A genesis box isn't in the node's index: for block 1's tx it lists that tx's own output in its
		//place. Left out, as the explorers leave genesis inputs out; withGenesisInputs puts them back.
		inputs: (tx.inputs || []).filter(box => box.transactionId !== tx.id).map((box, index) => nodeInputToExplorer(box, index, tokens)),
		dataInputs: (tx.dataInputs || []).map((box, index) => box.ergoTree ? nodeInputToExplorer(box, index, tokens) : { boxId: box.boxId, index: index }),
		outputs: (tx.outputs || []).map(box => ({
			boxId: box.boxId,
			transactionId: tx.id,
			blockId: tx.blockId,
			value: box.value,
			index: box.index,
			globalIndex: box.globalIndex,
			creationHeight: box.creationHeight,
			settlementHeight: box.inclusionHeight,
			ergoTree: box.ergoTree,
			address: box.address,
			assets: nodeAssetsToExplorer(box.assets, tokens),
			additionalRegisters: nodeRegistersToExplorer(box.additionalRegisters),
			spentTransactionId: box.spentTransactionId || null,
			mainChain: true
		}))
	};
}

//An input as the explorer has it: where it was created under output* names. The node doesn't say
//in which block, so the height stands in for the block id (the block page takes either).
function nodeInputToExplorer(box, index, tokens) {
	return {
		boxId: box.boxId,
		value: box.value,
		index: index,
		spendingProof: box.spendingProof ? box.spendingProof.proofBytes : null,
		outputBlockId: box.inclusionHeight !== undefined ? String(box.inclusionHeight) : undefined,
		outputTransactionId: box.transactionId,
		outputIndex: box.index,
		outputGlobalIndex: box.globalIndex,
		outputCreatedAt: box.creationHeight,
		outputSettledAt: box.inclusionHeight,
		ergoTree: box.ergoTree,
		address: box.address,
		assets: nodeAssetsToExplorer(box.assets, tokens),
		additionalRegisters: nodeRegistersToExplorer(box.additionalRegisters)
	};
}

function nodeAssetsToExplorer(assets, tokens) {
	return (assets || []).map((asset, index) => {
		const token = tokens.get(asset.tokenId) || { name: null, decimals: 0 };

		return { tokenId: asset.tokenId, index: index, amount: asset.amount, name: token.name, decimals: token.decimals, type: null };
	});
}

function nodeRegistersToExplorer(registers) {
	const result = {};

	for (const [key, value] of Object.entries(registers || {})) {
		result[key] = typeof value === 'string' ? { serializedValue: value } : value;
	}

	return result;
}
