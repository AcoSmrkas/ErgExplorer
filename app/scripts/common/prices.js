// use objects, not arrays
var prices = {};
var pricesNames = {};
var gotPrices = false;
var callbackCalled = false;
var theCallback;
var pricesData;

const CACHE_KEY = 'priceCache';
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const EXCEPTIONS = [
  '6122f7289e7bb2df2de273e09d4b2756cda6aeb0f40438dc9d257688f45183ad',
  'a55b8735ed1a99e46c2c89f8994aacdf4b1109bdcf682f1e5b34479c6e392669'
];

function getPrices(callback, force = false) {
  theCallback = callback;

  // load cache
  const cacheRaw = localStorage.getItem(CACHE_KEY);
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
	
	for (let i = 0; i < keys.length; i++) {
		prices[keys[i]] = cache.values[i];
		pricesNames[names[i]] = cache.values[i];
	}

    gotPrices = true;
    callbackCalled = false; // reset to allow callback
    doCallback();
    return;
  }

  // Get ERG price from CoinGecko
  $.get('https://api.coingecko.com/api/v3/simple/price?ids=ergo&vs_currencies=usd&precision=15', data => {
    const ergPrice = data.ergo.usd;
    prices['ERG'] = ergPrice;
    pricesNames['ERG'] = ergPrice;

    // Fetch token data from Crux Finance
    $.ajax({
      url: 'https://api.cruxfinance.io/spectrum/token_list',
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'Origin': 'https://cruxfinance.io',
        'Referer': 'https://cruxfinance.io/'
      },
      data: JSON.stringify({
        sort_by: 'Volume',
        sort_order: 'Desc',
        limit: 500,
        offset: 0,
        filter_window: 'Day',
        name_filter: ''
      }),
      success: function(data) {
        pricesData = data;
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

  for (let i = 0; i < pricesData.length; i++) {
    let tokenData = pricesData[i];

    // Skip if ticker already exists
    if (prices[tokenData.ticker] !== undefined) continue;

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
  localStorage.setItem(CACHE_KEY, JSON.stringify({
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
