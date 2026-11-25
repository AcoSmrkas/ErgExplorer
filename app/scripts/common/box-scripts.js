// For the transaction and box pages: a contract box's script, the context variables it was spent
// with, and the raw JSON. Needs node-format.js.
const BOX_SCRIPTS_TIMEOUT_MS = 15000;
// Longer byte values are folded under their hash
const CONTEXT_BYTES_SHOWN = 100;

// JSONbig keeps amounts above 2^53 as the bare numbers they came as
function showRaw(selector, boxes) {
	$(selector).text(JSONbig.stringify(boxes, null, 4));
}

function copyRaw(e, selector) {
	copyToClipboard(e, $(selector).text());
}

// The decompiled script of each contract box, folded. The explorer API's hosts differ: some can't
// decompile every script and give its syntax tree on one line instead. Only the readable form is
// shown, asked for again when a section is opened without it.
const SCRIPT_PLACEHOLDER = /placeholder\[.+?\]\((\d+)\)/g;
// Longer constants stay placeholders in the script; the list below it has them in full
const SCRIPT_INLINE_LENGTH = 100;
const SCRIPT_TRIES = 6;
const SCRIPT_RETRY_MS = 1000;
// Decompiles every script we tried. For script text only: its index can be far behind, which a
// script, fixed for the life of its box, doesn't mind. Don't read chain state from it.
const SCRIPT_HOST = 'https://api-p2p.ergoplatform.com/api/v1/';
const SCRIPT_HOST_TIMEOUT_MS = 5000;

// ErgoTree -> { text, boxIds, request }, text null until a readable one is found
const scripts = new Map();

