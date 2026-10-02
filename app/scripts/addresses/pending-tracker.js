import { AddressState } from './state.js';
import { ApiClient } from './api-client.js?v=53';

/**
 * "Notify me when it confirms" for the address page's pending txs.
 *
 * Watched txs live in AddressState.trackedTxs (tx id -> { missing, missingSince }) so the tx
 * table can mark their rows. While anything is watched the mempool is re-read every
 * POLL_INTERVAL_MS; a watched tx that has left it is looked up by id in the indexers, which
 * tells "confirmed" (it is in a block) apart from "dropped" (it never got into one).
 * Everything is shown in the page (toast, tab title, table refresh); a browser notification
 * is added where the browser allows one.
 */

// While watching, the mempool is re-read this often (the whole page refreshes every 60s).
const POLL_INTERVAL_MS = 20000;
// Every this many polls, watched txs a mempool still lists are looked up by id anyway,
// in case that mempool is stale or our node is behind.
const FULL_CHECK_EVERY = 3;
// A watched tx that has left every mempool but is in no indexed block is only called dropped
// (replaced, double-spent or evicted) after this long: the indexers can trail the node.
const DROP_GRACE_MS = 10 * 60 * 1000;
// The final "confirmed" toast closes itself after this.
const DONE_TOAST_MS = 10000;

const TITLE_WATCH = 'Notify me when it confirms';
const TITLE_WATCHING = 'Watching for confirmation (click to stop)';

let refreshPage = function() {};
let promptDeclined = false;

// Bumped whenever a watch starts or stops, so a poll still in flight from an old one is ignored.
let watchId = 0;
let pollTimer = null;
let polling = false;
let pollCount = 0;

// What the current watch has settled so far, for the toasts
let confirmedTxs = [];
let droppedCount = 0;

let toastHtml = '';
let dotsTimer = null;
let doneToastTimer = null;
let titleBeforeAlert = null;

export const PendingTracker = {
	init(options) {
		refreshPage = options.refresh;

		window.addEventListener('focus', restoreTitle);
		document.addEventListener('visibilitychange', () => {
			if (!document.hidden) restoreTitle();
		});
	},

	/**
	 * After every render of the tx table: offer to watch its pending txs (once per page load).
	 */
	onPendingTxsRendered(txIds) {
		const promptShown = $('#notificationToast').hasClass('show');

		if (txIds.length === 0 || AddressState.trackedTxs.size > 0) {
			if (promptShown) hideNotificationPermissionToast();
			return;
		}

		if (promptDeclined) return;

		const text = txIds.length === 1
			? 'This address has a pending transaction. Get notified when it confirms?'
			: 'This address has ' + txIds.length + ' pending transactions. Get notified when they confirm?';

		if (promptShown) {
			$('#notificationToastText').text(text);
		} else {
			showNotificationPermissionToast(text);
		}
	},

	acceptPrompt() {
		hideNotificationPermissionToast();

		const txIds = currentPendingIds();
		if (txIds.length > 0) {
			this.track(txIds);
		}
	},

	declinePrompt() {
		promptDeclined = true;
		hideNotificationPermissionToast();
	},

	/**
	 * The bell on a pending row
	 */
	toggle(e, txId) {
		if (e) e.preventDefault();

		if (!AddressState.trackedTxs.has(txId)) {
			// the bell answers the prompt too
			hideNotificationPermissionToast();
			this.track([txId]);
			return;
		}

		AddressState.trackedTxs.delete(txId);

		if (AddressState.trackedTxs.size === 0) {
			this.stop();
		} else {
			syncRows();
			showWatchingToast();
		}
	},

	track(txIds) {
		if (AddressState.trackedTxs.size === 0) {
			watchId++;
			pollCount = 0;
			confirmedTxs = [];
			droppedCount = 0;
		}

		txIds.forEach(txId => {
			if (!AddressState.trackedTxs.has(txId)) {
				AddressState.trackedTxs.set(txId, { missing: false, missingSince: null });
			}
		});

		askNotificationPermission();
		clearTimeout(doneToastTimer);
		syncRows();
		showWatchingToast();

		clearTimeout(pollTimer);
		pollTimer = setTimeout(poll, 0);
	},

	stop() {
		watchId++;
		AddressState.trackedTxs.clear();
		stopPolling();
		syncRows();
		hideToast();
	},

	/**
	 * The bell for a pending row of the tx table (transaction-formatter.js)
	 */
	trackButtonHtml(txId) {
		const tracked = AddressState.trackedTxs.has(txId);
		const title = tracked ? TITLE_WATCHING : TITLE_WATCH;

		return '<button type="button" class="tx-track' + (tracked ? ' active' : '') + '" onclick="togglePendingTxTracking(event, \'' + txId + '\')"' +
			' title="' + title + '" aria-label="' + title + '" aria-pressed="' + tracked + '">' +
			'<i class="' + (tracked ? 'fa-solid' : 'fa-regular') + ' fa-bell" aria-hidden="true"></i></button>';
	}
};

