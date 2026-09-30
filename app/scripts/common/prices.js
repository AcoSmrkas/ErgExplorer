// use objects, not arrays
var prices = {};
var pricesNames = {};
var gotPrices = false;
var callbackCalled = false;
var theCallback;
var pricesData;

const CACHE_KEY = 'priceCacheFiltered';
const FORCE_CACHE_KEY = 'priceCacheFull';
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const EXCEPTIONS = [
  // LIT, priced from its Lithos pool; keep it a financial asset if the pool thins
  'c1980d829988229516430a47a5eca376060b6ce859616db0936e78ab25cb6de7'
];

function getPrices(callback, force = false) {
  theCallback = callback;

  // load cache
  const cacheRaw = localStorage.getItem(force ? FORCE_CACHE_KEY : CACHE_KEY);
  let cache = null;
  if (cacheRaw) {
    try { cache = JSON.parse(cacheRaw); } 
    catch (e) { console.warn('⚠️ Failed to parse cached data', e); }
  }

  const now = Date.now();
  
  // use fresh cache if valid
  if (!force && cache && now - cache.timestamp < CACHE_TIME) {
	const keys = cache.keys;
	const names = cache.names;

	prices = {};
	pricesNames = {};
	
	for (let i = 0; i < keys.length; i++) {
		prices[keys[i]] = cache.values[i];
		pricesNames[names[i]] = cache.values[i];
	}

    gotPrices = true;
    callbackCalled = false; // reset to allow callback
    doCallback();
    return;
  }

  // Get ERG price
  $.get('https://api.ergexplorer.com/tokens/getErgPrice', data => {
    const ergPrice = data.items[0].value;
    prices['ERG'] = ergPrice;
    pricesNames['ERG'] = ergPrice;

    // Fetch token data from our own Spectrum price feed.
    // Was api.cruxfinance.io/spectrum/token_list, which first started returning
    // HTTP 200 with a truncated body and is now unreachable entirely. This feed
    // is derived on-chain from Spectrum pool boxes; same field names
    // (id / ticker / price_erg / liquidity), wrapped in { items }.
    $.ajax({
      url: 'https://api.ergexplorer.com/tokens/getTokenPrices',
      type: 'GET',
      dataType: 'json',
      timeout: 15000,
      success: function(data) {
        pricesData = (data && data.items) ? data.items : [];
        handlePrices(force, ergPrice);
      },
      error: function() {
        handleError(cache);
      }
    });
  }).fail(() => handleError(cache));
}

function handlePrices(force = false, ergPrice) {
  if (!pricesData) return;

  prices = {};
  pricesNames = {};
  prices['ERG'] = ergPrice;
  pricesNames['ERG'] = ergPrice;

  for (let i = 0; i < pricesData.length; i++) {
    let tokenData = pricesData[i];

    // Skip if ticker already exists
    if (pricesNames[tokenData.ticker] !== undefined) continue;
    
    // Filter by liquidity (>= 2000) unless forced or in exceptions
    if (tokenData.liquidity < 2000 && !force && !EXCEPTIONS.includes(tokenData.id)) {
      continue;
    }

    // Calculate price: ERG price * token price in ERG
    let price = ergPrice * tokenData.price_erg;
    prices[tokenData.id] = price;
    pricesNames[tokenData.ticker] = price;
  }

  gotPrices = true;

  // save only objects
  localStorage.setItem(force ? FORCE_CACHE_KEY : CACHE_KEY, JSON.stringify({
    keys: Object.keys(prices),
	names: Object.keys(pricesNames),
	values: Object.values(prices),
    timestamp: Date.now()
  }));

  doCallback();
}

function handleError(cache) {
  if (cache) {
	const keys = cache.keys;
	const names = cache.names;

	prices = {};
	pricesNames = {};
	
	for (let i = 0; i < keys.length; i++) {
		prices[keys[i]] = cache.values[i];
		pricesNames[names[i]] = cache.values[i];
	}

    gotPrices = true;
  }
  doCallback();
}

function doCallback() {
  if (callbackCalled) return;
  callbackCalled = true;
  theCallback();
}