function isReadableScript(text) {
	return typeof text == 'string' && text != '' && !/^(Right|Left)\(/.test(text);
}

// Appends the box's script section to its card, if it's a contract's
function appendBoxScript(box, card) {
	if (!box.ergoTree || isWalletBox(box) || getBoxAddress(box) == FEE_ADDRESS) return;

	if (!scripts.has(box.ergoTree)) {
		scripts.set(box.ergoTree, { text: null, boxIds: new Set(), request: null });
	}

	const script = scripts.get(box.ergoTree);

	if (box.boxId) script.boxIds.add(box.boxId);
	if (!script.text && isReadableScript(box.ergoTreeScript)) script.text = box.ergoTreeScript;

	// Nowhere to ask for a readable one
	if (!script.text && (networkType == 'testnet' || typeof NODE_FORMAT_GATEWAY == 'undefined')) return;

	const details = $(formatBoxScript(box.ergoTree));

	details.on('toggle', () => {
		if (details[0].open) showScript(details, box.ergoTree);
	});

	details.find('.script-copy').on('click', e => copyScript(e, box.ergoTree));

	card.append(details);
}

function formatBoxScript(tree) {
	const constants = parseTree(tree).constants;

	let html = '<details class="box-script"><summary class="box-section">Script'
		+ '<a class="script-copy" title="Copy script" aria-label="Copy script" href="Copy to clipboard!">&#128203;</a></summary>'
		+ '<pre class="script-code"></pre>';

	if (constants.length > 0) {
		html += '<div class="box-section">Constants</div><div class="box-grid box-registers context-variables">';

		constants.forEach((constant, index) => {
			html += '<span title="' + escapeHtmlString(constant.type.toString()) + '">' + index + '</span><span>' + formatConstant(constant) + '</span>';
		});

		html += '</div>';
	}

	return html + '</details>';
}

async function showScript(details, tree) {
	const code = details.find('.script-code');

	if (!scripts.get(tree).text) code.text('Loading...');

	const text = await getScript(tree);

	if (text) {
		code.html(formatScript(text, tree));
	} else {
		code.text('Script not available right now.');
	}
}

// The readable script, or null. Boxes with the same script share one request, forgotten if it fails.
function getScript(tree) {
	const script = scripts.get(tree);

	if (script.text) return Promise.resolve(script.text);

	if (!script.request) {
		script.request = requestScript([...script.boxIds]).then(text => {
			script.text = text;
			script.request = null;

			return text;
		});
	}

	return script.request;
}

// A box SCRIPT_HOST doesn't have is asked of the gateway and the API. Which form they give runs in
// streaks on each, so every round asks both.
async function requestScript(boxIds) {
	const ask = async (url, timeoutMs = BOX_SCRIPTS_TIMEOUT_MS) => {
		const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
		const box = response.ok ? await response.json() : null;

		if (!box || !isReadableScript(box.ergoTreeScript)) throw new Error('No readable script');

		return box.ergoTreeScript;
	};

	// Any box with the script will do: a few, as the newest may not be indexed there
	try {
		return await Promise.any(boxIds.slice(0, 3).map(boxId => ask(SCRIPT_HOST + 'boxes/' + boxId, SCRIPT_HOST_TIMEOUT_MS)));
	} catch {}

	for (let i = 0; i < SCRIPT_TRIES && boxIds.length > 0; i++) {
		if (i > 0) await new Promise(resolve => setTimeout(resolve, SCRIPT_RETRY_MS));

		// The query keeps the gateway from answering with its cached copy
		const path = boxIds[i % boxIds.length] + '?t=' + Date.now();

		try {
			return await Promise.any([
				ask(NODE_FORMAT_GATEWAY + 'explorer/api/v1/boxes/' + path),
				ask(API_HOST_2 + 'boxes/' + path)
			]);
		} catch {}
	}

	return null;
}

// Escaped, with the constants in place of their placeholders
function formatScript(scriptText, tree) {
	const { constants, body } = parseTree(tree);
	const text = fillExecuteFromVar(scriptText, body);
	let html = '';
	let end = 0;

	for (const match of text.matchAll(SCRIPT_PLACEHOLDER)) {
		const value = getInlineConstant(constants[match[1]]);

		html += escapeHtmlString(text.substring(end, match.index));
		html += value !== null
			? '<span class="script-constant" title="Constant ' + match[1] + '">' + escapeHtmlString(value) + '</span>'
			: escapeHtmlString(match[0]);
		end = match.index + match[0].length;
	}

	return html + escapeHtmlString(text.substring(end));
}

// The decompiler prints an error where a contract runs a script from a context variable. Which
// variable is in the tree: opcode d4, type 08 (SigmaProp), number. Left out if the counts differ.
function fillExecuteFromVar(text, body) {
	const error = 'DeserializeContext is currently not implemented';
	const numbers = [];

	for (let i = 0; i + 6 <= body.length; i += 2) {
		if (body.startsWith('d408', i)) numbers.push(parseInt(body.substring(i + 4, i + 6), 16));
	}

	const parts = text.split(error);

	return parts.length - 1 == numbers.length
		? parts.map((part, i) => part + (i < numbers.length ? 'executeFromVar[SigmaProp](' + numbers[i] + ')' : '')).join('')
		: parts.join('executeFromVar');
}

// In the summary, where preventDefault also keeps the click from folding it
async function copyScript(e, tree) {
	e.preventDefault();

	const text = await getScript(tree);

	if (text) {
		copyToClipboard(e, $('<pre>').html(formatScript(text, tree)).text());
	} else {
		showCustomToast('Script not available right now.');
	}
}

// The segregated constants at the head of an ErgoTree and, as hex, what follows them. No constants
// and the whole tree if there's one Fleet can't read.
function parseTree(tree) {
	const unread = { constants: [], body: tree };
	const constants = [];
	let offset = 2;

	try {
		const header = parseInt(tree.substring(0, 2), 16);

		const readVlq = () => {
			let value = 0;
			let shift = 0;
			let byte;

			do {
				byte = parseInt(tree.substring(offset, offset + 2), 16);
				if (isNaN(byte)) throw new Error('Unexpected end of tree');
				value += (byte & 127) * 2 ** shift;
				shift += 7;
				offset += 2;
			} while (byte & 128);

			return value;
		};

		if (!(header & 16)) return unread;
		if (header & 8) readVlq();

		for (let left = readVlq(); left > 0; left--) {
			const constant = qfleetSDK.SConstant.from(tree.substring(offset));
			const bytes = constant.toHex();

			// The only way to tell its length, so it has to read back the same
			if (!tree.startsWith(bytes, offset)) return unread;

			constants.push(constant);
			offset += bytes.length;
		}
	} catch {
		return unread;
	}

	return { constants: constants, body: tree.substring(offset) };
}

// A constant as it reads in a script, or null to leave its placeholder
function getInlineConstant(constant) {
	if (!constant) return null;

	let value = null;

	if (constant.data instanceof Uint8Array) {
		value = bytesToHex(constant.data);
	} else if (['bigint', 'number', 'boolean'].includes(typeof constant.data)) {
		value = constant.data.toString();
	}

	return value && value.length <= SCRIPT_INLINE_LENGTH ? value : null;
}

function formatConstant(constant) {
	return constant.data instanceof Uint8Array && constant.data.length > CONTEXT_BYTES_SHOWN
		? formatLongContextBytes(constant.data)
		: formatRegisterValue(constant.data, constant.type, true);
}

// The extensions of a tx's inputs, by box id, from the node. Null if it doesn't have the tx.
async function getContextExtensions(txId, mempool) {
	const path = mempool ? 'transactions/unconfirmed/byTransactionId/' : 'blockchain/transaction/byId/';
	const response = await fetch(NODE_FORMAT_GATEWAY + path + txId, { signal: AbortSignal.timeout(BOX_SCRIPTS_TIMEOUT_MS) });
	const tx = response.ok ? await response.json() : null;

	if (!tx || tx.id !== txId) return null;

	return new Map(tx.inputs.map(input => [input.boxId, (input.spendingProof && input.spendingProof.extension) || input.extension || {}]));
}

function formatContextVariables(extension) {
	let html = '<div class="box-section">Context variables</div><div class="box-grid box-registers context-variables">';

	for (const key of Object.keys(extension).sort((a, b) => a - b)) {
		const serialized = String(extension[key]);
		let type = '';
		let value;

		try {
			const constant = qfleetSDK.SConstant.from(serialized);
			type = constant.type.toString();
			value = formatConstant(constant);
		} catch {
			value = '<span class="box-hex">' + escapeHtmlString(serialized) + '</span>';
		}

		html += '<span title="' + escapeHtmlString(type) + '">' + escapeHtmlString(key) + '</span><span>' + value + '</span>';
	}

	return html + '</div>';
}

// Mostly scripts: the hash the contract knows them by, with the bytes folded away
function formatLongContextBytes(bytes) {
	const hex = bytesToHex(bytes);
	const hash = typeof blake2b256Hex == 'function' ? blake2b256Hex(bytes) : null;

	return (hash ? '<span class="text-light">Blake2b-256</span> <span class="box-hex">' + hash + '</span> ' + copyIcon(hash) : '')
		+ '<details><summary>' + bytes.length.toLocaleString('en-US') + ' bytes</summary>'
		+ '<div class="context-bytes box-hex">' + hex + '</div>'
		+ '<a href="Copy to clipboard!" onclick="copyContextBytes(event, this)">Copy bytes &#128203;</a></details>';
}

function copyContextBytes(e, element) {
	copyToClipboard(e, $(element).siblings('.context-bytes').text());
}