function currentPendingIds() {
	const data = AddressState.mempoolData;
	return data && Array.isArray(data.items) ? data.items.map(tx => tx.id) : [];
}

// The watch runs whatever the answer: without permission, the toast and tab title still tell.
function askNotificationPermission() {
	if (canShowSystemNotifications() && Notification.permission === 'default') {
		requestNotificationPermission();
	}
}

function stopPolling() {
	clearTimeout(pollTimer);
	pollTimer = null;
}

async function poll() {
	pollTimer = null;
	if (polling || AddressState.trackedTxs.size === 0) return;

	const watch = watchId;
	polling = true;

	try {
		await checkTrackedTxs();
	} catch (error) {
		console.error('Pending tx check failed:', error);
	} finally {
		polling = false;
	}

	if (AddressState.trackedTxs.size > 0 && pollTimer === null) {
		// a watch started while this poll was out gets its first check now
		pollTimer = setTimeout(poll, watch === watchId ? POLL_INTERVAL_MS : 0);
	}
}

async function checkTrackedTxs() {
	const watch = watchId;
	const fullCheck = pollCount++ % FULL_CHECK_EVERY === 0;
	let pool = null;

	try {
		pool = await ApiClient.fetchMempool();
	} catch (error) {
		// Every mempool source is down; the indexers can still tell whether a tx confirmed.
		console.warn('Mempool check failed:', error);
	}

	if (watch !== watchId) return;

	const now = Date.now();
	const lookUp = [];

	AddressState.trackedTxs.forEach((entry, txId) => {
		if (pool) {
			entry.missing = !pool.ids.has(txId);

			if (!entry.missing) {
				entry.missingSince = null;
			} else if (pool.complete && entry.missingSince === null) {
				entry.missingSince = now;
			}
		}

		// Our node drops a tx from its pool as soon as the tx is in a block, while the explorer's
		// pool can keep listing it for minutes; so ours decides when a lookup is worth it.
		const inNodePool = pool !== null && (pool.ownIds ? pool.ownIds.has(txId) : !entry.missing);

		if (!inNodePool || fullCheck) {
			lookUp.push(txId);
		}
	});

	const txs = await Promise.all(lookUp.map(txId => ApiClient.getConfirmedTransaction(txId)));

	if (watch !== watchId) return;

	const confirmed = [];
	const dropped = [];

	lookUp.forEach((txId, i) => {
		const entry = AddressState.trackedTxs.get(txId);
		if (!entry) return;

		if (txs[i]) {
			confirmed.push(txs[i]);
		} else if (pool && pool.complete && entry.missing && entry.missingSince !== null && now - entry.missingSince >= DROP_GRACE_MS) {
			dropped.push(txId);
		} else {
			return;
		}

		AddressState.trackedTxs.delete(txId);
	});

	if (confirmed.length > 0 || dropped.length > 0) {
		settle(confirmed, dropped);
	} else {
		showWatchingToast();
	}
}

function settle(confirmed, dropped) {
	confirmed.forEach(tx => AddressState.confirmedTxIds.add(tx.id));
	confirmedTxs = confirmedTxs.concat(confirmed);
	droppedCount += dropped.length;

	notify(confirmed, dropped);
	syncRows();

	if (AddressState.trackedTxs.size === 0) {
		stopPolling();
		showDoneToast();
	} else {
		showWatchingToast();
	}

	// Move the tx from Pending to its block, and update the balance, without waiting for the next refresh.
	refreshPage();
}

