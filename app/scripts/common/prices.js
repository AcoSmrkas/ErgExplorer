// use objects, not arrays
var prices = {};
var pricesNames = {};
var gotPrices = false;
var callbackCalled = false;
var theCallback;
var pricesData;
var poolsData;

const CACHE_KEY = 'priceCache';
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

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

  $.get('https://api.ergexplorer.com/tokens/getErgPrice', data => {
    erg24hDiff = data.items[0].difference;
    prices['ERG'] = data.items[0].value;
    pricesNames['ERG'] = 'ERG';

    let gotMarkets = false;
    let gotPools = false;

    $.get('https://api.spectrum.fi/v1/price-tracking/markets', data => {
      pricesData = data;
      gotMarkets = true;
      if (gotPools) handlePrices(force);
    }).fail(() => handleError(cache));

    $.get('https://api.spectrum.fi/v1/amm/pools/stats', data => {
      poolsData = data;
      gotPools = true;
      if (gotMarkets) handlePrices(force);
    }).fail(() => handleError(cache));
  }).fail(() => handleError(cache));
}

function handlePrices(force = false) {
  if (!poolsData || !pricesData) return;

  for (let i = 0; i < pricesData.length; i++) {
    let pairData = pricesData[i];
    if (pairData.baseSymbol !== 'ERG') continue;
    if (prices[pairData.quoteId] !== undefined) continue;

    let skip = true;
    for (let j = 0; j < poolsData.length; j++) {
      let poolData = poolsData[j];
      if (poolData.lockedX.id === pairData.baseId &&
          poolData.lockedY.id === pairData.quoteId &&
          (poolData.lockedX.amount / 1e9 >= 1000 || force)) {
        skip = false;
        break;
      }
    }
    if (skip) continue;

    let price = prices['ERG'] / pairData.lastPrice;
    prices[pairData.quoteId] = price;
    pricesNames[pairData.quoteSymbol] = price;
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
