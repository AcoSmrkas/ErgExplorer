/**
 * A notice on a wallet (P2PK) address whose boxes can be charged storage rent now or within the
 * next 30 days, with a link to consolidate them. The list comes from api.ergexplorer.com
 * (storageRent/byAddress), which a cron keeps. Mainnet only.
 */
const CONSOLIDATE_URL = 'https://tools.mewfinance.com/consolidate';
const BLOCKS_PER_DAY = 720;

export const StorageRentNotice = {
	async load(walletAddress) {
		if (networkType == 'testnet' || !isWalletAddress(walletAddress)) {
			return;
		}

		const response = await fetch(ERGEXPLORER_API_HOST + 'storageRent/byAddress?address=' + encodeURIComponent(walletAddress), { cache: 'no-store' });
		if (!response.ok) {
			throw new Error('HTTP ' + response.status);
		}

		const data = await response.json();
		if (!data.items || data.items.length == 0) {
			return;
		}

		$('#rentNoticeText').text(formatNotice(data.items, data.line));
		$('#rentNoticeLink').attr('href', CONSOLIDATE_URL);
		$('#rentNotice').show();
		new bootstrap.Tooltip(document.getElementById('rentNoticeHelp'));
	}
};

function isWalletAddress(address) {
	try {
		return qfleetSDKcore.ErgoAddress.getAddressType(address) == qfleetSDKcore.AddressType.P2PK;
	} catch (e) {
		return false;
	}
}

function formatNotice(items, line) {
	const nowItems = items.filter(item => item.creationHeight <= line);
	const laterCount = items.length - nowItems.length;

	if (nowItems.length > 0) {
		return boxes(nowItems.length) + ' here can be charged ' + formatRent(nowItems) + ' storage rent now'
			+ (laterCount > 0 ? ', ' + laterCount + ' more within 30 days.' : '.');
	}

	const soonest = Math.min(...items.map(item => item.creationHeight)) - line;
	const when = formatBlocks(soonest);

	return items.length == 1
		? '1 box here can be charged ' + formatRent(items) + ' storage rent in ' + when + '.'
		: boxes(items.length) + ' here can be charged ' + formatRent(items) + ' storage rent, the first in ' + when + '.';
}

function formatRent(items) {
	const rent = items.reduce((sum, item) => sum.plus(item.rent), new BigNumber(0)).dividedBy(1000000000);

	return rent.toFormat(rent.gte(10) ? 2 : 4).replace(/\.?0+$/, '') + ' ERG';
}

function boxes(count) {
	return count + (count == 1 ? ' box' : ' boxes');
}

// A block about every 2 minutes: a day or more out, the days too
function formatBlocks(blocks) {
	const text = blocks.toLocaleString('en-US') + (blocks == 1 ? ' block' : ' blocks');
	const days = Math.round(blocks / BLOCKS_PER_DAY);

	return blocks >= BLOCKS_PER_DAY ? text + ' (~' + days + (days == 1 ? ' day)' : ' days)') : text;
}
