/**
 * The Mining tab of a wallet address: what the chain holds for its key as a miner or
 * as a Lithos lender. None of it sits at the address itself, so wallets don't show it.
 *
 * Ergo pays every block reward to a script that only the miner's key can spend, a day
 * of blocks later. A Lithos lender's principal and permit sit in the pool's contracts
 * with the key in R5 until a Lithos block spends them, and that block's reward is then
 * paid to the lender's key like any miner's.
 */
export const MiningPanel = {
	/**
	 * Fills #miningHolder and returns how many positions and reward boxes it lists,
	 * which is 0 for anything but a wallet (P2PK) address.
	 */
	async load(walletAddress) {
		const publicKey = getPublicKey(walletAddress);

		if (!publicKey) {
			return 0;
		}

		const [positions, rewards] = await Promise.all([
			getLithosPositions(publicKey).catch(error => {
				console.warn('Lithos positions unavailable:', error);
				return { queued: [], live: [] };
			}),
			getBlockRewards(publicKey).catch(error => {
				console.warn('Block rewards unavailable:', error);
				return { items: [], total: 0 };
			})
		]);

		const positionCount = positions.queued.length + positions.live.length;

		if (positionCount == 0 && rewards.total == 0) {
			return 0;
		}

		const [head, height] = await Promise.all([
			positions.queued.length > 0 ? getLithosQueueHead().catch(() => null) : null,
			rewards.items.length > 0 && rewards.items.length >= rewards.total ? getChainHeight().catch(() => null) : null
		]);

		let html = '';

		if (positionCount > 0) {
			html += formatPositions(positions, head);
		}

		if (rewards.total > 0) {
			html += formatRewards(rewards, height, publicKey);
		}

		$('#miningHolder').html(html);

		return positionCount + rewards.total;
	}
};

//The key of a P2PK address; null for a contract
function getPublicKey(address) {
	try {
		const ergoTree = qfleetSDKcore.ErgoAddress.fromBase58(address).ergoTree;

		return ergoTree.startsWith('0008cd') ? ergoTree.substring(6) : null;
	} catch (e) {
		return null;
	}
}

async function getChainHeight() {
	const response = await fetch(getExplorerV1Host() + 'networkState');

	return response.ok ? (await response.json()).height : null;
}

function cell(label, content) {
	return '<td><span class="d-lg-none"><strong>' + label + ': </strong></span>' + content + '</td>';
}

function boxLink(boxId) {
	return '<a href="' + getBoxUrl(boxId) + '">' + formatAddressString(boxId, 6) + '</a>';
}

function heightLink(height) {
	return '<a href="' + getBlockUrl(height) + '">' + nFormatter(height, 0, true, true) + '</a>';
}

function formatPositions(positions, head) {
	let rows = '';

	for (const box of positions.live) {
		rows += positionRow(box, 'Live collateral', 'Any Lithos block can spend it');
	}

	for (const box of positions.queued) {
		const position = Number(box.additionalRegisters.R7.renderedValue);
		const ahead = head == null ? null : Math.max(0, position - head);

		rows += positionRow(box, 'Queued', ahead == null
			? 'Position ' + nFormatter(position, 0, true, true)
			: (ahead == 0 ? 'Next to activate' : nFormatter(ahead, 0, true, true) + ' ahead in the queue'));
	}

	return '<div class="mining-section">'
		+ '<h5 class="mining-heading">Lithos positions <span class="address-section-tab-count">(' + (positions.live.length + positions.queued.length) + ')</span></h5>'
		+ '<p class="mining-note">Collateral this key posted to the Lithos pool. It can\'t be withdrawn: a Lithos block spends it, the permit comes straight back, and that block\'s reward is paid to this key.</p>'
		+ '<table class="table table-dark table-striped table-mobile rounded-data-table"><thead><tr>'
		+ '<th scope="col">Status</th><th scope="col">Principal</th><th scope="col">Permit</th><th scope="col">Since</th><th scope="col">Box</th>'
		+ '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function positionRow(box, status, detail) {
	const permit = getLithosPermit(box);

	return '<tr>'
		+ cell('Status', '<strong>' + status + '</strong><br><span class="text-light">' + detail + '</span>')
		+ cell('Principal', formatErgValueString(box.value, 4))
		+ cell('Permit', permit == null ? '–' : formatAssetValueString(permit, 9, 2, true) + ' LIT')
		+ cell('Since', heightLink(box.settlementHeight))
		+ cell('Box', boxLink(box.boxId))
		+ '</tr>';
}

function formatRewards(rewards, height, publicKey) {
	const heading = '<h5 class="mining-heading">Block rewards <span class="address-section-tab-count">(' + nFormatter(rewards.total, 0, true, true) + ')</span></h5>'
		+ '<p class="mining-note">Ergo pays a block\'s reward to a script only this key can spend, ' + BLOCK_REWARD_DELAY + ' blocks after the block. Wallets don\'t show it. Amounts are what is left after the re-emission share (EIP-27).</p>';

	//The explorer returns unspent boxes in no chain order, so a page of a big miner's rewards
	//would be an arbitrary handful: past one page, point at the reward address instead
	if (rewards.items.length < rewards.total) {
		const address = getP2SAddress(getMinerRewardTree(publicKey));

		return '<div class="mining-section">' + heading
			+ '<p>This key holds ' + nFormatter(rewards.total, 0, true, true) + ' unspent block rewards. They are listed on <a href="' + getWalletAddressUrl(address) + '">its reward address</a>.</p></div>';
	}

	let rows = '';
	const items = [...rewards.items].sort((a, b) => b.creationHeight - a.creationHeight);

	for (const box of items) {
		const owed = (box.assets || []).filter(asset => asset.tokenId == REEMISSION_TOKEN_ID).reduce((sum, asset) => sum + Number(asset.amount), 0);
		const net = box.value - owed;
		const unlocksAt = box.creationHeight + BLOCK_REWARD_DELAY;
		//The box holds the re-emission share too, which spending it pays back
		const gross = owed > 0 ? '<br><span class="text-light">of ' + formatErgValueString(box.value, 4) + ' in the box</span>' : '';

		let spendable = '–';

		if (height != null) {
			spendable = height >= unlocksAt
				? '<span class="text-success">Now</span>'
				: 'At ' + heightLink(unlocksAt) + ' <span class="text-light">(~' + formatBlocksAway(unlocksAt - height) + ')</span>';
		}

		rows += '<tr>'
			+ cell('Block', heightLink(box.creationHeight))
			+ cell('Reward', formatErgValueString(net, 4) + gross)
			+ cell('Spendable', spendable)
			+ cell('Box', boxLink(box.boxId))
			+ '</tr>';
	}

	return '<div class="mining-section">' + heading
		+ '<table class="table table-dark table-striped table-mobile rounded-data-table"><thead><tr>'
		+ '<th scope="col">Block</th><th scope="col">Reward</th><th scope="col">Spendable</th><th scope="col">Box</th>'
		+ '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

//Ergo aims for a block every two minutes
function formatBlocksAway(blocks) {
	const minutes = blocks * 2;

	return minutes < 120 ? minutes + ' min' : Math.round(minutes / 60) + ' h';
}
