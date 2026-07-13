/*
 * Token hover popup.
 *
 * Ported (simplified, no glassmorphism) from the svelte-5 branch's
 * TokenPopup / popupManager. Any element carrying a `data-token-id`
 * attribute (see getAssetTitleParams in main.js) shows a small info
 * card on hover: icon, name, price, decimals, supply, description and
 * a link to the token page. Data comes from POST tokens/byId, cached
 * in memory so repeated hovers don't refetch.
 */
(function () {
	var HIDE_DELAY = 150;
	var tokenCache = {};   // id -> token object (or null when not found)
	var inflight = {};     // id -> jqXHR/Promise being fetched
	var popup = null;
	var currentId = null;
	var visible = false;
	var hideTimer = null;
	var lastX = 0;
	var lastY = 0;

	function escapeHtml(s) {
		return ('' + (s == null ? '' : s))
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function tokenUrl(id) {
		if (typeof getTokenUrl === 'function') {
			return getTokenUrl(id);
		}
		return '/token?' + encodeURIComponent(id);
	}

	function shortId(id) {
		if (typeof formatAddressString === 'function') {
			return formatAddressString(id, 15);
		}
		return id.length > 19 ? id.substring(0, 15) + '...' + id.substring(id.length - 4) : id;
	}

	function formatPrice(p) {
		var digits = p >= 1 ? 2 : 6;
		return '$' + Number(p).toLocaleString('en-US', {
			maximumFractionDigits: digits,
			minimumFractionDigits: 2
		});
	}

	function formatSupply(emissionAmount, decimals) {
		var d = parseInt(decimals, 10) || 0;
		var supply = Number(emissionAmount) / Math.pow(10, d);
		if (!isFinite(supply)) {
			return null;
		}
		return supply.toLocaleString('en-US', { maximumFractionDigits: d > 0 ? 2 : 0 });
	}

	function ensurePopup() {
		if (popup) {
			return popup;
		}
		popup = document.createElement('div');
		popup.id = 'tokenHoverPopup';
		popup.className = 'token-hover-popup';
		popup.style.display = 'none';
		document.body.appendChild(popup);
		return popup;
	}

	function fetchToken(id) {
		if (Object.prototype.hasOwnProperty.call(tokenCache, id)) {
			return $.Deferred().resolve(tokenCache[id]).promise();
		}
		if (inflight[id]) {
			return inflight[id];
		}

		var host = (typeof ERGEXPLORER_API_HOST !== 'undefined')
			? ERGEXPLORER_API_HOST
			: 'https://api.ergexplorer.com/';

		var req = $.ajax({
			url: host + 'tokens/byId',
			type: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({ ids: [id] })
		}).then(function (data) {
			var token = (data && data.items && data.items[0]) ? data.items[0] : null;
			tokenCache[id] = token;
			delete inflight[id];
			return token;
		}, function () {
			delete inflight[id];
			return null;
		});

		inflight[id] = req;
		return req;
	}

	function position(x, y) {
		if (!popup) {
			return;
		}
		var pad = 12;
		var w = popup.offsetWidth;
		var h = popup.offsetHeight;
		var left = x + 16;
		var top = y + 16;

		if (left + w > window.innerWidth - pad) {
			left = x - 16 - w;           // flip to the left of the cursor
		}
		if (left < pad) {
			left = pad;
		}
		if (top + h > window.innerHeight - pad) {
			top = window.innerHeight - pad - h;
		}
		if (top < pad) {
			top = pad;
		}
		popup.style.left = left + 'px';
		popup.style.top = top + 'px';
	}

	function renderLoading(id, name, scam) {
		var iconFa = '<i class="fas fa-coins thp-fa-icon"></i>';
		var html = '' +
			'<div class="thp-header">' +
				'<div class="thp-title">' + iconFa +
					'<span class="thp-name">' + escapeHtml(name || shortId(id)) + '</span>' +
				'</div>' +
				'<span class="thp-copy" title="Copy token ID"><i class="fas fa-copy"></i></span>' +
			'</div>' +
			'<div class="thp-loading"><span class="thp-spinner"></span> Loading...</div>' +
			(scam ? '<div class="thp-warning"><i class="fas fa-exclamation-triangle"></i> Reported as suspicious by users</div>' : '') +
			'<div class="thp-actions"><a class="thp-link" href="' + escapeHtml(tokenUrl(id)) + '">' +
				'<i class="fas fa-external-link-alt"></i> View Details</a></div>';
		popup.innerHTML = html;
	}

	function renderToken(id, fallbackName, token, triggerScam) {
		var name = (token && token.name) || fallbackName || shortId(id);
		var iconUrl = token && token.iconurl;
		var nftImage = token && token.cachedurl;
		var scam = (token && token.scam === true) || triggerScam;

		var iconHtml = iconUrl
			? '<img class="thp-icon" src="' + escapeHtml(iconUrl) + '" alt="" onerror="this.remove()" />'
			: '<i class="fas fa-coins thp-fa-icon"></i>';

		var rows = '';

		rows += '<div class="thp-row"><span class="thp-label">ID:</span> ' + escapeHtml(shortId(id)) + '</div>';

		if (typeof prices !== 'undefined' && prices && prices[id] != null && !isNaN(prices[id])) {
			rows += '<div class="thp-row"><span class="thp-label">Price:</span> ' + escapeHtml(formatPrice(prices[id])) + '</div>';
		}

		if (token && token.decimals !== undefined && token.decimals !== null) {
			rows += '<div class="thp-row"><span class="thp-label">Decimals:</span> ' + escapeHtml(parseInt(token.decimals, 10) || 0) + '</div>';
		}

		if (token && token.emissionAmount) {
			var supply = formatSupply(token.emissionAmount, token.decimals);
			if (supply) {
				rows += '<div class="thp-row"><span class="thp-label">Supply:</span> ' + escapeHtml(supply) + '</div>';
			}
		}

		if (token && token.description) {
			var desc = ('' + token.description).trim();
			if (desc.length > 140) {
				desc = desc.substring(0, 140) + '...';
			}
			if (desc) {
				rows += '<div class="thp-description">' +
					'<div class="thp-label">Description:</div>' +
					'<div class="thp-desc-text">' + escapeHtml(desc) + '</div>' +
				'</div>';
			}
		}

		var html = '' +
			'<div class="thp-header">' +
				'<div class="thp-title">' + iconHtml +
					'<span class="thp-name">' + escapeHtml(name) + '</span>' +
				'</div>' +
				'<span class="thp-copy" title="Copy token ID"><i class="fas fa-copy"></i></span>' +
			'</div>' +
			(nftImage ? '<div class="thp-image"><img src="' + escapeHtml(nftImage) + '" alt="" onerror="this.parentNode.remove()" /></div>' : '') +
			'<div class="thp-details">' + rows + '</div>' +
			(scam ? '<div class="thp-warning"><i class="fas fa-exclamation-triangle"></i> Reported as suspicious by users</div>' : '') +
			'<div class="thp-actions"><a class="thp-link" href="' + escapeHtml(tokenUrl(id)) + '">' +
				'<i class="fas fa-external-link-alt"></i> View Details</a></div>';

		popup.innerHTML = html;
	}

	function show(event, id, name, scam) {
		cancelHide();
		ensurePopup();

		currentId = id;
		visible = true;
		lastX = event.clientX;
		lastY = event.clientY;
		popup.dataset.tokenId = id;

		renderLoading(id, name, scam);
		popup.style.display = 'block';
		position(lastX, lastY);

		fetchToken(id).then(function (token) {
			// Only update if the user is still hovering this same token.
			if (currentId === id && visible) {
				renderToken(id, name, token, scam);
				position(lastX, lastY);
			}
		});
	}

	function hide() {
		if (popup) {
			popup.style.display = 'none';
		}
		visible = false;
		currentId = null;
	}

	function scheduleHide() {
		cancelHide();
		hideTimer = setTimeout(hide, HIDE_DELAY);
	}

	function cancelHide() {
		if (hideTimer) {
			clearTimeout(hideTimer);
			hideTimer = null;
		}
	}

	function initialize() {
		if (window.__tokenPopupInit) {
			return;
		}
		window.__tokenPopupInit = true;

		document.addEventListener('mouseover', function (event) {
			var target = event.target;
			if (!target || typeof target.closest !== 'function') {
				return;
			}

			var trigger = target.closest('[data-token-id]');
			if (trigger) {
				cancelHide();
				var id = trigger.getAttribute('data-token-id');
				if (id && id !== 'ERG') {
					if (id !== currentId || !visible) {
						show(
							event,
							id,
							trigger.getAttribute('data-token-name') || '',
							trigger.getAttribute('data-token-scam') === '1'
						);
					}
				}
				return;
			}

			if (target.closest('#tokenHoverPopup')) {
				cancelHide();
			}
		});

		document.addEventListener('mouseout', function (event) {
			var target = event.target;
			if (!target || typeof target.closest !== 'function') {
				return;
			}

			var trigger = target.closest('[data-token-id]');
			var pop = target.closest('#tokenHoverPopup');
			if (!trigger && !pop) {
				return;
			}

			var related = event.relatedTarget;
			if (related && typeof related.closest === 'function') {
				if (related.closest('#tokenHoverPopup') || related.closest('[data-token-id]')) {
					return; // moving between trigger and popup - keep open
				}
			}

			scheduleHide();
		});

		// Copy token id from the popup.
		document.addEventListener('click', function (event) {
			var target = event.target;
			if (!target || typeof target.closest !== 'function') {
				return;
			}
			var copyBtn = target.closest('#tokenHoverPopup .thp-copy');
			if (copyBtn && popup && popup.dataset.tokenId) {
				if (typeof copyToClipboard === 'function') {
					copyToClipboard(event, popup.dataset.tokenId);
				} else if (navigator.clipboard) {
					event.preventDefault();
					navigator.clipboard.writeText(popup.dataset.tokenId);
				}
			}
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initialize);
	} else {
		initialize();
	}
})();