/**
 * Browser notification and tab title, for when the user is not looking at the page
 * (when they are, the toast says it all).
 */
function notify(confirmed, dropped) {
	if (document.hasFocus()) return;

	const address = formatAddressString(AddressState.walletAddress, 6);

	if (confirmed.length === 1) {
		showSystemNotification('Transaction confirmed', 'A pending transaction on ' + address + ' was confirmed in block ' + confirmed[0].inclusionHeight + '.');
	} else if (confirmed.length > 1) {
		showSystemNotification(confirmed.length + ' transactions confirmed', confirmed.length + ' pending transactions on ' + address + ' were confirmed.');
	}

	if (dropped.length === 1) {
		showSystemNotification('Transaction dropped', 'A pending transaction on ' + address + ' left the mempool without being confirmed. It may have been replaced or double-spent.');
	} else if (dropped.length > 1) {
		showSystemNotification(dropped.length + ' transactions dropped', dropped.length + ' pending transactions on ' + address + ' left the mempool without being confirmed. They may have been replaced or double-spent.');
	}

	if (titleBeforeAlert === null) {
		titleBeforeAlert = document.title;
	}

	document.title = (confirmed.length > 0 ? '✓ Confirmed' : '⚠ Dropped') + ' · ' + titleBeforeAlert;
}

function restoreTitle() {
	if (titleBeforeAlert === null) return;

	document.title = titleBeforeAlert;
	titleBeforeAlert = null;
}

/**
 * Keep the bells of rows already on screen in step with what is watched
 */
function syncRows() {
	$('#transactionsTableBody .tx-track').each(function() {
		const tracked = AddressState.trackedTxs.has($(this).closest('tr').attr('data-tx-id'));
		const title = tracked ? TITLE_WATCHING : TITLE_WATCH;

		$(this)
			.toggleClass('active', tracked)
			.attr({ 'title': title, 'aria-label': title, 'aria-pressed': tracked ? 'true' : 'false' });
		$(this).find('i')
			.toggleClass('fa-solid', tracked)
			.toggleClass('fa-regular', !tracked);
	});
}

// The toast in layout.njk (#customToast), in its original plain style: "Monitoring mempool..."
// while watching, then one line of outcome that closes itself.
function setToast(html) {
	if (html !== toastHtml) {
		toastHtml = html;
		$('#customToastBody').html(html);
	}

	if (!$('#customToast').hasClass('show')) {
		showCustomToast(html);
	}
}

function hideToast() {
	clearTimeout(doneToastTimer);
	stopDots();
	toastHtml = '';
	hideCustomToast();
}

function stopDots() {
	clearInterval(dotsTimer);
	dotsTimer = null;
}

function plural(count, word) {
	return count + ' ' + word + (count === 1 ? '' : 's');
}

function showWatchingToast() {
	if (AddressState.trackedTxs.size === 0) return;

	setToast('Monitoring mempool<span id="dots">...</span>');

	if (dotsTimer === null) {
		dotsTimer = setInterval(animateDots, 300);
	}
}

function showDoneToast() {
	const confirmed = confirmedTxs.length;
	let text;

	if (droppedCount === 0 && confirmed === 1) {
		text = 'Transaction confirmed in block ' + confirmedTxs[0].inclusionHeight + '.';
	} else if (droppedCount === 0) {
		text = plural(confirmed, 'transaction') + ' confirmed.';
	} else if (confirmed === 0) {
		text = (droppedCount === 1 ? 'Transaction' : plural(droppedCount, 'transaction')) + ' dropped from the mempool without being confirmed.';
	} else {
		text = confirmed + ' confirmed, ' + droppedCount + ' dropped from the mempool without being confirmed.';
	}

	stopDots();
	setToast(text);

	clearTimeout(doneToastTimer);
	doneToastTimer = setTimeout(hideToast, DONE_TOAST_MS);
}
