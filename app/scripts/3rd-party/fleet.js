var qfleetSDK;
var qfleetSDKcore;

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

// src/utils/assertions.ts
function assert(condition, error) {
  if (condition)
    return;
  let err = void 0;
  switch (typeof error) {
    case "string":
      err = new Error(error);
      break;
    case "function":
      err = new Error(error());
      break;
    default:
      err = error;
  }
  throw err;
}
function assertTypeOf(obj, expected) {
  const type = typeof obj;
  if (type !== expected) {
    throw new Error(`Expected an object of type '${expected}', got '${type}'.`);
  }
}
var toString = (value) => Object.prototype.toString.call(value);
function getTypeName(value) {
  if (value === null)
    return "null";
  const type = typeof value;
  return type === "object" || type === "function" ? toString(value).slice(8, -1) : type;
}
function assertInstanceOf(obj, expected) {
  const condition = obj instanceof expected;
  if (!condition) {
    throw new Error(`Expected an instance of '${expected.name}', got '${getTypeName(obj)}'.`);
  }
}
function isEmpty(obj) {
  if (!obj)
    return true;
  return Array.isArray(obj) ? obj.length === 0 : Object.keys(obj).length === 0;
}
function some(obj) {
  return !isEmpty(obj);
}
function isTruthy(value) {
  return !!value;
}
function isFalsy(value) {
  return !value;
}
function isUndefined(v) {
  return v === void 0 || v === null || Number.isNaN(v);
}
function isDefined(v) {
  return !isUndefined(v);
}
function hasKey(o, key) {
  return Object.prototype.hasOwnProperty.call(o, key);
}

// src/utils/array.ts
function first(array) {
  if (!array)
    return void 0;
  assert(array.length > 0, "Empty array.");
  return array[0];
}
function last(array) {
  if (!array)
    return void 0;
  assert(array.length > 0, "Empty array.");
  return at(array, -1);
}
function at(array, index) {
  const len = array?.length;
  if (!len)
    return void 0;
  if (index < 0) {
    index += len;
  }
  return array[index];
}
function hasDuplicates(array) {
  return array.some((item, index) => {
    return array.indexOf(item) !== index;
  });
}
function hasDuplicatesBy(array, selector) {
  return array.some((item, index) => {
    return array.findIndex((x) => selector(x) === selector(item)) !== index;
  });
}
function chunk(array, size) {
  if (array.length <= size) {
    return [array];
  }
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
function orderBy(array, iteratee, order = "asc") {
  return [...array].sort((a, b) => {
    if (iteratee(a) > iteratee(b)) {
      return order === "asc" ? 1 : -1;
    } else if (iteratee(a) < iteratee(b)) {
      return order === "asc" ? -1 : 1;
    } else {
      return 0;
    }
  });
}
function areEqual(array1, array2) {
  if (array1 === array2) {
    return true;
  }
  if (array1.length != array2.length) {
    return false;
  }
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}
function areEqualBy(array1, array2, selector) {
  if (array1 === array2) {
    return true;
  }
  if (array1.length != array2.length) {
    return false;
  }
  for (let i = 0; i < array1.length; i++) {
    if (selector(array1[i]) !== selector(array2[i])) {
      return false;
    }
  }
  return true;
}
function startsWith(array, target) {
  if (array === target) {
    return true;
  }
  if (target.length > array.length) {
    return false;
  }
  for (let i = 0; i < target.length; i++) {
    if (target[i] !== array[i]) {
      return false;
    }
  }
  return true;
}
function endsWith(array, target) {
  if (array === target) {
    return true;
  }
  if (target.length > array.length) {
    return false;
  }
  const offset = array.length - target.length;
  for (let i = target.length - 1; i >= 0; i--) {
    if (target[i] !== array[i + offset]) {
      return false;
    }
  }
  return true;
}
function uniq(array) {
  if (isEmpty(array)) {
    return array;
  }
  return Array.from(new Set(array));
}
function uniqBy(array, selector, selection = "keep-first") {
  if (isEmpty(array)) {
    return array;
  }
  return Array.from(
    array.reduce((map, e) => {
      const key = selector(e);
      if (selection === "keep-first" && map.has(key)) {
        return map;
      }
      return map.set(key, e);
    }, /* @__PURE__ */ new Map()).values()
  );
}
function depthOf(array) {
  return Array.isArray(array) ? 1 + Math.max(0, ...array.map(depthOf)) : 0;
}

// src/utils/bigInt.ts
var _0n = BigInt(0);
var _1n = BigInt(1);
var _7n = BigInt(7);
var _10n = BigInt(10);
var _63n = BigInt(63);
var _127n = BigInt(127);
var _128n = BigInt(128);
function ensureBigInt(number) {
  return typeof number === "bigint" ? number : BigInt(number);
}
function undecimalize(decimalStr, options) {
  if (!decimalStr) {
    return _0n;
  }
  options = typeof options == "number" ? { decimals: options } : options;
  if (isUndefined(options)) {
    options = {};
  }
  options.decimals = options.decimals || 0;
  options.decimalMark = options.decimalMark || ".";
  const fragments = decimalStr.split(options.decimalMark);
  if (fragments.length > 2) {
    throw new Error("Invalid numeric string.");
  }
  let [integer, decimal] = fragments;
  integer = _removeLeadingZeros(integer);
  const negative = integer.startsWith("-") ? "-" : "";
  if (!decimal) {
    decimal = "0".repeat(options.decimals);
  } else if (decimal.length < options.decimals) {
    decimal = decimal.padEnd(options.decimals, "0");
  }
  return BigInt(negative + _stripNonDigits(integer + decimal));
}
function _stripNonDigits(value) {
  return value.replace(/\D/g, "");
}
function decimalize(value, options) {
  value = ensureBigInt(value);
  if (!options) {
    return value.toString();
  }
  options = typeof options == "number" ? { decimals: options } : options;
  options.decimals = options.decimals || 0;
  options.decimalMark = options.decimalMark || ".";
  const pow = _10n ** BigInt(options.decimals);
  const integer = value / pow;
  const decimal = value - integer * pow;
  return _buildFormattedDecimal(integer.toString(10), decimal.toString(10), options);
}
function percent(value, percentage, precision = 2n) {
  return value * percentage / 10n ** precision;
}
function _buildFormattedDecimal(integer, decimal, options) {
  const integerPart = _addThousandMarks(integer, options.thousandMark);
  const decimalPart = _stripTrailingZeros(decimal.padStart(options.decimals, "0"));
  if (decimalPart) {
    return `${integerPart}${options.decimalMark}${decimalPart}`;
  } else {
    return integerPart;
  }
}
function _addThousandMarks(value, mark) {
  if (!mark) {
    return value;
  }
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, mark);
}
function _stripTrailingZeros(value) {
  if (!value.endsWith("0")) {
    return value;
  }
  return value.replace(/\.?0+$/, "");
}
function _removeLeadingZeros(value) {
  if (!value.startsWith("0")) {
    return value;
  }
  return value.replace(/^0+\.?/, "");
}
function sumBy(collection, iteratee, condition) {
  let acc = _0n;
  if (isEmpty(collection)) {
    return acc;
  }
  for (const item of collection) {
    if (isUndefined(condition) || condition(item)) {
      acc += iteratee(item);
    }
  }
  return acc;
}
function min(...numbers) {
  let min2 = first(numbers);
  for (const num of numbers) {
    if (num < min2) {
      min2 = num;
    }
  }
  return min2;
}
function max(...numbers) {
  let max2 = first(numbers);
  for (const num of numbers) {
    if (num > max2) {
      max2 = num;
    }
  }
  return max2;
}

// src/utils/utxo.ts
var NANOERGS_TOKEN_ID = "nanoErgs";
function utxoSum(boxes, tokenId) {
  const balances = {};
  for (const box of boxes) {
    if (isUndefined(tokenId) || tokenId === NANOERGS_TOKEN_ID) {
      balances[NANOERGS_TOKEN_ID] = (balances[NANOERGS_TOKEN_ID] || _0n) + ensureBigInt(box.value);
    }
    if (tokenId !== NANOERGS_TOKEN_ID) {
      for (const token of box.assets) {
        if (isDefined(tokenId) && tokenId !== token.tokenId) {
          continue;
        }
        balances[token.tokenId] = (balances[token.tokenId] || _0n) + ensureBigInt(token.amount);
      }
    }
  }
  if (isDefined(tokenId)) {
    return balances[tokenId] || _0n;
  }
  return {
    nanoErgs: balances[NANOERGS_TOKEN_ID] || _0n,
    tokens: Object.keys(balances).filter((x) => x !== NANOERGS_TOKEN_ID).map((tokenId2) => ({ tokenId: tokenId2, amount: balances[tokenId2] }))
  };
}
function utxoDiff(minuend, subtrahend) {
  if (Array.isArray(minuend)) {
    minuend = utxoSum(minuend);
  }
  if (Array.isArray(subtrahend)) {
    subtrahend = utxoSum(subtrahend);
  }
  const tokens = [];
  const nanoErgs = minuend.nanoErgs - subtrahend.nanoErgs;
  for (const token of minuend.tokens) {
    const balance = token.amount - (subtrahend.tokens.find((t) => t.tokenId === token.tokenId)?.amount || _0n);
    if (balance !== _0n) {
      tokens.push({ tokenId: token.tokenId, amount: balance });
    }
  }
  return { nanoErgs, tokens };
}
var MIN_NON_MANDATORY_REGISTER_INDEX = 4;
var MAX_NON_MANDATORY_REGISTER_INDEX = 9;
function areRegistersDenselyPacked(registers) {
  let lastIndex = 0;
  for (let i = MIN_NON_MANDATORY_REGISTER_INDEX; i <= MAX_NON_MANDATORY_REGISTER_INDEX; i++) {
    const key = `R${i}`;
    if (registers[key]) {
      if (i === MIN_NON_MANDATORY_REGISTER_INDEX) {
        lastIndex = i;
        continue;
      }
      if (i - lastIndex > 1) {
        return false;
      }
      lastIndex = i;
    }
  }
  return true;
}
function utxoFilter(utxos, filterParams) {
  if (isEmpty(filterParams) || isEmpty(utxos)) {
    return utxos;
  }
  const { by, max: max2 } = filterParams;
  let filtered = utxos;
  if (by) {
    filtered = utxos.filter(by);
    if (isEmpty(filtered)) {
      return filtered;
    }
  }
  if (!max2) {
    return filtered;
  }
  if (isDefined(max2.aggregatedDistinctTokens)) {
    const tokenIds = _getDistinctTokenIds(filtered, max2.aggregatedDistinctTokens);
    filtered = filtered.filter(
      (utxo) => isEmpty(utxo.assets) || utxo.assets.every((token) => tokenIds.has(token.tokenId))
    );
  }
  if (isDefined(max2.count) && filtered.length > max2.count) {
    filtered = filtered.slice(0, max2.count);
  }
  return filtered;
}
function _getDistinctTokenIds(utxos, max2) {
  const tokenIds = /* @__PURE__ */ new Set();
  for (let i = 0; i < utxos.length && tokenIds.size < max2; i++) {
    if (isEmpty(utxos[i].assets) || utxos[i].assets.length > max2) {
      continue;
    }
    for (const token of utxos[i].assets) {
      tokenIds.add(token.tokenId);
    }
  }
  return tokenIds;
}
function ensureUTxOBigInt(box) {
  return {
    ...box,
    value: ensureBigInt(box.value),
    assets: box.assets.map((token) => ({
      tokenId: token.tokenId,
      amount: ensureBigInt(token.amount)
    }))
  };
}

// src/utils/object.ts
function clearUndefined(value) {
  const result = {};
  for (const key in value) {
    const val = value[key];
    if (!isUndefined(val)) {
      result[key] = val;
    }
  }
  return result;
}
function ensureDefaults(options, defaults) {
  if (isEmpty(options))
    return defaults;
  const newObj = { ...defaults, ...options };
  for (const key in newObj) {
    newObj[key] = options[key] ?? defaults[key];
  }
  return newObj;
}

// src/utils/bytes.ts
function concatBytes(...arrays) {
  const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
  let pad = 0;
  for (const bytes of arrays) {
    assertInstanceOf(bytes, Uint8Array);
    r.set(bytes, pad);
    pad += bytes.length;
  }
  return r;
}
function isHex(value) {
  if (!value || value.length % 2)
    return false;
  if (!value.startsWith("0x")) {
    value = "0x" + value;
  }
  return !isNaN(Number(value));
}
function byteSizeOf(hex) {
  return hex.length / 2;
}

// src/types/common.ts
var Network = /* @__PURE__ */ ((Network2) => {
  Network2[Network2["Mainnet"] = 0] = "Mainnet";
  Network2[Network2["Testnet"] = 16] = "Testnet";
  return Network2;
})(Network || {});
var AddressType = /* @__PURE__ */ ((AddressType2) => {
  AddressType2[AddressType2["P2PK"] = 1] = "P2PK";
  AddressType2[AddressType2["P2SH"] = 2] = "P2SH";
  AddressType2[AddressType2["P2S"] = 3] = "P2S";
  return AddressType2;
})(AddressType || {});
var ergoTreeHeaderFlags = {
  sizeInclusion: 8,
  constantSegregation: 16
};

// src/models/collection.ts
var Collection = class {
  _items;
  constructor() {
    this._items = [];
  }
  _isIndexOutOfBounds(index) {
    return index < 0 || index >= this._items.length;
  }
  [Symbol.iterator]() {
    let counter = 0;
    return {
      next: () => {
        return {
          done: counter >= this.length,
          value: this._items[counter++]
        };
      }
    };
  }
  get length() {
    return this._items.length;
  }
  get isEmpty() {
    return this.length === 0;
  }
  at(index) {
    if (this._isIndexOutOfBounds(index)) {
      throw new RangeError(`Index '${index}' is out of range.`);
    }
    return this._items[index];
  }
  add(items, options) {
    return this._addOneOrMore(items, options);
  }
  _addOne(item, options) {
    if (isDefined(options) && isDefined(options.index)) {
      if (options.index === this.length) {
        this._items.push(this._map(item));
        return this.length;
      }
      if (this._isIndexOutOfBounds(options.index)) {
        throw new RangeError(`Index '${options.index}' is out of range.`);
      }
      this._items.splice(options.index, 0, this._map(item));
      return this.length;
    }
    this._items.push(this._map(item));
    return this._items.length;
  }
  _addOneOrMore(items, options) {
    if (Array.isArray(items)) {
      if (isDefined(options) && isDefined(options.index)) {
        items = items.reverse();
      }
      for (const item of items) {
        this._addOne(item, options);
      }
    } else {
      this._addOne(items, options);
    }
    return this.length;
  }
  toArray() {
    return [...this._items];
  }
  reduce(callbackFn, initialValue) {
    return this._items.reduce(callbackFn, initialValue);
  }
};

exports.AddressType = AddressType;
exports.Collection = Collection;
exports.Network = Network;
exports._0n = _0n;
exports._10n = _10n;
exports._127n = _127n;
exports._128n = _128n;
exports._1n = _1n;
exports._63n = _63n;
exports._7n = _7n;
exports.areEqual = areEqual;
exports.areEqualBy = areEqualBy;
exports.areRegistersDenselyPacked = areRegistersDenselyPacked;
exports.assert = assert;
exports.assertInstanceOf = assertInstanceOf;
exports.assertTypeOf = assertTypeOf;
exports.at = at;
exports.byteSizeOf = byteSizeOf;
exports.chunk = chunk;
exports.clearUndefined = clearUndefined;
exports.concatBytes = concatBytes;
exports.decimalize = decimalize;
exports.depthOf = depthOf;
exports.endsWith = endsWith;
exports.ensureBigInt = ensureBigInt;
exports.ensureDefaults = ensureDefaults;
exports.ensureUTxOBigInt = ensureUTxOBigInt;
exports.ergoTreeHeaderFlags = ergoTreeHeaderFlags;
exports.first = first;
exports.hasDuplicates = hasDuplicates;
exports.hasDuplicatesBy = hasDuplicatesBy;
exports.hasKey = hasKey;
exports.isDefined = isDefined;
exports.isEmpty = isEmpty;
exports.isFalsy = isFalsy;
exports.isHex = isHex;
exports.isTruthy = isTruthy;
exports.isUndefined = isUndefined;
exports.last = last;
exports.max = max;
exports.min = min;
exports.orderBy = orderBy;
exports.percent = percent;
exports.some = some;
exports.startsWith = startsWith;
exports.sumBy = sumBy;
exports.undecimalize = undecimalize;
exports.uniq = uniq;
exports.uniqBy = uniqBy;
exports.utxoDiff = utxoDiff;
exports.utxoFilter = utxoFilter;
exports.utxoSum = utxoSum;


},{}],2:[function(require,module,exports){
'use strict';

var common = require('@fleet-sdk/common');
var crypto = require('@fleet-sdk/crypto');
var serializer = require('@fleet-sdk/serializer');

// src/builder/selector/boxSelector.ts

// src/errors/duplicateInputSelectionError.ts
var DuplicateInputSelectionError = class extends Error {
  constructor() {
    super(`One or more inputs was selected more than one time by the current selection strategy.`);
  }
};
var InsufficientInputs = class extends Error {
  unreached;
  constructor(unreached) {
    const strings = [];
    if (unreached.nanoErgs) {
      strings.push(buildString("nanoErgs", unreached.nanoErgs));
    }
    if (common.some(unreached.tokens)) {
      for (const token of unreached.tokens) {
        strings.push(buildString(token.tokenId, token.amount));
      }
    }
    super(`Insufficient inputs:${strings.join()}`);
    this.unreached = unreached;
  }
};
function buildString(tokenId, amount) {
  return `
  > ${tokenId}: ${amount?.toString()}`;
}
var AccumulativeSelectionStrategy = class {
  _inputs;
  select(inputs, target) {
    this._inputs = inputs;
    let selection = [];
    if (common.some(target.tokens)) {
      selection = this._selectTokens(target.tokens);
    }
    const selectedNanoErgs = common.sumBy(selection, (input) => input.value);
    if (common.isUndefined(target.nanoErgs) && common.isEmpty(target.tokens) || common.isDefined(target.nanoErgs) && selectedNanoErgs < target.nanoErgs) {
      const targetAmount = common.isDefined(target.nanoErgs) ? target.nanoErgs - selectedNanoErgs : void 0;
      selection = selection.concat(this._select(targetAmount));
    }
    return selection;
  }
  _selectTokens(targets) {
    let selection = [];
    for (const target of targets) {
      const targetAmount = common.isDefined(target.amount) ? target.amount - common.utxoSum(selection, target.tokenId) : void 0;
      if (targetAmount && targetAmount <= common._0n) {
        continue;
      }
      selection = selection.concat(this._select(targetAmount, target.tokenId));
    }
    return selection;
  }
  _select(target, tokenId) {
    const inputs = this._inputs;
    let acc = common._0n;
    let selection = [];
    if (common.isUndefined(target)) {
      if (tokenId) {
        selection = inputs.filter((x) => x.assets.some((asset) => asset.tokenId === tokenId));
      } else {
        selection = inputs;
      }
    } else {
      for (let i = 0; i < inputs.length && acc < target; i++) {
        if (tokenId) {
          for (const token of inputs[i].assets) {
            if (token.tokenId !== tokenId) {
              continue;
            }
            acc += token.amount;
            selection.push(inputs[i]);
          }
        } else {
          acc += inputs[i].value;
          selection.push(inputs[i]);
        }
      }
    }
    if (common.some(selection)) {
      this._inputs = this._inputs.filter((input) => !selection.includes(input));
    }
    return selection;
  }
};

// src/builder/selector/strategies/customSelectionStrategy.ts
var CustomSelectionStrategy = class {
  _selector;
  constructor(selector) {
    this._selector = selector;
  }
  select(inputs, target) {
    return this._selector(inputs, target);
  }
};

// src/builder/selector/boxSelector.ts
var BoxSelector = class {
  _inputs;
  _strategy;
  _ensureFilterPredicate;
  _selector;
  _sortDirection;
  _ensureInclusionBoxIds;
  constructor(inputs) {
    this._inputs = inputs;
  }
  defineStrategy(strategy) {
    if (this._isISelectionStrategyImplementation(strategy)) {
      this._strategy = strategy;
    } else {
      this._strategy = new CustomSelectionStrategy(strategy);
    }
    return this;
  }
  select(target) {
    if (!this._strategy) {
      this._strategy = new AccumulativeSelectionStrategy();
    }
    const remaining = this._deepCloneTarget(target);
    let unselected = [...this._inputs];
    let selected = [];
    const predicate = this._ensureFilterPredicate;
    const inclusion = this._ensureInclusionBoxIds;
    if (predicate) {
      if (inclusion) {
        selected = unselected.filter((box) => predicate(box) || inclusion.has(box.boxId));
      } else {
        selected = unselected.filter(predicate);
      }
    } else if (inclusion) {
      selected = unselected.filter((box) => inclusion.has(box.boxId));
    }
    if (common.some(selected)) {
      unselected = unselected.filter((box) => !selected.some((sel) => sel.boxId === box.boxId));
      if (remaining.nanoErgs && remaining.nanoErgs > common._0n) {
        remaining.nanoErgs -= common.sumBy(selected, (input) => input.value);
      }
      if (common.some(remaining.tokens) && selected.some((input) => !common.isEmpty(input.assets))) {
        for (const t of remaining.tokens) {
          if (t.amount && t.amount > common._0n) {
            t.amount -= common.utxoSum(selected, t.tokenId);
          }
        }
      }
    }
    if (this._selector) {
      unselected = common.orderBy(unselected, this._selector, this._sortDirection || "asc");
    }
    selected = selected.concat(this._strategy.select(unselected, remaining));
    if (common.hasDuplicatesBy(selected, (item) => item.boxId)) {
      throw new DuplicateInputSelectionError();
    }
    const unreached = this._getUnreachedTargets(selected, target);
    if (unreached.nanoErgs || common.some(unreached.tokens)) {
      throw new InsufficientInputs(unreached);
    }
    return selected;
  }
  _deepCloneTarget(target) {
    return {
      nanoErgs: target.nanoErgs,
      tokens: target.tokens ? target.tokens.map((t) => ({ tokenId: t.tokenId, amount: t.amount })) : void 0
    };
  }
  _getUnreachedTargets(inputs, target) {
    const unreached = { nanoErgs: void 0, tokens: void 0 };
    const selectedNanoergs = common.sumBy(inputs, (input) => input.value);
    if (target.nanoErgs && target.nanoErgs > selectedNanoergs) {
      unreached.nanoErgs = target.nanoErgs - selectedNanoergs;
    }
    if (common.isEmpty(target.tokens)) {
      return unreached;
    }
    for (const tokenTarget of target.tokens) {
      const totalSelected = common.utxoSum(inputs, tokenTarget.tokenId);
      if (tokenTarget.amount && tokenTarget.amount > totalSelected) {
        if (tokenTarget.tokenId === common.first(inputs).boxId) {
          continue;
        }
        if (common.isUndefined(unreached.tokens)) {
          unreached.tokens = [];
        }
        unreached.tokens.push({
          tokenId: tokenTarget.tokenId,
          amount: tokenTarget.amount - totalSelected
        });
      }
    }
    return unreached;
  }
  ensureInclusion(predicateOrBoxIds) {
    if (typeof predicateOrBoxIds === "function") {
      this._ensureFilterPredicate = predicateOrBoxIds;
    } else if (predicateOrBoxIds === "all") {
      this._ensureFilterPredicate = (box) => box.value > 0n;
    } else {
      if (common.isUndefined(this._ensureInclusionBoxIds)) {
        this._ensureInclusionBoxIds = /* @__PURE__ */ new Set();
      }
      if (Array.isArray(predicateOrBoxIds)) {
        for (const boxId of predicateOrBoxIds) {
          this._ensureInclusionBoxIds.add(boxId);
        }
      } else {
        this._ensureInclusionBoxIds.add(predicateOrBoxIds);
      }
    }
    return this;
  }
  orderBy(selector, direction) {
    this._selector = selector;
    this._sortDirection = direction;
    return this;
  }
  _isISelectionStrategyImplementation(obj) {
    if (obj.select) {
      return true;
    }
    return false;
  }
  static buildTargetFrom(boxes) {
    const tokens = {};
    let nanoErgs = common._0n;
    for (const box of boxes) {
      nanoErgs += common.ensureBigInt(box.value);
      for (const token of box.assets) {
        tokens[token.tokenId] = (tokens[token.tokenId] || common._0n) + common.ensureBigInt(token.amount);
      }
    }
    return {
      nanoErgs,
      tokens: Object.keys(tokens).map((tokenId) => ({ tokenId, amount: tokens[tokenId] }))
    };
  }
};
var CherryPickSelectionStrategy = class extends AccumulativeSelectionStrategy {
  select(inputs, target) {
    const orderedInputs = common.orderBy(
      inputs,
      (x) => new Set(x.assets.map((asset) => asset.tokenId)).size,
      "asc"
    );
    return super.select(orderedInputs, target);
  }
};

// src/errors/invalidRegistersPacking.ts
var InvalidRegistersPacking = class extends Error {
  constructor() {
    super(
      `Registers should be densely packed. This means that it's not possible to use a register like 'R7' without filling 'R6', 'R5' and 'R4', for example.`
    );
  }
};

// src/errors/undefinedCreationHeight.ts
var UndefinedCreationHeight = class extends Error {
  constructor() {
    super(
      "Minting context is undefined. Transaction's inputs must be included in order to determine minting token id."
    );
  }
};

// src/errors/undefinedMintingContext.ts
var UndefinedMintingContext = class extends Error {
  constructor() {
    super("Creation Height is undefined.");
  }
};

// src/errors/invalidAddress.ts
var InvalidAddress = class extends Error {
  constructor(address) {
    super(`Invalid Ergo address: ${address}`);
  }
};

// src/models/ergoAddress.ts
var CHECKSUM_LENGTH = 4;
var BLAKE_256_HASH_LENGTH = 32;
var P2PK_ERGOTREE_PREFIX = crypto.hex.decode("0008cd");
var P2PK_ERGOTREE_LENGTH = 36;
var P2SH_ERGOTREE_SUFFIX = crypto.hex.decode("d40801");
var P2SH_ERGOTREE_PREFIX = crypto.hex.decode("00ea02d193b4cbe4e3010e040004300e18");
var P2SH_ERGOTREE_LENGTH = 44;
var P2SH_HASH_LENGTH = 24;
function _getEncodedNetworkType(addressBytes) {
  return common.first(addressBytes) & 240;
}
function _getEncodedAddressType(addressBytes) {
  return common.first(addressBytes) & 15;
}
function _ensureBytes(content) {
  if (typeof content === "string") {
    return crypto.hex.decode(content);
  }
  return content;
}
function _getErgoTreeType(ergoTree) {
  if (ergoTree.length === P2PK_ERGOTREE_LENGTH && common.startsWith(ergoTree, P2PK_ERGOTREE_PREFIX)) {
    return common.AddressType.P2PK;
  } else if (ergoTree.length === P2SH_ERGOTREE_LENGTH && common.startsWith(ergoTree, P2SH_ERGOTREE_PREFIX) && common.endsWith(ergoTree, P2SH_ERGOTREE_SUFFIX)) {
    return common.AddressType.P2SH;
  } else {
    return common.AddressType.P2S;
  }
}
function _validateCompressedEcPoint(pointBytes) {
  if (common.isEmpty(pointBytes) || pointBytes.length !== 33) {
    return false;
  }
  return pointBytes[0] === 2 || pointBytes[0] === 3;
}
var ErgoAddress = class _ErgoAddress {
  _ergoTree;
  _network;
  _type;
  get network() {
    return this._network;
  }
  /**
   * ErgoTree hex string
   */
  get ergoTree() {
    return crypto.hex.encode(this._ergoTree);
  }
  get type() {
    return this._type;
  }
  /**
   * New instance from ErgoTree bytes
   * @param ergoTree ErgoTree bytes
   */
  constructor(ergoTree, network) {
    this._ergoTree = ergoTree;
    this._network = network;
    this._type = _getErgoTreeType(ergoTree);
  }
  /**
   * Create a new instance from an ErgoTree
   * @param ergoTree ErgoTree hex string
   */
  static fromErgoTree(ergoTree, network) {
    return new _ErgoAddress(crypto.hex.decode(ergoTree), network);
  }
  /**
   * Create a new instance from a public key
   * @param publicKey Public key hex string
   */
  static fromPublicKey(publicKey, network) {
    const bytes = _ensureBytes(publicKey);
    if (!_validateCompressedEcPoint(bytes)) {
      throw new Error("The Public Key is invalid.");
    }
    const ergoTree = common.concatBytes(P2PK_ERGOTREE_PREFIX, bytes);
    return new _ErgoAddress(ergoTree, network);
  }
  static fromHash(hash, network) {
    hash = _ensureBytes(hash);
    if (hash.length === BLAKE_256_HASH_LENGTH) {
      hash = hash.subarray(0, P2SH_HASH_LENGTH);
    } else if (hash.length != P2SH_HASH_LENGTH) {
      throw Error(`Invalid hash length: ${hash.length}`);
    }
    const ergoTree = common.concatBytes(P2SH_ERGOTREE_PREFIX, hash, P2SH_ERGOTREE_SUFFIX);
    return new _ErgoAddress(ergoTree, network);
  }
  /**
   * Create a new checked instance from an address string
   * @param encodedAddress Address encoded as base58
   */
  static fromBase58(encodedAddress, skipCheck = false) {
    const bytes = crypto.base58.decode(encodedAddress);
    if (!skipCheck && !_ErgoAddress.validate(bytes)) {
      throw new InvalidAddress(encodedAddress);
    }
    const network = _getEncodedNetworkType(bytes);
    const type = _getEncodedAddressType(bytes);
    const body = bytes.subarray(1, bytes.length - CHECKSUM_LENGTH);
    if (type === common.AddressType.P2PK) {
      return this.fromPublicKey(body, network);
    } else if (type === common.AddressType.P2SH) {
      return this.fromHash(body, network);
    } else {
      return new _ErgoAddress(body, network);
    }
  }
  /**
   * Validate an address
   * @param address Address bytes or string
   */
  static validate(address) {
    const bytes = typeof address === "string" ? crypto.base58.decode(address) : address;
    if (bytes.length < CHECKSUM_LENGTH) {
      return false;
    }
    if (_getEncodedAddressType(bytes) === common.AddressType.P2PK) {
      const pk = bytes.subarray(1, bytes.length - CHECKSUM_LENGTH);
      if (!_validateCompressedEcPoint(pk)) {
        return false;
      }
    }
    const script = bytes.subarray(0, bytes.length - CHECKSUM_LENGTH);
    const checksum = bytes.subarray(bytes.length - CHECKSUM_LENGTH, bytes.length);
    const blakeHash = crypto.blake2b256(script);
    const calculatedChecksum = blakeHash.subarray(0, CHECKSUM_LENGTH);
    return common.areEqual(calculatedChecksum, checksum);
  }
  static getNetworkType(address) {
    return _getEncodedNetworkType(crypto.base58.decode(address));
  }
  static getAddressType(address) {
    return _getEncodedAddressType(crypto.base58.decode(address));
  }
  getPublicKeys() {
    if (this.type === common.AddressType.P2PK) {
      return [this._ergoTree.subarray(P2PK_ERGOTREE_PREFIX.length)];
    }
    return [];
  }
  toP2SH(network) {
    if (this.type === common.AddressType.P2SH) {
      return this.encode();
    }
    const hash = crypto.blake2b256(this._ergoTree).subarray(0, P2SH_HASH_LENGTH);
    return this._encode(hash, common.AddressType.P2SH, network);
  }
  /**
   * Encode address as base58 string
   */
  encode(network) {
    let body;
    if (this.type === common.AddressType.P2PK) {
      body = common.first(this.getPublicKeys());
    } else if (this.type === common.AddressType.P2SH) {
      body = this._ergoTree.subarray(
        P2SH_ERGOTREE_PREFIX.length,
        P2SH_ERGOTREE_PREFIX.length + P2SH_HASH_LENGTH
      );
    } else {
      body = this._ergoTree;
    }
    return this._encode(body, this.type, network);
  }
  _encode(body, type, network) {
    if (!common.isDefined(network)) {
      if (common.isDefined(this.network)) {
        network = this.network;
      } else {
        network = common.Network.Mainnet;
      }
    }
    const head = Uint8Array.from([network + type]);
    body = common.concatBytes(head, body);
    const checksum = crypto.blake2b256(body).subarray(0, CHECKSUM_LENGTH);
    return crypto.base58.encode(common.concatBytes(body, checksum));
  }
  /**
   * Encode address as base58 string
   */
  toString(network) {
    return this.encode(network);
  }
};
var ErgoBox = class _ErgoBox {
  boxId;
  value;
  ergoTree;
  creationHeight;
  assets;
  additionalRegisters;
  transactionId;
  index;
  constructor(box) {
    this.boxId = box.boxId;
    this.ergoTree = box.ergoTree;
    this.creationHeight = box.creationHeight;
    this.value = common.ensureBigInt(box.value);
    this.assets = box.assets.map((asset) => ({
      tokenId: asset.tokenId,
      amount: common.ensureBigInt(asset.amount)
    }));
    this.additionalRegisters = box.additionalRegisters;
    this.transactionId = box.transactionId;
    this.index = box.index;
  }
  isValid() {
    return _ErgoBox.validate(this);
  }
  static validate(box) {
    const bytes = serializer.serializeBox(box).toBytes();
    const hash = crypto.hex.encode(crypto.blake2b256(bytes));
    return box.boxId === hash;
  }
};

// src/models/ergoUnsignedInput.ts
var ErgoUnsignedInput = class extends ErgoBox {
  _extension;
  get extension() {
    return this._extension;
  }
  constructor(box) {
    super(box);
    if (box.extension) {
      this.setContextVars(box.extension);
    }
  }
  setContextVars(extension) {
    this._extension = extension;
    return this;
  }
  toUnsignedInputObject(type) {
    return {
      ...this.toPlainObject(type),
      extension: this._extension || {}
    };
  }
  toPlainObject(type) {
    if (type === "EIP-12") {
      return {
        boxId: this.boxId,
        value: this.value.toString(),
        ergoTree: this.ergoTree,
        creationHeight: this.creationHeight,
        assets: this.assets.map((asset) => ({
          tokenId: asset.tokenId,
          amount: asset.amount.toString()
        })),
        additionalRegisters: this.additionalRegisters,
        transactionId: this.transactionId,
        index: this.index
      };
    } else {
      return {
        boxId: this.boxId
      };
    }
  }
};
var ErgoUnsignedTransaction = class {
  _inputs;
  _dataInputs;
  _outputs;
  constructor(inputs, dataInputs, outputs) {
    this._inputs = Object.freeze(inputs);
    this._dataInputs = Object.freeze(dataInputs);
    this._outputs = Object.freeze(outputs);
  }
  get id() {
    return crypto.hex.encode(crypto.blake2b256(this.toBytes()));
  }
  get inputs() {
    return this._inputs;
  }
  get dataInputs() {
    return this._dataInputs;
  }
  get outputs() {
    return this._outputs;
  }
  get burning() {
    return common.utxoDiff(common.utxoSum(this.inputs), common.utxoSum(this.outputs));
  }
  toPlainObject(outputType) {
    return {
      inputs: this.inputs.map((input) => input.toUnsignedInputObject(outputType || "default")),
      dataInputs: this.dataInputs.map((input) => input.toPlainObject(outputType || "default")),
      outputs: this.outputs.map((output) => _stringifyBoxAmounts(output))
    };
  }
  toEIP12Object() {
    return this.toPlainObject("EIP-12");
  }
  toBytes() {
    return serializer.serializeTransaction({
      inputs: this.inputs.map((input) => input.toUnsignedInputObject("default")),
      dataInputs: this.dataInputs.map((input) => input.toPlainObject("default")),
      outputs: this.outputs
    }).toBytes();
  }
};
function _stringifyBoxAmounts(output) {
  return {
    ...output,
    value: output.value.toString(),
    assets: output.assets.map((token) => ({
      tokenId: token.tokenId,
      amount: token.amount.toString()
    }))
  };
}

// src/errors/duplicateInputError.ts
var DuplicateInputError = class extends Error {
  constructor(boxId) {
    super(`Box '${boxId}' is already included.`);
  }
};

// src/errors/insufficientTokenAmount.ts
var InsufficientTokenAmount = class extends Error {
  constructor(message) {
    super(message);
  }
};

// src/errors/invalidInput.ts
var InvalidInput = class extends Error {
  constructor(boxId) {
    super(`Invalid input: ${boxId}`);
  }
};

// src/errors/malformedTransaction.ts
var MalformedTransaction = class extends Error {
  constructor(message) {
    super(`Malformed transaction: ${message}`);
  }
};

// src/errors/maxTokensOverflow.ts
var MaxTokensOverflow = class extends Error {
  constructor() {
    super(`A box must contain no more than ${MAX_TOKENS_PER_BOX} distinct tokens.`);
  }
};

// src/errors/notAllowedTokenBurning.ts
var NotAllowedTokenBurning = class extends Error {
  constructor() {
    super(
      "This transaction is trying to burn tokens. If that's your intention you must explicitly allow token burning on TransactionBuilder.configure() method. If no, a change address should be provided."
    );
  }
};

// src/errors/notFoundError.ts
var NotFoundError = class extends Error {
  constructor(message) {
    super(message);
  }
};

// src/models/collections/tokensCollection.ts
var MAX_TOKENS_PER_BOX = 120;
var TokensCollection = class extends common.Collection {
  constructor(tokens, options) {
    super();
    if (common.isDefined(tokens)) {
      this.add(tokens, options);
    }
  }
  _map(token) {
    return { tokenId: token.tokenId, amount: common.ensureBigInt(token.amount) };
  }
  _addOne(token, options) {
    if (common.isUndefined(options) || options.sum && !common.isDefined(options.index)) {
      if (this._sum(this._map(token))) {
        return this.length;
      }
    }
    if (this._items.length >= MAX_TOKENS_PER_BOX) {
      throw new MaxTokensOverflow();
    }
    super._addOne(token, options);
    return this.length;
  }
  add(items, options) {
    return super.add(items, options);
  }
  _sum(token) {
    for (const t of this._items) {
      if (t.tokenId === token.tokenId) {
        t.amount += token.amount;
        return true;
      }
    }
    return false;
  }
  remove(tokenIdOrIndex, amount) {
    let index = -1;
    if (typeof tokenIdOrIndex === "number") {
      if (this._isIndexOutOfBounds(tokenIdOrIndex)) {
        throw new RangeError(`Index '${tokenIdOrIndex}' is out of range.`);
      }
      index = tokenIdOrIndex;
    } else {
      index = this._items.findIndex((token) => token.tokenId === tokenIdOrIndex);
      if (this._isIndexOutOfBounds(index)) {
        throw new NotFoundError(`TokenId '${tokenIdOrIndex}' not found in assets collection.`);
      }
    }
    if (amount && index > -1) {
      const bigAmount = common.ensureBigInt(amount);
      const token = this._items[index];
      if (bigAmount > token.amount) {
        throw new InsufficientTokenAmount(
          `Insufficient token amount to perform a subtraction operation.`
        );
      } else if (bigAmount < token.amount) {
        token.amount -= bigAmount;
        return this.length;
      }
    }
    this._items.splice(index, 1);
    return this.length;
  }
  contains(tokenId) {
    return this._items.some((x) => x.tokenId === tokenId);
  }
};
var InputsCollection = class extends common.Collection {
  constructor(boxes) {
    super();
    if (common.isDefined(boxes)) {
      this.add(boxes);
    }
  }
  _map(input) {
    return input instanceof ErgoUnsignedInput ? input : new ErgoUnsignedInput(input);
  }
  _addOne(box) {
    if (this._items.some((item) => item.boxId === box.boxId)) {
      throw new DuplicateInputError(box.boxId);
    }
    return super._addOne(box);
  }
  remove(boxIdOrIndex) {
    let index = -1;
    if (typeof boxIdOrIndex === "number") {
      if (this._isIndexOutOfBounds(boxIdOrIndex)) {
        throw new RangeError(`Index '${boxIdOrIndex}' is out of range.`);
      }
      index = boxIdOrIndex;
    } else {
      index = this._items.findIndex((box) => box.boxId === boxIdOrIndex);
      if (this._isIndexOutOfBounds(index)) {
        throw new NotFoundError(
          "The input you are trying to remove is not present in the inputs collection."
        );
      }
    }
    this._items.splice(index, 1);
    return this.length;
  }
};
var OutputsCollection = class _OutputsCollection extends common.Collection {
  constructor(outputs) {
    super();
    if (common.isDefined(outputs)) {
      this.add(outputs);
    }
  }
  _map(output) {
    return output;
  }
  remove(outputs) {
    let index = -1;
    if (typeof outputs === "number") {
      if (this._isIndexOutOfBounds(outputs)) {
        throw new RangeError(`Index '${outputs}' is out of range.`);
      }
      index = outputs;
    } else {
      index = this._items.lastIndexOf(outputs);
      if (this._isIndexOutOfBounds(index)) {
        throw new NotFoundError(
          "The output you are trying to remove is not present in the outputs collection."
        );
      }
    }
    this._items.splice(index, 1);
    return this.length;
  }
  clone() {
    return new _OutputsCollection(this._items);
  }
  sum(basis) {
    const tokens = {};
    let nanoErgs = common._0n;
    if (basis) {
      if (basis.nanoErgs) {
        nanoErgs = basis.nanoErgs;
      }
      if (common.some(basis.tokens)) {
        for (const token of basis.tokens) {
          if (common.isUndefined(token.amount)) {
            continue;
          }
          tokens[token.tokenId] = (tokens[token.tokenId] || common._0n) + token.amount;
        }
      }
    }
    for (const box of this._items) {
      nanoErgs += box.value;
      for (const token of box.assets) {
        tokens[token.tokenId] = (tokens[token.tokenId] || common._0n) + token.amount;
      }
    }
    return {
      nanoErgs,
      tokens: Object.keys(tokens).map((tokenId) => ({ tokenId, amount: tokens[tokenId] }))
    };
  }
};
var VERSION_MASK = 7;
var ErgoTree = class {
  _bytes;
  constructor(input) {
    if (typeof input === "string") {
      this._bytes = crypto.hex.decode(input);
    } else {
      this._bytes = input;
    }
  }
  get header() {
    return this._bytes[0];
  }
  get version() {
    return this.header & VERSION_MASK;
  }
  get hasSegregatedConstants() {
    return (this.header & common.ergoTreeHeaderFlags.constantSegregation) != 0;
  }
  get hasSize() {
    return (this.header & common.ergoTreeHeaderFlags.sizeInclusion) != 0;
  }
  toBytes() {
    return this._bytes;
  }
  toHex() {
    return crypto.hex.encode(this.toBytes());
  }
  toAddress(network = common.Network.Mainnet) {
    return ErgoAddress.fromErgoTree(this.toHex(), network);
  }
};

// src/builder/outputBuilder.ts
var BOX_VALUE_PER_BYTE = BigInt(360);
var SAFE_MIN_BOX_VALUE = BigInt(1e6);
function estimateMinBoxValue(valuePerByte = BOX_VALUE_PER_BYTE) {
  return (output) => {
    return BigInt(output.estimateSize()) * valuePerByte;
  };
}
var OutputBuilder = class {
  _address;
  _tokens;
  _value;
  _valueEstimator;
  _creationHeight;
  _registers;
  _minting;
  constructor(value, recipient, creationHeight) {
    this.setValue(value);
    this._creationHeight = creationHeight;
    this._tokens = new TokensCollection();
    this._registers = {};
    if (typeof recipient === "string") {
      this._address = common.isHex(recipient) ? ErgoAddress.fromErgoTree(recipient) : ErgoAddress.fromBase58(recipient);
    } else if (recipient instanceof ErgoTree) {
      this._address = recipient.toAddress();
    } else {
      this._address = recipient;
    }
  }
  get value() {
    return common.isDefined(this._valueEstimator) ? this._valueEstimator(this) : this._value;
  }
  get address() {
    return this._address;
  }
  get ergoTree() {
    return this._address.ergoTree;
  }
  get creationHeight() {
    return this._creationHeight;
  }
  get assets() {
    return this._tokens;
  }
  get additionalRegisters() {
    return this._registers;
  }
  get minting() {
    return this._minting;
  }
  setValue(value) {
    if (typeof value === "function") {
      this._valueEstimator = value;
    } else {
      this._value = common.ensureBigInt(value);
      this._valueEstimator = void 0;
      if (this._value <= common._0n) {
        throw new Error("An UTxO cannot be created without a minimum required amount.");
      }
    }
    return this;
  }
  addTokens(tokens, options) {
    if (tokens instanceof TokensCollection) {
      this._tokens.add(tokens.toArray(), options);
    } else {
      this._tokens.add(tokens, options);
    }
    return this;
  }
  addNfts(...tokenIds) {
    const tokens = tokenIds.map((tokenId) => ({ tokenId, amount: common._1n }));
    return this.addTokens(tokens);
  }
  mintToken(token) {
    this._minting = { ...token, amount: common.ensureBigInt(token.amount) };
    return this;
  }
  setCreationHeight(height, options) {
    if (common.isUndefined(options) || options.replace === true || options.replace === false && common.isUndefined(this._creationHeight)) {
      this._creationHeight = height;
    }
    return this;
  }
  setAdditionalRegisters(registers) {
    this._registers = common.clearUndefined(registers);
    if (!common.areRegistersDenselyPacked(registers)) {
      throw new InvalidRegistersPacking();
    }
    return this;
  }
  eject(ejector) {
    ejector({ tokens: this._tokens });
    return this;
  }
  build(transactionInputs) {
    let tokens = this.assets.toArray();
    if (this.minting) {
      if (common.isEmpty(transactionInputs)) {
        throw new UndefinedMintingContext();
      }
      if (common.isEmpty(this.additionalRegisters)) {
        this.setAdditionalRegisters({
          R4: serializer.SColl(serializer.SByte, crypto.utf8.decode(this.minting.name || "")).toHex(),
          R5: serializer.SColl(serializer.SByte, crypto.utf8.decode(this.minting.description || "")).toHex(),
          R6: serializer.SColl(serializer.SByte, crypto.utf8.decode(this.minting.decimals?.toString() || "0")).toHex()
        });
      }
      tokens = [
        {
          tokenId: common.first(transactionInputs).boxId,
          amount: this.minting.amount
        },
        ...tokens
      ];
    }
    if (common.isUndefined(this.creationHeight)) {
      throw new UndefinedCreationHeight();
    }
    return {
      value: this.value,
      ergoTree: this.ergoTree,
      creationHeight: this.creationHeight,
      assets: tokens.map((token) => ({
        tokenId: token.tokenId,
        amount: token.amount
      })),
      additionalRegisters: this.additionalRegisters
    };
  }
  estimateSize(value = SAFE_MIN_BOX_VALUE) {
    common.assert(!!this.creationHeight, "Creation height must be set");
    const tokens = this._tokens.toArray();
    if (this.minting) {
      tokens.push({
        tokenId: "0000000000000000000000000000000000000000000000000000000000000000",
        amount: this.minting.amount
      });
    }
    const plainBoxObject = {
      value,
      ergoTree: this.ergoTree,
      creationHeight: this.creationHeight,
      assets: tokens.map((token) => ({
        tokenId: token.tokenId,
        amount: token.amount
      })),
      additionalRegisters: this.additionalRegisters
    };
    return serializer.estimateBoxSize(plainBoxObject);
  }
};

// src/errors/nonStandardizedMinting.ts
var NonStandardizedMinting = class extends Error {
  constructor(message) {
    super(message);
  }
};

// src/builder/pluginContext.ts
function createPluginContext(transactionBuilder) {
  return {
    addInputs: (inputs) => transactionBuilder.from(inputs).configureSelector(
      (selector) => selector.ensureInclusion(
        Array.isArray(inputs) ? inputs.map((input) => input.boxId) : inputs.boxId
      )
    ).inputs.length,
    addOutputs: (outputs, options) => transactionBuilder.to(outputs, options).outputs.length,
    addDataInputs: (dataInputs, options) => transactionBuilder.withDataFrom(dataInputs, options).dataInputs.length,
    burnTokens: (tokens) => {
      if (!transactionBuilder.settings.canBurnTokensFromPlugins) {
        throw new NotAllowedTokenBurning();
      }
      transactionBuilder.burnTokens(tokens);
    },
    setFee: (amount) => transactionBuilder.payFee(amount)
  };
}

// src/builder/transactionBuilderSettings.ts
var TransactionBuilderSettings = class {
  _maxDistinctTokensPerChangeBox;
  _allowTokenBurning;
  _allowTokenBurningFromPlugins;
  _isolateErgOnChange;
  constructor() {
    this._maxDistinctTokensPerChangeBox = MAX_TOKENS_PER_BOX;
    this._allowTokenBurning = false;
    this._allowTokenBurningFromPlugins = false;
    this._isolateErgOnChange = false;
  }
  get maxTokensPerChangeBox() {
    return this._maxDistinctTokensPerChangeBox;
  }
  get canBurnTokens() {
    return this._allowTokenBurning;
  }
  get canBurnTokensFromPlugins() {
    return this.canBurnTokens || this._allowTokenBurningFromPlugins;
  }
  get shouldIsolateErgOnChange() {
    return this._isolateErgOnChange;
  }
  /**
   * Define max number of distinct tokens per change box
   */
  setMaxTokensPerChangeBox(max) {
    this._maxDistinctTokensPerChangeBox = max;
    return this;
  }
  /**
   * Allows or denies token burning from all contexts
   */
  allowTokenBurning(allow = true) {
    this._allowTokenBurning = allow;
    return this;
  }
  /**
   * Allows or denies token burning **only** from plugins context.
   */
  allowTokenBurningFromPlugins(allow = true) {
    this._allowTokenBurningFromPlugins = allow;
    return this;
  }
  /**
   * If true, it creates an exclusive change box only for ERG.
   * This setting is especially useful for Ledger devices to
   * help on avoiding to hit the max tokens limit per transaction.
   */
  isolateErgOnChange(isolate = true) {
    this._isolateErgOnChange = isolate;
    return this;
  }
};

// src/builder/transactionBuilder.ts
var RECOMMENDED_MIN_FEE_VALUE = BigInt(11e5);
var FEE_CONTRACT = "1005040004000e36100204a00b08cd0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798ea02d192a39a8cc7a701730073011001020402d19683030193a38cc7b2a57300000193c2b2a57301007473027303830108cdeeac93b1a57304";
var TransactionBuilder2 = class {
  _inputs;
  _dataInputs;
  _outputs;
  _settings;
  _creationHeight;
  _selectorCallbacks;
  _changeAddress;
  _feeAmount;
  _burning;
  _plugins;
  constructor(creationHeight) {
    this._inputs = new InputsCollection();
    this._dataInputs = new InputsCollection();
    this._outputs = new OutputsCollection();
    this._settings = new TransactionBuilderSettings();
    this._creationHeight = creationHeight;
  }
  get inputs() {
    return this._inputs;
  }
  get dataInputs() {
    return this._dataInputs;
  }
  get outputs() {
    return this._outputs;
  }
  get changeAddress() {
    return this._changeAddress;
  }
  get fee() {
    return this._feeAmount;
  }
  get burning() {
    return this._burning;
  }
  get settings() {
    return this._settings;
  }
  get creationHeight() {
    return this._creationHeight;
  }
  /**
   * Syntax sugar to be used in composition with another methods
   *
   * @example
   * ```
   * new TransactionBuilder(height)
   *   .from(inputs)
   *   .and.from(otherInputs);
   * ```
   */
  get and() {
    return this;
  }
  from(inputs) {
    if (isCollectionLike(inputs)) {
      inputs = inputs.toArray();
    }
    this._inputs.add(inputs);
    return this;
  }
  to(outputs, options) {
    this._outputs.add(outputs, options);
    return this;
  }
  withDataFrom(dataInputs, options) {
    this._dataInputs.add(dataInputs, options);
    return this;
  }
  sendChangeTo(address) {
    if (typeof address === "string") {
      this._changeAddress = common.isHex(address) ? ErgoAddress.fromErgoTree(address, common.Network.Mainnet) : ErgoAddress.fromBase58(address);
    } else {
      this._changeAddress = address;
    }
    return this;
  }
  payFee(amount) {
    this._feeAmount = common.ensureBigInt(amount);
    return this;
  }
  payMinFee() {
    this.payFee(RECOMMENDED_MIN_FEE_VALUE);
    return this;
  }
  burnTokens(tokens) {
    if (!this._burning) {
      this._burning = new TokensCollection();
    }
    this._burning.add(tokens);
    return this;
  }
  configure(callback) {
    callback(this._settings);
    return this;
  }
  configureSelector(selectorCallback) {
    if (common.isUndefined(this._selectorCallbacks)) {
      this._selectorCallbacks = [];
    }
    this._selectorCallbacks.push(selectorCallback);
    return this;
  }
  extend(plugins) {
    if (!this._plugins) {
      this._plugins = [];
    }
    this._plugins.push({ execute: plugins, pending: true });
    return this;
  }
  eject(ejector) {
    ejector({
      inputs: this.inputs,
      dataInputs: this.dataInputs,
      outputs: this.outputs,
      burning: this.burning,
      settings: this.settings,
      selection: (selectorCallback) => {
        this.configureSelector(selectorCallback);
      }
    });
    return this;
  }
  build() {
    if (common.some(this._plugins)) {
      const context = createPluginContext(this);
      for (const plugin of this._plugins) {
        if (plugin.pending) {
          plugin.execute(context);
          plugin.pending = false;
        }
      }
    }
    if (this._isMinting()) {
      if (this._isMoreThanOneTokenBeingMinted()) {
        throw new MalformedTransaction("only one token can be minted per transaction.");
      }
      if (this._isTheSameTokenBeingMintedOutsideTheMintingBox()) {
        throw new NonStandardizedMinting(
          "EIP-4 tokens cannot be minted from outside of the minting box."
        );
      }
    }
    this.outputs.toArray().map((output) => output.setCreationHeight(this._creationHeight, { replace: false }));
    const outputs = this.outputs.clone();
    if (common.isDefined(this._feeAmount)) {
      outputs.add(new OutputBuilder(this._feeAmount, FEE_CONTRACT));
    }
    const selector = new BoxSelector(this.inputs.toArray());
    if (common.some(this._selectorCallbacks)) {
      for (const selectorCallBack of this._selectorCallbacks) {
        selectorCallBack(selector);
      }
    }
    const target = common.some(this._burning) ? outputs.sum({ tokens: this._burning.toArray() }) : outputs.sum();
    let inputs = selector.select(target);
    if (common.isDefined(this._changeAddress)) {
      let change = common.utxoDiff(common.utxoSum(inputs), target);
      const changeBoxes = [];
      if (common.some(change.tokens)) {
        let minRequiredNanoErgs = estimateMinChangeValue({
          changeAddress: this._changeAddress,
          creationHeight: this._creationHeight,
          tokens: change.tokens,
          maxTokensPerBox: this.settings.maxTokensPerChangeBox,
          baseIndex: this.outputs.length + 1
        });
        while (minRequiredNanoErgs > change.nanoErgs) {
          inputs = selector.select({
            nanoErgs: target.nanoErgs + minRequiredNanoErgs,
            tokens: target.tokens
          });
          change = common.utxoDiff(common.utxoSum(inputs), target);
          minRequiredNanoErgs = estimateMinChangeValue({
            changeAddress: this._changeAddress,
            creationHeight: this._creationHeight,
            tokens: change.tokens,
            maxTokensPerBox: this.settings.maxTokensPerChangeBox,
            baseIndex: this.outputs.length + 1
          });
        }
        const chunkedTokens = common.chunk(change.tokens, this._settings.maxTokensPerChangeBox);
        for (const tokens of chunkedTokens) {
          const output = new OutputBuilder(
            estimateMinBoxValue(),
            this._changeAddress,
            this._creationHeight
          ).addTokens(tokens);
          change.nanoErgs -= output.value;
          changeBoxes.push(output);
        }
      }
      if (change.nanoErgs > common._0n) {
        if (common.some(changeBoxes)) {
          if (this.settings.shouldIsolateErgOnChange) {
            outputs.add(new OutputBuilder(change.nanoErgs, this._changeAddress));
          } else {
            const firstChangeBox = common.first(changeBoxes);
            firstChangeBox.setValue(firstChangeBox.value + change.nanoErgs);
          }
          outputs.add(changeBoxes);
        } else {
          outputs.add(new OutputBuilder(change.nanoErgs, this._changeAddress));
        }
      }
    }
    for (const input of inputs) {
      if (!input.isValid()) {
        throw new InvalidInput(input.boxId);
      }
    }
    const unsignedTransaction = new ErgoUnsignedTransaction(
      inputs,
      this.dataInputs.toArray(),
      outputs.toArray().map(
        (output) => output.setCreationHeight(this._creationHeight, { replace: false }).build(inputs)
      )
    );
    let burning = unsignedTransaction.burning;
    if (burning.nanoErgs > common._0n) {
      throw new MalformedTransaction("it's not possible to burn ERG.");
    }
    if (common.some(burning.tokens) && common.some(this._burning)) {
      burning = common.utxoDiff(burning, { nanoErgs: common._0n, tokens: this._burning.toArray() });
    }
    if (!this._settings.canBurnTokens && common.some(burning.tokens)) {
      throw new NotAllowedTokenBurning();
    }
    return unsignedTransaction;
  }
  _isMinting() {
    for (const output of this._outputs) {
      if (output.minting) {
        return true;
      }
    }
    return false;
  }
  _isMoreThanOneTokenBeingMinted() {
    let mintingCount = 0;
    for (const output of this._outputs) {
      if (common.isDefined(output.minting)) {
        mintingCount++;
        if (mintingCount > 1) {
          return true;
        }
      }
    }
    return false;
  }
  _isTheSameTokenBeingMintedOutsideTheMintingBox() {
    const mintingTokenId = this._getMintingTokenId();
    if (common.isUndefined(mintingTokenId)) {
      return false;
    }
    for (const output of this._outputs) {
      if (output.assets.contains(mintingTokenId)) {
        return true;
      }
    }
    return false;
  }
  _getMintingTokenId() {
    let tokenId = void 0;
    for (const output of this._outputs) {
      if (output.minting) {
        tokenId = output.minting.tokenId;
        break;
      }
    }
    return tokenId;
  }
};
function isCollectionLike(obj) {
  return obj.toArray !== void 0;
}
function estimateMinChangeValue(params) {
  const size = BigInt(estimateChangeSize(params));
  return size * BOX_VALUE_PER_BYTE;
}
function estimateChangeSize({
  changeAddress,
  creationHeight,
  tokens,
  baseIndex,
  maxTokensPerBox
}) {
  const neededBoxes = Math.ceil(tokens.length / maxTokensPerBox);
  let size = 0;
  size += serializer.estimateVLQSize(SAFE_MIN_BOX_VALUE);
  size += common.byteSizeOf(changeAddress.ergoTree);
  size += serializer.estimateVLQSize(creationHeight);
  size += serializer.estimateVLQSize(0);
  size += 32;
  size = size * neededBoxes;
  for (let i = 0; i < neededBoxes; i++) {
    size += serializer.estimateVLQSize(baseIndex + i);
  }
  size += tokens.reduce(
    (acc, curr) => acc += common.byteSizeOf(curr.tokenId) + serializer.estimateVLQSize(curr.amount),
    0
  );
  if (tokens.length > maxTokensPerBox) {
    if (tokens.length % maxTokensPerBox > 0) {
      size += serializer.estimateVLQSize(maxTokensPerBox) * Math.floor(tokens.length / maxTokensPerBox);
      size += serializer.estimateVLQSize(tokens.length % maxTokensPerBox);
    } else {
      size += serializer.estimateVLQSize(maxTokensPerBox) * neededBoxes;
    }
  } else {
    size += serializer.estimateVLQSize(tokens.length);
  }
  return size;
}
function SConstant(constant) {
  return constant.toHex();
}
function SParse(bytes) {
  return serializer.SConstant.from(bytes).data;
}

Object.defineProperty(exports, 'AddressType', {
  enumerable: true,
  get: function () { return common.AddressType; }
});
Object.defineProperty(exports, 'Network', {
  enumerable: true,
  get: function () { return common.Network; }
});
Object.defineProperty(exports, 'SBigInt', {
  enumerable: true,
  get: function () { return serializer.SBigInt; }
});
Object.defineProperty(exports, 'SBool', {
  enumerable: true,
  get: function () { return serializer.SBool; }
});
Object.defineProperty(exports, 'SByte', {
  enumerable: true,
  get: function () { return serializer.SByte; }
});
Object.defineProperty(exports, 'SColl', {
  enumerable: true,
  get: function () { return serializer.SColl; }
});
Object.defineProperty(exports, 'SCollType', {
  enumerable: true,
  get: function () { return serializer.SCollType; }
});
Object.defineProperty(exports, 'SGroupElement', {
  enumerable: true,
  get: function () { return serializer.SGroupElement; }
});
Object.defineProperty(exports, 'SInt', {
  enumerable: true,
  get: function () { return serializer.SInt; }
});
Object.defineProperty(exports, 'SLong', {
  enumerable: true,
  get: function () { return serializer.SLong; }
});
Object.defineProperty(exports, 'SShort', {
  enumerable: true,
  get: function () { return serializer.SShort; }
});
Object.defineProperty(exports, 'SSigmaProp', {
  enumerable: true,
  get: function () { return serializer.SSigmaProp; }
});
Object.defineProperty(exports, 'SType', {
  enumerable: true,
  get: function () { return serializer.SType; }
});
Object.defineProperty(exports, 'SUnit', {
  enumerable: true,
  get: function () { return serializer.SUnit; }
});
exports.AccumulativeSelectionStrategy = AccumulativeSelectionStrategy;
exports.BOX_VALUE_PER_BYTE = BOX_VALUE_PER_BYTE;
exports.BoxSelector = BoxSelector;
exports.CherryPickSelectionStrategy = CherryPickSelectionStrategy;
exports.CustomSelectionStrategy = CustomSelectionStrategy;
exports.DuplicateInputError = DuplicateInputError;
exports.DuplicateInputSelectionError = DuplicateInputSelectionError;
exports.ErgoAddress = ErgoAddress;
exports.ErgoBox = ErgoBox;
exports.ErgoTree = ErgoTree;
exports.ErgoUnsignedInput = ErgoUnsignedInput;
exports.ErgoUnsignedTransaction = ErgoUnsignedTransaction;
exports.FEE_CONTRACT = FEE_CONTRACT;
exports.InputsCollection = InputsCollection;
exports.InsufficientInputs = InsufficientInputs;
exports.InsufficientTokenAmount = InsufficientTokenAmount;
exports.InvalidAddress = InvalidAddress;
exports.InvalidInput = InvalidInput;
exports.InvalidRegistersPacking = InvalidRegistersPacking;
exports.MAX_TOKENS_PER_BOX = MAX_TOKENS_PER_BOX;
exports.MalformedTransaction = MalformedTransaction;
exports.MaxTokensOverflow = MaxTokensOverflow;
exports.NotAllowedTokenBurning = NotAllowedTokenBurning;
exports.NotFoundError = NotFoundError;
exports.OutputBuilder = OutputBuilder;
exports.OutputsCollection = OutputsCollection;
exports.RECOMMENDED_MIN_FEE_VALUE = RECOMMENDED_MIN_FEE_VALUE;
exports.SAFE_MIN_BOX_VALUE = SAFE_MIN_BOX_VALUE;
exports.SConstant = SConstant;
exports.SParse = SParse;
exports.TokensCollection = TokensCollection;
exports.TransactionBuilder = TransactionBuilder2;
exports.UndefinedCreationHeight = UndefinedCreationHeight;
exports.UndefinedMintingContext = UndefinedMintingContext;
exports.estimateMinBoxValue = estimateMinBoxValue;


},{"@fleet-sdk/common":1,"@fleet-sdk/crypto":3,"@fleet-sdk/serializer":4}],3:[function(require,module,exports){
'use strict';

var utils = require('@noble/hashes/utils');
var blake2b = require('@noble/hashes/blake2b');
var sha256$1 = require('@noble/hashes/sha256');
var base = require('@scure/base');
var common = require('@fleet-sdk/common');

// src/index.ts
var HEXES = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  common.assertInstanceOf(bytes, Uint8Array);
  let hex2 = "";
  for (let i = 0, len = bytes.length; i < len; i++) {
    hex2 += HEXES[bytes[i]];
  }
  return hex2;
}
function hexToBytes(hex2) {
  common.assertTypeOf(hex2, "string");
  common.assert(hex2.length % 2 === 0, "Invalid hex padding.");
  const bytes = new Uint8Array(hex2.length / 2);
  for (let i = 0, j = 0, len = bytes.length; i < len; i++) {
    const n1 = charCodeToBase16(hex2.charCodeAt(j++));
    const n2 = charCodeToBase16(hex2.charCodeAt(j++));
    bytes[i] = n1 * 16 + n2;
  }
  return bytes;
}
function charCodeToBase16(char) {
  if (char >= 48 /* ZERO */ && char <= 57 /* NINE */) {
    return char - 48 /* ZERO */;
  } else if (char >= 65 /* A_UP */ && char <= 70 /* F_UP */) {
    return char - (65 /* A_UP */ - 10);
  } else if (char >= 97 /* A_LO */ && char <= 102 /* F_LO */) {
    return char - (97 /* A_LO */ - 10);
  }
  throw new Error("Invalid byte sequence.");
}
var hex = {
  encode: bytesToHex,
  decode: hexToBytes
};
function bytesToUtf8(bytes) {
  common.assertInstanceOf(bytes, Uint8Array);
  return new TextDecoder().decode(bytes);
}
function utf8ToBytes(str) {
  common.assertTypeOf(str, "string");
  return new Uint8Array(new TextEncoder().encode(str));
}
var utf8 = {
  encode: bytesToUtf8,
  decode: utf8ToBytes
};

// src/coders/index.ts
var base58check = base.base58check(sha256);
var base58 = base.base58;
var base64 = base.base64;

// src/hashes.ts
function ensureBytes(input) {
  if (input instanceof Uint8Array)
    return input;
  return hex.decode(input);
}
function blake2b256(message) {
  return blake2b.blake2b(ensureBytes(message), { dkLen: 32 });
}
function sha256(message) {
  return sha256$1.sha256(ensureBytes(message));
}

// src/index.ts
var randomBytes = utils.randomBytes;

exports.base58 = base58;
exports.base58check = base58check;
exports.base64 = base64;
exports.blake2b256 = blake2b256;
exports.hex = hex;
exports.randomBytes = randomBytes;
exports.sha256 = sha256;
exports.utf8 = utf8;


},{"@fleet-sdk/common":1,"@noble/hashes/blake2b":9,"@noble/hashes/sha256":11,"@noble/hashes/utils":12,"@scure/base":13}],4:[function(require,module,exports){
'use strict';

var common = require('@fleet-sdk/common');
var crypto = require('@fleet-sdk/crypto');

// src/coders/sigmaReader.ts
function hexToBigInt(hex6) {
  if (hex6.length % 2) {
    hex6 = "0" + hex6;
  }
  const value = BigInt("0x" + hex6);
  const highByte = parseInt(hex6.slice(0, 2), 16);
  if (128 & highByte) {
    return -_bitNegate(value);
  }
  return value;
}
function bigIntToHex(value) {
  const positive = value >= common._0n;
  if (!positive) {
    value = _bitNegate(value);
  }
  let hex6 = value.toString(16);
  if (hex6.length % 2) {
    hex6 = "0" + hex6;
  }
  if (positive && 128 & parseInt(hex6.slice(0, 2), 16)) {
    hex6 = "00" + hex6;
  }
  return hex6;
}
function _bitNegate(value) {
  const negative = value < common._0n;
  if (negative) {
    value = -value;
  }
  const bits = value.toString(2);
  let bitLen = bits.length;
  const mod = bitLen % 8;
  if (mod > 0) {
    bitLen += 8 - mod;
  } else if (negative && common.first(bits) === "1" && bits.indexOf("1", 1) !== -1) {
    bitLen += 8;
  }
  const mask = (1n << BigInt(bitLen)) - 1n;
  return (~value & mask) + 1n;
}
function writeVLQ(writer, value) {
  if (value === 0) {
    return writer.write(0);
  } else if (value < 0) {
    throw new RangeError("Variable Length Quantity not supported for negative numbers.");
  }
  do {
    let lower7bits = value & 127;
    value >>= 7;
    if (value > 0) {
      lower7bits |= 128;
    }
    writer.write(lower7bits);
  } while (value > 0);
  return writer;
}
function readVLQ(reader) {
  if (reader.isEmpty) {
    return 0;
  }
  let value = 0;
  let shift = 0;
  let lower7bits = 0;
  do {
    lower7bits = reader.readByte();
    value |= (lower7bits & 127) << shift;
    shift += 7;
  } while ((lower7bits & 128) != 0);
  return value;
}
function writeBigVLQ(writer, value) {
  if (value === common._0n) {
    return writer.write(0);
  } else if (value < common._0n) {
    throw new RangeError("Variable Length Quantity not supported for negative numbers");
  }
  do {
    let lower7bits = Number(value & common._127n);
    value >>= common._7n;
    if (value > 0) {
      lower7bits |= 128;
    }
    writer.write(lower7bits);
  } while (value > 0);
  return writer;
}
function readBigVLQ(reader) {
  if (reader.isEmpty) {
    return common._0n;
  }
  let value = common._0n;
  let shift = common._0n;
  let lower7bits = common._0n;
  do {
    lower7bits = BigInt(reader.readByte());
    value |= (lower7bits & common._127n) << shift;
    shift += common._7n;
  } while ((lower7bits & common._128n) != common._0n);
  return value;
}
function estimateVLQSize(value) {
  let size = 0;
  if (typeof value === "number") {
    do {
      size++;
      value = Math.floor(value / 128);
    } while (value > 0);
    return size;
  }
  value = common.ensureBigInt(value);
  do {
    size++;
    value /= common._128n;
  } while (value > common._0n);
  return size;
}
function zigZagEncode(input) {
  return input << 1 ^ input >> 63;
}
function zigZagDecode(input) {
  return input >> 1 ^ -(input & 1);
}
function zigZagEncodeBigInt(input) {
  return input << common._1n ^ input >> common._63n;
}
function zigZagDecodeBigInt(input) {
  return input >> common._1n ^ -(input & common._1n);
}

// src/coders/sigmaReader.ts
var SigmaReader = class {
  #bytes;
  #cursor;
  get isEmpty() {
    return common.isEmpty(this.#bytes);
  }
  constructor(bytes) {
    if (typeof bytes === "string") {
      this.#bytes = crypto.hex.decode(bytes);
    } else {
      this.#bytes = bytes;
    }
    this.#cursor = 0;
  }
  readBoolean() {
    return this.readByte() === 1;
  }
  readBits(length) {
    const bits = new Array(length);
    let bitOffset = 0;
    for (let i = 0; i < length; i++) {
      const bit = this.#bytes[this.#cursor] >> bitOffset++ & 1;
      bits[i] = bit === 1;
      if (bitOffset == 8) {
        bitOffset = 0;
        this.#cursor++;
      }
    }
    if (bitOffset > 0) {
      this.#cursor++;
    }
    return bits;
  }
  readByte() {
    return this.#bytes[this.#cursor++];
  }
  readBytes(length) {
    return this.#bytes.subarray(this.#cursor, this.#cursor += length);
  }
  readVlq() {
    return readVLQ(this);
  }
  readShort() {
    return Number(zigZagDecode(readVLQ(this)));
  }
  readInt() {
    const int = this.readLong();
    return Number(int);
  }
  readLong() {
    return zigZagDecodeBigInt(readBigVLQ(this));
  }
  readBigInt() {
    const len = readVLQ(this);
    return hexToBigInt(crypto.hex.encode(this.readBytes(len)));
  }
};
var SigmaWriter = class {
  #bytes;
  #cursor;
  get length() {
    return this.#cursor;
  }
  constructor(maxLength) {
    this.#bytes = new Uint8Array(maxLength);
    this.#cursor = 0;
  }
  writeBoolean(value) {
    this.write(value === true ? 1 : 0);
    return this;
  }
  writeVLQ(value) {
    return writeVLQ(this, value);
  }
  writeBigVLQ(value) {
    return writeBigVLQ(this, value);
  }
  writeShort(value) {
    this.writeVLQ(zigZagEncode(value));
    return this;
  }
  writeInt(value) {
    this.writeLong(BigInt(value));
    return this;
  }
  writeLong(value) {
    this.writeBigVLQ(zigZagEncodeBigInt(value));
    return this;
  }
  write(byte) {
    this.#bytes[this.#cursor++] = byte;
    return this;
  }
  writeBytes(bytes) {
    this.#bytes.set(bytes, this.#cursor);
    this.#cursor += bytes.length;
    return this;
  }
  writeHex(bytesHex) {
    return this.writeBytes(crypto.hex.decode(bytesHex));
  }
  writeBits(bits) {
    let bitOffset = 0;
    for (let i = 0; i < bits.length; i++) {
      if (bits[i]) {
        this.#bytes[this.#cursor] |= 1 << bitOffset++;
      } else {
        this.#bytes[this.#cursor] &= ~(1 << bitOffset++);
      }
      if (bitOffset == 8) {
        bitOffset = 0;
        this.#cursor++;
      }
    }
    if (bitOffset > 0) {
      this.#cursor++;
    }
    return this;
  }
  writeBigInt(value) {
    const hex6 = bigIntToHex(value);
    this.writeVLQ(hex6.length / 2);
    this.writeHex(hex6);
    return this;
  }
  toHex() {
    return crypto.hex.encode(this.toBytes());
  }
  toBytes() {
    return this.#bytes.subarray(0, this.#cursor);
  }
};

// src/types/base.ts
var SType = class {
  coerce(data) {
    return data;
  }
};
var SMonomorphicType = class extends SType {
  get embeddable() {
    return false;
  }
};
var SPrimitiveType = class extends SMonomorphicType {
  get embeddable() {
    return true;
  }
};
var SGenericType = class extends SType {
  #internalType;
  constructor(type) {
    super();
    this.#internalType = type;
  }
  get elementsType() {
    return this.#internalType;
  }
  get embeddable() {
    return false;
  }
};
var SBoolType = class extends SPrimitiveType {
  get code() {
    return 1;
  }
  toString() {
    return "SBool";
  }
};
var SByteType = class extends SPrimitiveType {
  get code() {
    return 2;
  }
  toString() {
    return "SByte";
  }
};
var SShortType = class extends SPrimitiveType {
  get code() {
    return 3;
  }
  toString() {
    return "SShort";
  }
};
var SIntType = class extends SPrimitiveType {
  get code() {
    return 4;
  }
  toString() {
    return "SInt";
  }
};
var SLongType = class extends SPrimitiveType {
  get code() {
    return 5;
  }
  coerce(data) {
    return common.ensureBigInt(data);
  }
  toString() {
    return "SLong";
  }
};
var SBigIntType = class extends SPrimitiveType {
  get code() {
    return 6;
  }
  coerce(data) {
    return common.ensureBigInt(data);
  }
  toString() {
    return "SBigInt";
  }
};
var SGroupElementType = class extends SPrimitiveType {
  get code() {
    return 7;
  }
  coerce(data) {
    return typeof data === "string" ? crypto.hex.decode(data) : data;
  }
  toString() {
    return "SGroupElement";
  }
};
var SSigmaPropType = class extends SPrimitiveType {
  get code() {
    return 8;
  }
  toString() {
    return "SSigmaProp";
  }
};

// src/types/monomorphics.ts
var SUnitType = class extends SMonomorphicType {
  get code() {
    return 98;
  }
  toString() {
    return "SUnit";
  }
};

// src/types/descriptors.ts
var constructorCode = Object.freeze({
  embeddable: 0,
  simpleColl: 1,
  nestedColl: 2,
  option: 3,
  optionCollection: 4,
  pairOne: 5,
  pairTwo: 6,
  symmetricPair: 7,
  genericTuple: 8
});
var MAX_PRIMITIVE_TYPE_CODE = 11;
var PRIMITIVE_TYPE_RANGE = MAX_PRIMITIVE_TYPE_CODE + 1;
var typeCodeOf = (constructor) => PRIMITIVE_TYPE_RANGE * constructor;
var collDescriptor = Object.freeze({
  code: typeCodeOf(constructorCode.simpleColl),
  embeddable: false,
  simpleCollTypeCode: typeCodeOf(constructorCode.simpleColl),
  nestedCollTypeCode: typeCodeOf(constructorCode.nestedColl)
});
var tupleDescriptor = Object.freeze({
  code: typeCodeOf(constructorCode.pairOne),
  embeddable: false,
  pairOneTypeCode: typeCodeOf(constructorCode.pairOne),
  pairTwoTypeCode: typeCodeOf(constructorCode.pairTwo),
  tripleTypeCode: typeCodeOf(constructorCode.pairTwo),
  symmetricPairTypeCode: typeCodeOf(constructorCode.symmetricPair),
  quadrupleTypeCode: typeCodeOf(constructorCode.symmetricPair),
  genericTupleTypeCode: typeCodeOf(constructorCode.genericTuple)
});
var descriptors = {
  bool: new SBoolType(),
  byte: new SByteType(),
  short: new SShortType(),
  int: new SIntType(),
  long: new SLongType(),
  bigInt: new SBigIntType(),
  groupElement: new SGroupElementType(),
  sigmaProp: new SSigmaPropType(),
  unit: new SUnitType(),
  coll: collDescriptor,
  tuple: tupleDescriptor
};
function isColl(type) {
  return type.code >= descriptors.coll.simpleCollTypeCode && type.code <= descriptors.coll.nestedCollTypeCode + MAX_PRIMITIVE_TYPE_CODE;
}
function isTuple(type) {
  return type.code >= descriptors.tuple.pairOneTypeCode && type.code <= descriptors.tuple.genericTupleTypeCode;
}
function getPrimitiveType(typeCode) {
  switch (typeCode) {
    case descriptors.bool.code:
      return descriptors.bool;
    case descriptors.byte.code:
      return descriptors.byte;
    case descriptors.short.code:
      return descriptors.short;
    case descriptors.int.code:
      return descriptors.int;
    case descriptors.long.code:
      return descriptors.long;
    case descriptors.bigInt.code:
      return descriptors.bigInt;
    case descriptors.groupElement.code:
      return descriptors.groupElement;
    case descriptors.sigmaProp.code:
      return descriptors.sigmaProp;
    default:
      throw new Error(
        `The type code '0x${typeCode.toString(16)}' is not a valid primitive type code.`
      );
  }
}
var SCollType = class extends SGenericType {
  get code() {
    return descriptors.coll.code;
  }
  coerce(elements) {
    if (this.elementsType.code === descriptors.byte.code && !(elements instanceof Uint8Array)) {
      return typeof elements === "string" ? crypto.hex.decode(elements) : Uint8Array.from(elements);
    }
    return elements.map((el) => this.elementsType.coerce(el));
  }
  toString() {
    return `SColl[${this.elementsType.toString()}]`;
  }
};
var STupleType = class extends SGenericType {
  get code() {
    return descriptors.tuple.code;
  }
  coerce(elements) {
    const output = new Array(elements.length);
    for (let i = 0; i < elements.length; i++) {
      output[i] = this.elementsType[i].coerce(elements[i]);
    }
    return output;
  }
  toString() {
    return `(${this.elementsType.map((el) => el.toString()).join(", ")})`;
  }
};
function monoProxy(ctor, cache, forceConstruction) {
  return new Proxy(ctor, {
    apply: (target, _, args) => {
      const instance = cache ?? new target();
      if (!forceConstruction && common.isEmpty(args))
        return instance;
      return new SConstant(instance, ...args);
    }
  });
}
function genericProxy(ctor, handler) {
  return new Proxy(ctor, {
    apply: handler
  });
}
var SByte = monoProxy(SByteType, descriptors.byte);
var SBool = monoProxy(SBoolType, descriptors.bool);
var SShort = monoProxy(SShortType, descriptors.short);
var SInt = monoProxy(SIntType, descriptors.int);
var SLong = monoProxy(SLongType, descriptors.long);
var SBigInt = monoProxy(SBigIntType, descriptors.bigInt);
var SGroupElement = monoProxy(
  SGroupElementType,
  descriptors.groupElement
);
var SSigmaProp = monoProxy(
  SSigmaPropType,
  descriptors.sigmaProp
);
var SUnit = monoProxy(SUnitType, void 0, true);
var SColl = genericProxy(SCollType, (target, _, args) => {
  const [type, elements] = args;
  const elementsType = type();
  if (!elements)
    return () => new target(elementsType);
  return new SConstant(new target(elementsType), elements);
});
var SPair = genericProxy(STupleType, (target, _, args) => {
  const [left, right] = args;
  if (typeof left === "function" && typeof right === "function") {
    return () => new target([left(), right()]);
  } else if (left instanceof SConstant && right instanceof SConstant) {
    return new SConstant(new target([left.type, right.type]), [left.data, right.data]);
  }
  throw new Error("Invalid tuple declaration.");
});

// src/serializers/dataSerializer.ts
var GROUP_ELEMENT_LENGTH = 33;
var PROVE_DLOG_OP = 205;
var DataSerializer = class _DataSerializer {
  static serialize(data, type, writer) {
    if (type.embeddable) {
      switch (type.code) {
        case descriptors.bool.code:
          return writer.writeBoolean(data);
        case descriptors.byte.code:
          return writer.write(data);
        case descriptors.short.code:
          return writer.writeShort(data);
        case descriptors.int.code:
          return writer.writeInt(data);
        case descriptors.long.code:
          return writer.writeLong(data);
        case descriptors.bigInt.code: {
          return writer.writeBigInt(data);
        }
        case descriptors.groupElement.code:
          return writer.writeBytes(data);
        case descriptors.sigmaProp.code: {
          const node = data;
          if (node.type === descriptors.groupElement) {
            writer.write(PROVE_DLOG_OP);
            return _DataSerializer.serialize(node.data, node.type, writer);
          } else {
            throw Error("Serialization error: SigmaProp operation not implemented.");
          }
        }
      }
    } else if (isColl(type)) {
      if (type.elementsType.code === descriptors.byte.code) {
        const isUint8Array = data instanceof Uint8Array;
        common.assert(isUint8Array, `SColl[Byte] expected an UInt8Array, got ${typeof data}.`);
      } else {
        common.assert(Array.isArray(data), `SColl expected an array, got ${typeof data}.`);
      }
      writer.writeVLQ(data.length);
      switch (type.elementsType.code) {
        case descriptors.bool.code: {
          return writer.writeBits(data);
        }
        case descriptors.byte.code: {
          return writer.writeBytes(data);
        }
        default: {
          for (let i = 0; i < data.length; i++) {
            _DataSerializer.serialize(data[i], type.elementsType, writer);
          }
          return writer;
        }
      }
    } else if (isTuple(type)) {
      common.assert(
        Array.isArray(data),
        `STupleType serialization expected an array, got ${typeof data}.`
      );
      const len = type.elementsType.length;
      for (let i = 0; i < len; i++) {
        _DataSerializer.serialize(data[i], type.elementsType[i], writer);
      }
      return writer;
    } else if (type.code === descriptors.unit.code) {
      return writer;
    }
    throw Error(`Serialization error: '0x${type.code.toString(16)}' type not implemented.`);
  }
  static deserialize(type, reader) {
    if (type.embeddable) {
      switch (type.code) {
        case descriptors.bool.code:
          return reader.readBoolean();
        case descriptors.byte.code:
          return reader.readByte();
        case descriptors.short.code:
          return reader.readShort();
        case descriptors.int.code:
          return reader.readInt();
        case descriptors.long.code:
          return reader.readLong();
        case descriptors.bigInt.code:
          return reader.readBigInt();
        case descriptors.groupElement.code:
          return reader.readBytes(GROUP_ELEMENT_LENGTH);
        case descriptors.sigmaProp.code: {
          if (reader.readByte() === PROVE_DLOG_OP) {
            return this.deserialize(descriptors.groupElement, reader);
          }
          break;
        }
      }
    } else {
      switch (type.code) {
        case descriptors.coll.code: {
          const length = reader.readVlq();
          const embeddedType = type.elementsType;
          switch (embeddedType.code) {
            case descriptors.bool.code:
              return reader.readBits(length);
            case descriptors.byte.code:
              return reader.readBytes(length);
            default: {
              const elements = new Array(length);
              for (let i = 0; i < length; i++) {
                elements[i] = this.deserialize(embeddedType, reader);
              }
              return elements;
            }
          }
        }
        case descriptors.tuple.code: {
          return type.elementsType.map((t) => this.deserialize(t, reader));
        }
        case descriptors.unit.code: {
          return void 0;
        }
      }
    }
    throw new Error(`Parsing error: '0x${type.code.toString(16)}' type not implemented.`);
  }
};
var TypeSerializer = class {
  static serialize(type, writer) {
    if (type.embeddable) {
      writer.write(type.code);
    } else if (type.code === descriptors.unit.code) {
      writer.write(type.code);
    } else if (isColl(type)) {
      if (type.elementsType.embeddable) {
        writer.write(descriptors.coll.simpleCollTypeCode + type.elementsType.code);
      } else if (isColl(type.elementsType)) {
        const nestedColl = type.elementsType;
        if (nestedColl.elementsType.embeddable) {
          writer.write(descriptors.coll.nestedCollTypeCode + nestedColl.elementsType.code);
        } else {
          writer.write(descriptors.coll.simpleCollTypeCode);
          this.serialize(nestedColl, writer);
        }
      } else {
        writer.write(descriptors.coll.simpleCollTypeCode);
        this.serialize(type.elementsType, writer);
      }
    } else if (isTuple(type)) {
      switch (type.elementsType.length) {
        case 2: {
          const left = common.first(type.elementsType);
          const right = common.last(type.elementsType);
          if (left.embeddable) {
            if (left.code === right.code) {
              writer.write(descriptors.tuple.symmetricPairTypeCode + left.code);
            } else {
              writer.write(descriptors.tuple.pairOneTypeCode + left.code);
              this.serialize(right, writer);
            }
          } else if (right.embeddable) {
            writer.write(descriptors.tuple.pairTwoTypeCode + right.code);
            this.serialize(left, writer);
          } else {
            writer.write(descriptors.tuple.pairOneTypeCode);
            this.serialize(left, writer);
            this.serialize(right, writer);
          }
          return;
        }
        case 3:
          writer.write(descriptors.tuple.tripleTypeCode);
          break;
        case 4:
          writer.write(descriptors.tuple.quadrupleTypeCode);
          break;
        default: {
          const len = type.elementsType.length;
          common.assert(len >= 2 && len <= 255, "Invalid type: tuples must have between 2 and 255 items.");
          writer.write(descriptors.tuple.genericTupleTypeCode);
          writer.writeVLQ(len);
        }
      }
      for (let i = 0; i < type.elementsType.length; i++) {
        this.serialize(type.elementsType[i], writer);
      }
    } else {
      throw new Error("Serialization error: type not implemented.");
    }
  }
  static deserialize(r) {
    const byte = r.readByte();
    common.assert(byte > 0, `Parsing Error: Unexpected type code '0x${byte.toString(16)}'`);
    if (byte < descriptors.tuple.genericTupleTypeCode) {
      const ctorCode = Math.floor(byte / PRIMITIVE_TYPE_RANGE);
      const embdCode = Math.floor(byte % PRIMITIVE_TYPE_RANGE);
      switch (ctorCode) {
        case constructorCode.embeddable: {
          return getPrimitiveType(embdCode);
        }
        case constructorCode.simpleColl: {
          const internal = embdCode === 0 ? this.deserialize(r) : getPrimitiveType(embdCode);
          return new SCollType(internal);
        }
        case constructorCode.nestedColl: {
          return new SCollType(new SCollType(getPrimitiveType(embdCode)));
        }
        case constructorCode.pairOne: {
          const internal = embdCode === 0 ? [this.deserialize(r), this.deserialize(r)] : [getPrimitiveType(embdCode), this.deserialize(r)];
          return new STupleType(internal);
        }
        case constructorCode.pairTwo: {
          const internal = embdCode === 0 ? [this.deserialize(r), this.deserialize(r), this.deserialize(r)] : [this.deserialize(r), getPrimitiveType(embdCode)];
          return new STupleType(internal);
        }
        case constructorCode.symmetricPair: {
          const internal = embdCode === 0 ? [this.deserialize(r), this.deserialize(r), this.deserialize(r), this.deserialize(r)] : [getPrimitiveType(embdCode), getPrimitiveType(embdCode)];
          return new STupleType(internal);
        }
      }
    } else {
      switch (byte) {
        case descriptors.tuple.genericTupleTypeCode: {
          const len = r.readVlq();
          const wrapped = new Array(len);
          for (let i = 0; i < len; i++) {
            wrapped[i] = this.deserialize(r);
          }
          return new STupleType(wrapped);
        }
        case descriptors.unit.code: {
          return descriptors.unit;
        }
      }
    }
    throw new Error("Not implemented.");
  }
};

// src/sigmaConstant.ts
var MAX_CONSTANT_LENGTH = 4096;
var SConstant = class _SConstant {
  #type;
  #data;
  constructor(type, data) {
    this.#type = type;
    this.#data = type.coerce(data);
  }
  static from(bytes) {
    common.assert(bytes.length > 0, "Empty constant bytes.");
    const reader = new SigmaReader(bytes);
    const type = TypeSerializer.deserialize(reader);
    const data = DataSerializer.deserialize(type, reader);
    return new _SConstant(type, data);
  }
  get type() {
    return this.#type;
  }
  get data() {
    return this.#data;
  }
  toBytes() {
    const writer = new SigmaWriter(MAX_CONSTANT_LENGTH);
    TypeSerializer.serialize(this.type, writer);
    DataSerializer.serialize(this.data, this.type, writer);
    return writer.toBytes();
  }
  toHex() {
    return crypto.hex.encode(this.toBytes());
  }
};
function parse(constant, mode = "strict") {
  if (mode === "strict")
    return SConstant.from(constant ?? "").data;
  if (!constant)
    return;
  try {
    return SConstant.from(constant).data;
  } catch {
    return;
  }
}
var MAX_UINT16_VALUE = 65535;
function serializeBox(box, writer, distinctTokenIds) {
  if (!writer) {
    writer = new SigmaWriter(5e4);
  }
  writer.writeBigVLQ(common.ensureBigInt(box.value));
  writer.writeHex(box.ergoTree);
  writer.writeVLQ(box.creationHeight);
  writeTokens(writer, box.assets, distinctTokenIds);
  writeRegisters(writer, box.additionalRegisters);
  if (common.isDefined(distinctTokenIds)) {
    return writer;
  } else {
    if (!isBox(box)) {
      throw new Error("Invalid box type.");
    }
    return writer.writeHex(box.transactionId).writeVLQ(box.index);
  }
}
function isBox(box) {
  const castedBox = box;
  return common.isDefined(castedBox.transactionId) && common.isDefined(castedBox.index);
}
function writeTokens(writer, tokens, tokenIds) {
  if (common.isEmpty(tokens)) {
    writer.write(0);
    return;
  }
  writer.writeVLQ(tokens.length);
  if (common.some(tokenIds)) {
    tokens.map(
      (token) => writer.writeVLQ(tokenIds.indexOf(token.tokenId)).writeBigVLQ(common.ensureBigInt(token.amount))
    );
  } else {
    tokens.map((token) => writer.writeHex(token.tokenId).writeBigVLQ(common.ensureBigInt(token.amount)));
  }
}
function writeRegisters(writer, registers) {
  const keys = Object.keys(registers).sort();
  let length = 0;
  for (const key of keys) {
    if (registers[key]) {
      length++;
    }
  }
  writer.writeVLQ(length);
  if (length == 0) {
    return;
  }
  for (const key of keys) {
    const register = registers[key];
    if (common.isDefined(register)) {
      writer.writeHex(register);
    }
  }
}
function estimateBoxSize(box, withValue) {
  if (common.isUndefined(box.creationHeight)) {
    throw new Error("Box size estimation error: creation height is undefined.");
  }
  let size = 0;
  size += estimateVLQSize(common.isDefined(withValue) ? withValue : box.value);
  size += common.byteSizeOf(box.ergoTree);
  size += estimateVLQSize(box.creationHeight);
  size += estimateVLQSize(box.assets.length);
  size += box.assets.reduce(
    (acc, curr) => acc += common.byteSizeOf(curr.tokenId) + estimateVLQSize(curr.amount),
    0
  );
  let registersLength = 0;
  for (const key in box.additionalRegisters) {
    const register = box.additionalRegisters[key];
    if (register) {
      size += common.byteSizeOf(register);
      registersLength++;
    }
  }
  size += estimateVLQSize(registersLength);
  size += 32;
  size += estimateVLQSize(isBox(box) ? box.index : MAX_UINT16_VALUE);
  return size;
}
function serializeTransaction(transaction) {
  const writer = new SigmaWriter(1e5);
  writer.writeVLQ(transaction.inputs.length);
  transaction.inputs.map((input) => writeInput(writer, input));
  writer.writeVLQ(transaction.dataInputs.length);
  transaction.dataInputs.map((dataInput) => writer.writeHex(dataInput.boxId));
  const distinctTokenIds = getDistinctTokenIds(transaction.outputs);
  writer.writeVLQ(distinctTokenIds.length);
  distinctTokenIds.map((tokenId) => writer.writeHex(tokenId));
  writer.writeVLQ(transaction.outputs.length);
  transaction.outputs.map((output) => serializeBox(output, writer, distinctTokenIds));
  return writer;
}
function writeInput(writer, input) {
  writer.writeHex(input.boxId);
  writer.write(0);
  writeExtension(writer, input.extension);
}
function writeExtension(writer, extension) {
  const keys = Object.keys(extension);
  let length = 0;
  for (const key of keys) {
    const ext = extension[key];
    if (common.isDefined(ext)) {
      length++;
    }
  }
  writer.writeVLQ(length);
  if (length == 0) {
    return;
  }
  for (const key of keys) {
    const ext = extension[key];
    if (common.isDefined(ext)) {
      writer.writeVLQ(Number(key)).writeHex(ext);
    }
  }
}
function getDistinctTokenIds(outputs) {
  const tokenIds = /* @__PURE__ */ new Set();
  outputs.flatMap((output) => output.assets.map((asset) => tokenIds.add(asset.tokenId)));
  return Array.from(tokenIds);
}

exports.DataSerializer = DataSerializer;
exports.SBigInt = SBigInt;
exports.SBigIntType = SBigIntType;
exports.SBool = SBool;
exports.SBoolType = SBoolType;
exports.SByte = SByte;
exports.SByteType = SByteType;
exports.SColl = SColl;
exports.SCollType = SCollType;
exports.SConstant = SConstant;
exports.SGenericType = SGenericType;
exports.SGroupElement = SGroupElement;
exports.SGroupElementType = SGroupElementType;
exports.SInt = SInt;
exports.SIntType = SIntType;
exports.SLong = SLong;
exports.SLongType = SLongType;
exports.SMonomorphicType = SMonomorphicType;
exports.SPair = SPair;
exports.SPrimitiveType = SPrimitiveType;
exports.SShort = SShort;
exports.SShortType = SShortType;
exports.SSigmaProp = SSigmaProp;
exports.SSigmaPropType = SSigmaPropType;
exports.STupleType = STupleType;
exports.SType = SType;
exports.SUnit = SUnit;
exports.SUnitType = SUnitType;
exports.TypeSerializer = TypeSerializer;
exports.estimateBoxSize = estimateBoxSize;
exports.estimateVLQSize = estimateVLQSize;
exports.isColl = isColl;
exports.isTuple = isTuple;
exports.parse = parse;
exports.serializeBox = serializeBox;
exports.serializeTransaction = serializeTransaction;


},{"@fleet-sdk/common":1,"@fleet-sdk/crypto":3}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.output = exports.exists = exports.hash = exports.bytes = exports.bool = exports.number = void 0;
function number(n) {
    if (!Number.isSafeInteger(n) || n < 0)
        throw new Error(`Wrong positive integer: ${n}`);
}
exports.number = number;
function bool(b) {
    if (typeof b !== 'boolean')
        throw new Error(`Expected boolean, not ${b}`);
}
exports.bool = bool;
function bytes(b, ...lengths) {
    if (!(b instanceof Uint8Array))
        throw new Error('Expected Uint8Array');
    if (lengths.length > 0 && !lengths.includes(b.length))
        throw new Error(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
}
exports.bytes = bytes;
function hash(hash) {
    if (typeof hash !== 'function' || typeof hash.create !== 'function')
        throw new Error('Hash should be wrapped by utils.wrapConstructor');
    number(hash.outputLen);
    number(hash.blockLen);
}
exports.hash = hash;
function exists(instance, checkFinished = true) {
    if (instance.destroyed)
        throw new Error('Hash instance has been destroyed');
    if (checkFinished && instance.finished)
        throw new Error('Hash#digest() has already been called');
}
exports.exists = exists;
function output(out, instance) {
    bytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
        throw new Error(`digestInto() expects output buffer of length at least ${min}`);
    }
}
exports.output = output;
const assert = { number, bool, bytes, hash, exists, output };
exports.default = assert;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLAKE2 = exports.SIGMA = void 0;
const _assert_js_1 = require("./_assert.js");
const utils_js_1 = require("./utils.js");
// Blake is based on ChaCha permutation.
// For BLAKE2b, the two extra permutations for rounds 10 and 11 are SIGMA[10..11] = SIGMA[0..1].
// prettier-ignore
exports.SIGMA = new Uint8Array([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
    11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4,
    7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8,
    9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13,
    2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9,
    12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11,
    13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10,
    6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5,
    10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3,
]);
class BLAKE2 extends utils_js_1.Hash {
    constructor(blockLen, outputLen, opts = {}, keyLen, saltLen, persLen) {
        super();
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.length = 0;
        this.pos = 0;
        this.finished = false;
        this.destroyed = false;
        (0, _assert_js_1.number)(blockLen);
        (0, _assert_js_1.number)(outputLen);
        (0, _assert_js_1.number)(keyLen);
        if (outputLen < 0 || outputLen > keyLen)
            throw new Error('outputLen bigger than keyLen');
        if (opts.key !== undefined && (opts.key.length < 1 || opts.key.length > keyLen))
            throw new Error(`key must be up 1..${keyLen} byte long or undefined`);
        if (opts.salt !== undefined && opts.salt.length !== saltLen)
            throw new Error(`salt must be ${saltLen} byte long or undefined`);
        if (opts.personalization !== undefined && opts.personalization.length !== persLen)
            throw new Error(`personalization must be ${persLen} byte long or undefined`);
        this.buffer32 = (0, utils_js_1.u32)((this.buffer = new Uint8Array(blockLen)));
    }
    update(data) {
        (0, _assert_js_1.exists)(this);
        // Main difference with other hashes: there is flag for last block,
        // so we cannot process current block before we know that there
        // is the next one. This significantly complicates logic and reduces ability
        // to do zero-copy processing
        const { blockLen, buffer, buffer32 } = this;
        data = (0, utils_js_1.toBytes)(data);
        const len = data.length;
        const offset = data.byteOffset;
        const buf = data.buffer;
        for (let pos = 0; pos < len;) {
            // If buffer is full and we still have input (don't process last block, same as blake2s)
            if (this.pos === blockLen) {
                this.compress(buffer32, 0, false);
                this.pos = 0;
            }
            const take = Math.min(blockLen - this.pos, len - pos);
            const dataOffset = offset + pos;
            // full block && aligned to 4 bytes && not last in input
            if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
                const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
                for (let pos32 = 0; pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
                    this.length += blockLen;
                    this.compress(data32, pos32, false);
                }
                continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            this.length += take;
            pos += take;
        }
        return this;
    }
    digestInto(out) {
        (0, _assert_js_1.exists)(this);
        (0, _assert_js_1.output)(out, this);
        const { pos, buffer32 } = this;
        this.finished = true;
        // Padding
        this.buffer.subarray(pos).fill(0);
        this.compress(buffer32, 0, true);
        const out32 = (0, utils_js_1.u32)(out);
        this.get().forEach((v, i) => (out32[i] = v));
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneInto(to) {
        const { buffer, length, finished, destroyed, outputLen, pos } = this;
        to || (to = new this.constructor({ dkLen: outputLen }));
        to.set(...this.get());
        to.length = length;
        to.finished = finished;
        to.destroyed = destroyed;
        to.outputLen = outputLen;
        to.buffer.set(buffer);
        to.pos = pos;
        return to;
    }
}
exports.BLAKE2 = BLAKE2;

},{"./_assert.js":5,"./utils.js":12}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHA2 = void 0;
const _assert_js_1 = require("./_assert.js");
const utils_js_1 = require("./utils.js");
// Polyfill for Safari 14
function setBigUint64(view, byteOffset, value, isLE) {
    if (typeof view.setBigUint64 === 'function')
        return view.setBigUint64(byteOffset, value, isLE);
    const _32n = BigInt(32);
    const _u32_max = BigInt(0xffffffff);
    const wh = Number((value >> _32n) & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE ? 4 : 0;
    const l = isLE ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE);
    view.setUint32(byteOffset + l, wl, isLE);
}
// Base SHA2 class (RFC 6234)
class SHA2 extends utils_js_1.Hash {
    constructor(blockLen, outputLen, padOffset, isLE) {
        super();
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE;
        this.finished = false;
        this.length = 0;
        this.pos = 0;
        this.destroyed = false;
        this.buffer = new Uint8Array(blockLen);
        this.view = (0, utils_js_1.createView)(this.buffer);
    }
    update(data) {
        (0, _assert_js_1.exists)(this);
        const { view, buffer, blockLen } = this;
        data = (0, utils_js_1.toBytes)(data);
        const len = data.length;
        for (let pos = 0; pos < len;) {
            const take = Math.min(blockLen - this.pos, len - pos);
            // Fast path: we have at least one block in input, cast it to view and process
            if (take === blockLen) {
                const dataView = (0, utils_js_1.createView)(data);
                for (; blockLen <= len - pos; pos += blockLen)
                    this.process(dataView, pos);
                continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
                this.process(view, 0);
                this.pos = 0;
            }
        }
        this.length += data.length;
        this.roundClean();
        return this;
    }
    digestInto(out) {
        (0, _assert_js_1.exists)(this);
        (0, _assert_js_1.output)(out, this);
        this.finished = true;
        // Padding
        // We can avoid allocation of buffer for padding completely if it
        // was previously not allocated here. But it won't change performance.
        const { buffer, view, blockLen, isLE } = this;
        let { pos } = this;
        // append the bit '1' to the message
        buffer[pos++] = 0b10000000;
        this.buffer.subarray(pos).fill(0);
        // we have less than padOffset left in buffer, so we cannot put length in current block, need process it and pad again
        if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
        }
        // Pad until full block byte with zeros
        for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
        // Note: sha512 requires length to be 128bit integer, but length in JS will overflow before that
        // You need to write around 2 exabytes (u64_max / 8 / (1024**6)) for this to happen.
        // So we just write lowest 64 bits of that value.
        setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
        this.process(view, 0);
        const oview = (0, utils_js_1.createView)(out);
        const len = this.outputLen;
        // NOTE: we do division by 4 later, which should be fused in single op with modulo by JIT
        if (len % 4)
            throw new Error('_sha2: outputLen should be aligned to 32bit');
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length)
            throw new Error('_sha2: outputLen bigger than state');
        for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
        const { buffer, outputLen } = this;
        this.digestInto(buffer);
        const res = buffer.slice(0, outputLen);
        this.destroy();
        return res;
    }
    _cloneInto(to) {
        to || (to = new this.constructor());
        to.set(...this.get());
        const { blockLen, buffer, length, finished, destroyed, pos } = this;
        to.length = length;
        to.pos = pos;
        to.finished = finished;
        to.destroyed = destroyed;
        if (length % blockLen)
            to.buffer.set(buffer);
        return to;
    }
}
exports.SHA2 = SHA2;

},{"./_assert.js":5,"./utils.js":12}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.add5L = exports.add5H = exports.add4H = exports.add4L = exports.add3H = exports.add3L = exports.add = exports.rotlBL = exports.rotlBH = exports.rotlSL = exports.rotlSH = exports.rotr32L = exports.rotr32H = exports.rotrBL = exports.rotrBH = exports.rotrSL = exports.rotrSH = exports.shrSL = exports.shrSH = exports.toBig = exports.split = exports.fromBig = void 0;
const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
const _32n = /* @__PURE__ */ BigInt(32);
// We are not using BigUint64Array, because they are extremely slow as per 2022
function fromBig(n, le = false) {
    if (le)
        return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
    return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
exports.fromBig = fromBig;
function split(lst, le = false) {
    let Ah = new Uint32Array(lst.length);
    let Al = new Uint32Array(lst.length);
    for (let i = 0; i < lst.length; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
}
exports.split = split;
const toBig = (h, l) => (BigInt(h >>> 0) << _32n) | BigInt(l >>> 0);
exports.toBig = toBig;
// for Shift in [0, 32)
const shrSH = (h, _l, s) => h >>> s;
exports.shrSH = shrSH;
const shrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
exports.shrSL = shrSL;
// Right rotate for Shift in [1, 32)
const rotrSH = (h, l, s) => (h >>> s) | (l << (32 - s));
exports.rotrSH = rotrSH;
const rotrSL = (h, l, s) => (h << (32 - s)) | (l >>> s);
exports.rotrSL = rotrSL;
// Right rotate for Shift in (32, 64), NOTE: 32 is special case.
const rotrBH = (h, l, s) => (h << (64 - s)) | (l >>> (s - 32));
exports.rotrBH = rotrBH;
const rotrBL = (h, l, s) => (h >>> (s - 32)) | (l << (64 - s));
exports.rotrBL = rotrBL;
// Right rotate for shift===32 (just swaps l&h)
const rotr32H = (_h, l) => l;
exports.rotr32H = rotr32H;
const rotr32L = (h, _l) => h;
exports.rotr32L = rotr32L;
// Left rotate for Shift in [1, 32)
const rotlSH = (h, l, s) => (h << s) | (l >>> (32 - s));
exports.rotlSH = rotlSH;
const rotlSL = (h, l, s) => (l << s) | (h >>> (32 - s));
exports.rotlSL = rotlSL;
// Left rotate for Shift in (32, 64), NOTE: 32 is special case.
const rotlBH = (h, l, s) => (l << (s - 32)) | (h >>> (64 - s));
exports.rotlBH = rotlBH;
const rotlBL = (h, l, s) => (h << (s - 32)) | (l >>> (64 - s));
exports.rotlBL = rotlBL;
// JS uses 32-bit signed integers for bitwise operations which means we cannot
// simple take carry out of low bit sum by shift, we need to use division.
function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
}
exports.add = add;
// Addition with more than 2 elements
const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
exports.add3L = add3L;
const add3H = (low, Ah, Bh, Ch) => (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
exports.add3H = add3H;
const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
exports.add4L = add4L;
const add4H = (low, Ah, Bh, Ch, Dh) => (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
exports.add4H = add4H;
const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
exports.add5L = add5L;
const add5H = (low, Ah, Bh, Ch, Dh, Eh) => (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;
exports.add5H = add5H;
// prettier-ignore
const u64 = {
    fromBig, split, toBig,
    shrSH, shrSL,
    rotrSH, rotrSL, rotrBH, rotrBL,
    rotr32H, rotr32L,
    rotlSH, rotlSL, rotlBH, rotlBL,
    add, add3L, add3H, add4L, add4H, add5H, add5L,
};
exports.default = u64;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blake2b = void 0;
const _blake2_js_1 = require("./_blake2.js");
const _u64_js_1 = require("./_u64.js");
const utils_js_1 = require("./utils.js");
// Same as SHA-512 but LE
// prettier-ignore
const IV = /* @__PURE__ */ new Uint32Array([
    0xf3bcc908, 0x6a09e667, 0x84caa73b, 0xbb67ae85, 0xfe94f82b, 0x3c6ef372, 0x5f1d36f1, 0xa54ff53a,
    0xade682d1, 0x510e527f, 0x2b3e6c1f, 0x9b05688c, 0xfb41bd6b, 0x1f83d9ab, 0x137e2179, 0x5be0cd19
]);
// Temporary buffer
const BUF = /* @__PURE__ */ new Uint32Array(32);
// Mixing function G splitted in two halfs
function G1(a, b, c, d, msg, x) {
    // NOTE: V is LE here
    const Xl = msg[x], Xh = msg[x + 1]; // prettier-ignore
    let Al = BUF[2 * a], Ah = BUF[2 * a + 1]; // prettier-ignore
    let Bl = BUF[2 * b], Bh = BUF[2 * b + 1]; // prettier-ignore
    let Cl = BUF[2 * c], Ch = BUF[2 * c + 1]; // prettier-ignore
    let Dl = BUF[2 * d], Dh = BUF[2 * d + 1]; // prettier-ignore
    // v[a] = (v[a] + v[b] + x) | 0;
    let ll = _u64_js_1.default.add3L(Al, Bl, Xl);
    Ah = _u64_js_1.default.add3H(ll, Ah, Bh, Xh);
    Al = ll | 0;
    // v[d] = rotr(v[d] ^ v[a], 32)
    ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
    ({ Dh, Dl } = { Dh: _u64_js_1.default.rotr32H(Dh, Dl), Dl: _u64_js_1.default.rotr32L(Dh, Dl) });
    // v[c] = (v[c] + v[d]) | 0;
    ({ h: Ch, l: Cl } = _u64_js_1.default.add(Ch, Cl, Dh, Dl));
    // v[b] = rotr(v[b] ^ v[c], 24)
    ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
    ({ Bh, Bl } = { Bh: _u64_js_1.default.rotrSH(Bh, Bl, 24), Bl: _u64_js_1.default.rotrSL(Bh, Bl, 24) });
    (BUF[2 * a] = Al), (BUF[2 * a + 1] = Ah);
    (BUF[2 * b] = Bl), (BUF[2 * b + 1] = Bh);
    (BUF[2 * c] = Cl), (BUF[2 * c + 1] = Ch);
    (BUF[2 * d] = Dl), (BUF[2 * d + 1] = Dh);
}
function G2(a, b, c, d, msg, x) {
    // NOTE: V is LE here
    const Xl = msg[x], Xh = msg[x + 1]; // prettier-ignore
    let Al = BUF[2 * a], Ah = BUF[2 * a + 1]; // prettier-ignore
    let Bl = BUF[2 * b], Bh = BUF[2 * b + 1]; // prettier-ignore
    let Cl = BUF[2 * c], Ch = BUF[2 * c + 1]; // prettier-ignore
    let Dl = BUF[2 * d], Dh = BUF[2 * d + 1]; // prettier-ignore
    // v[a] = (v[a] + v[b] + x) | 0;
    let ll = _u64_js_1.default.add3L(Al, Bl, Xl);
    Ah = _u64_js_1.default.add3H(ll, Ah, Bh, Xh);
    Al = ll | 0;
    // v[d] = rotr(v[d] ^ v[a], 16)
    ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
    ({ Dh, Dl } = { Dh: _u64_js_1.default.rotrSH(Dh, Dl, 16), Dl: _u64_js_1.default.rotrSL(Dh, Dl, 16) });
    // v[c] = (v[c] + v[d]) | 0;
    ({ h: Ch, l: Cl } = _u64_js_1.default.add(Ch, Cl, Dh, Dl));
    // v[b] = rotr(v[b] ^ v[c], 63)
    ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
    ({ Bh, Bl } = { Bh: _u64_js_1.default.rotrBH(Bh, Bl, 63), Bl: _u64_js_1.default.rotrBL(Bh, Bl, 63) });
    (BUF[2 * a] = Al), (BUF[2 * a + 1] = Ah);
    (BUF[2 * b] = Bl), (BUF[2 * b + 1] = Bh);
    (BUF[2 * c] = Cl), (BUF[2 * c + 1] = Ch);
    (BUF[2 * d] = Dl), (BUF[2 * d + 1] = Dh);
}
class BLAKE2b extends _blake2_js_1.BLAKE2 {
    constructor(opts = {}) {
        super(128, opts.dkLen === undefined ? 64 : opts.dkLen, opts, 64, 16, 16);
        // Same as SHA-512, but LE
        this.v0l = IV[0] | 0;
        this.v0h = IV[1] | 0;
        this.v1l = IV[2] | 0;
        this.v1h = IV[3] | 0;
        this.v2l = IV[4] | 0;
        this.v2h = IV[5] | 0;
        this.v3l = IV[6] | 0;
        this.v3h = IV[7] | 0;
        this.v4l = IV[8] | 0;
        this.v4h = IV[9] | 0;
        this.v5l = IV[10] | 0;
        this.v5h = IV[11] | 0;
        this.v6l = IV[12] | 0;
        this.v6h = IV[13] | 0;
        this.v7l = IV[14] | 0;
        this.v7h = IV[15] | 0;
        const keyLength = opts.key ? opts.key.length : 0;
        this.v0l ^= this.outputLen | (keyLength << 8) | (0x01 << 16) | (0x01 << 24);
        if (opts.salt) {
            const salt = (0, utils_js_1.u32)((0, utils_js_1.toBytes)(opts.salt));
            this.v4l ^= salt[0];
            this.v4h ^= salt[1];
            this.v5l ^= salt[2];
            this.v5h ^= salt[3];
        }
        if (opts.personalization) {
            const pers = (0, utils_js_1.u32)((0, utils_js_1.toBytes)(opts.personalization));
            this.v6l ^= pers[0];
            this.v6h ^= pers[1];
            this.v7l ^= pers[2];
            this.v7h ^= pers[3];
        }
        if (opts.key) {
            // Pad to blockLen and update
            const tmp = new Uint8Array(this.blockLen);
            tmp.set((0, utils_js_1.toBytes)(opts.key));
            this.update(tmp);
        }
    }
    // prettier-ignore
    get() {
        let { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
        return [v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h];
    }
    // prettier-ignore
    set(v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h) {
        this.v0l = v0l | 0;
        this.v0h = v0h | 0;
        this.v1l = v1l | 0;
        this.v1h = v1h | 0;
        this.v2l = v2l | 0;
        this.v2h = v2h | 0;
        this.v3l = v3l | 0;
        this.v3h = v3h | 0;
        this.v4l = v4l | 0;
        this.v4h = v4h | 0;
        this.v5l = v5l | 0;
        this.v5h = v5h | 0;
        this.v6l = v6l | 0;
        this.v6h = v6h | 0;
        this.v7l = v7l | 0;
        this.v7h = v7h | 0;
    }
    compress(msg, offset, isLast) {
        this.get().forEach((v, i) => (BUF[i] = v)); // First half from state.
        BUF.set(IV, 16); // Second half from IV.
        let { h, l } = _u64_js_1.default.fromBig(BigInt(this.length));
        BUF[24] = IV[8] ^ l; // Low word of the offset.
        BUF[25] = IV[9] ^ h; // High word.
        // Invert all bits for last block
        if (isLast) {
            BUF[28] = ~BUF[28];
            BUF[29] = ~BUF[29];
        }
        let j = 0;
        const s = _blake2_js_1.SIGMA;
        for (let i = 0; i < 12; i++) {
            G1(0, 4, 8, 12, msg, offset + 2 * s[j++]);
            G2(0, 4, 8, 12, msg, offset + 2 * s[j++]);
            G1(1, 5, 9, 13, msg, offset + 2 * s[j++]);
            G2(1, 5, 9, 13, msg, offset + 2 * s[j++]);
            G1(2, 6, 10, 14, msg, offset + 2 * s[j++]);
            G2(2, 6, 10, 14, msg, offset + 2 * s[j++]);
            G1(3, 7, 11, 15, msg, offset + 2 * s[j++]);
            G2(3, 7, 11, 15, msg, offset + 2 * s[j++]);
            G1(0, 5, 10, 15, msg, offset + 2 * s[j++]);
            G2(0, 5, 10, 15, msg, offset + 2 * s[j++]);
            G1(1, 6, 11, 12, msg, offset + 2 * s[j++]);
            G2(1, 6, 11, 12, msg, offset + 2 * s[j++]);
            G1(2, 7, 8, 13, msg, offset + 2 * s[j++]);
            G2(2, 7, 8, 13, msg, offset + 2 * s[j++]);
            G1(3, 4, 9, 14, msg, offset + 2 * s[j++]);
            G2(3, 4, 9, 14, msg, offset + 2 * s[j++]);
        }
        this.v0l ^= BUF[0] ^ BUF[16];
        this.v0h ^= BUF[1] ^ BUF[17];
        this.v1l ^= BUF[2] ^ BUF[18];
        this.v1h ^= BUF[3] ^ BUF[19];
        this.v2l ^= BUF[4] ^ BUF[20];
        this.v2h ^= BUF[5] ^ BUF[21];
        this.v3l ^= BUF[6] ^ BUF[22];
        this.v3h ^= BUF[7] ^ BUF[23];
        this.v4l ^= BUF[8] ^ BUF[24];
        this.v4h ^= BUF[9] ^ BUF[25];
        this.v5l ^= BUF[10] ^ BUF[26];
        this.v5h ^= BUF[11] ^ BUF[27];
        this.v6l ^= BUF[12] ^ BUF[28];
        this.v6h ^= BUF[13] ^ BUF[29];
        this.v7l ^= BUF[14] ^ BUF[30];
        this.v7h ^= BUF[15] ^ BUF[31];
        BUF.fill(0);
    }
    destroy() {
        this.destroyed = true;
        this.buffer32.fill(0);
        this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
}
/**
 * BLAKE2b - optimized for 64-bit platforms. JS doesn't have uint64, so it's slower than BLAKE2s.
 * @param msg - message that would be hashed
 * @param opts - dkLen, key, salt, personalization
 */
exports.blake2b = (0, utils_js_1.wrapConstructorWithOpts)((opts) => new BLAKE2b(opts));

},{"./_blake2.js":6,"./_u64.js":8,"./utils.js":12}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crypto = void 0;
exports.crypto = typeof globalThis === 'object' && 'crypto' in globalThis ? globalThis.crypto : undefined;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha224 = exports.sha256 = void 0;
const _sha2_js_1 = require("./_sha2.js");
const utils_js_1 = require("./utils.js");
// SHA2-256 need to try 2^128 hashes to execute birthday attack.
// BTC network is doing 2^67 hashes/sec as per early 2023.
// Choice: a ? b : c
const Chi = (a, b, c) => (a & b) ^ (~a & c);
// Majority function, true if any two inpust is true
const Maj = (a, b, c) => (a & b) ^ (a & c) ^ (b & c);
// Round constants:
// first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
// prettier-ignore
const SHA256_K = /* @__PURE__ */ new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
// Initial state (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19):
// prettier-ignore
const IV = /* @__PURE__ */ new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
]);
// Temporary buffer, not used to store anything between runs
// Named this way because it matches specification.
const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
class SHA256 extends _sha2_js_1.SHA2 {
    constructor() {
        super(64, 32, 8, false);
        // We cannot use array here since array allows indexing by variable
        // which means optimizer/compiler cannot use registers.
        this.A = IV[0] | 0;
        this.B = IV[1] | 0;
        this.C = IV[2] | 0;
        this.D = IV[3] | 0;
        this.E = IV[4] | 0;
        this.F = IV[5] | 0;
        this.G = IV[6] | 0;
        this.H = IV[7] | 0;
    }
    get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
    }
    process(view, offset) {
        // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
        for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = (0, utils_js_1.rotr)(W15, 7) ^ (0, utils_js_1.rotr)(W15, 18) ^ (W15 >>> 3);
            const s1 = (0, utils_js_1.rotr)(W2, 17) ^ (0, utils_js_1.rotr)(W2, 19) ^ (W2 >>> 10);
            SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
        }
        // Compression function main loop, 64 rounds
        let { A, B, C, D, E, F, G, H } = this;
        for (let i = 0; i < 64; i++) {
            const sigma1 = (0, utils_js_1.rotr)(E, 6) ^ (0, utils_js_1.rotr)(E, 11) ^ (0, utils_js_1.rotr)(E, 25);
            const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
            const sigma0 = (0, utils_js_1.rotr)(A, 2) ^ (0, utils_js_1.rotr)(A, 13) ^ (0, utils_js_1.rotr)(A, 22);
            const T2 = (sigma0 + Maj(A, B, C)) | 0;
            H = G;
            G = F;
            F = E;
            E = (D + T1) | 0;
            D = C;
            C = B;
            B = A;
            A = (T1 + T2) | 0;
        }
        // Add the compressed chunk to the current hash value
        A = (A + this.A) | 0;
        B = (B + this.B) | 0;
        C = (C + this.C) | 0;
        D = (D + this.D) | 0;
        E = (E + this.E) | 0;
        F = (F + this.F) | 0;
        G = (G + this.G) | 0;
        H = (H + this.H) | 0;
        this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
        SHA256_W.fill(0);
    }
    destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        this.buffer.fill(0);
    }
}
// Constants from https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
class SHA224 extends SHA256 {
    constructor() {
        super();
        this.A = 0xc1059ed8 | 0;
        this.B = 0x367cd507 | 0;
        this.C = 0x3070dd17 | 0;
        this.D = 0xf70e5939 | 0;
        this.E = 0xffc00b31 | 0;
        this.F = 0x68581511 | 0;
        this.G = 0x64f98fa7 | 0;
        this.H = 0xbefa4fa4 | 0;
        this.outputLen = 28;
    }
}
/**
 * SHA2-256 hash function
 * @param message - data that would be hashed
 */
exports.sha256 = (0, utils_js_1.wrapConstructor)(() => new SHA256());
exports.sha224 = (0, utils_js_1.wrapConstructor)(() => new SHA224());

},{"./_sha2.js":7,"./utils.js":12}],12:[function(require,module,exports){
"use strict";
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomBytes = exports.wrapXOFConstructorWithOpts = exports.wrapConstructorWithOpts = exports.wrapConstructor = exports.checkOpts = exports.Hash = exports.concatBytes = exports.toBytes = exports.utf8ToBytes = exports.asyncLoop = exports.nextTick = exports.hexToBytes = exports.bytesToHex = exports.isLE = exports.rotr = exports.createView = exports.u32 = exports.u8 = void 0;
// We use WebCrypto aka globalThis.crypto, which exists in browsers and node.js 16+.
// node.js versions earlier than v19 don't declare it in global scope.
// For node.js, package.json#exports field mapping rewrites import
// from `crypto` to `cryptoNode`, which imports native module.
// Makes the utils un-importable in browsers without a bundler.
// Once node.js 18 is deprecated, we can just drop the import.
const crypto_1 = require("@noble/hashes/crypto");
const u8a = (a) => a instanceof Uint8Array;
// Cast array to different type
const u8 = (arr) => new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
exports.u8 = u8;
const u32 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
exports.u32 = u32;
// Cast array to view
const createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
exports.createView = createView;
// The rotate right (circular right shift) operation for uint32
const rotr = (word, shift) => (word << (32 - shift)) | (word >>> shift);
exports.rotr = rotr;
// big-endian hardware is rare. Just in case someone still decides to run hashes:
// early-throw an error because we don't support BE yet.
exports.isLE = new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;
if (!exports.isLE)
    throw new Error('Non little-endian hardware is not supported');
const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
/**
 * @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
 */
function bytesToHex(bytes) {
    if (!u8a(bytes))
        throw new Error('Uint8Array expected');
    // pre-caching improves the speed 6x
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
    }
    return hex;
}
exports.bytesToHex = bytesToHex;
/**
 * @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
 */
function hexToBytes(hex) {
    if (typeof hex !== 'string')
        throw new Error('hex string expected, got ' + typeof hex);
    const len = hex.length;
    if (len % 2)
        throw new Error('padded hex string expected, got unpadded hex of length ' + len);
    const array = new Uint8Array(len / 2);
    for (let i = 0; i < array.length; i++) {
        const j = i * 2;
        const hexByte = hex.slice(j, j + 2);
        const byte = Number.parseInt(hexByte, 16);
        if (Number.isNaN(byte) || byte < 0)
            throw new Error('Invalid byte sequence');
        array[i] = byte;
    }
    return array;
}
exports.hexToBytes = hexToBytes;
// There is no setImmediate in browser and setTimeout is slow.
// call of async fn will return Promise, which will be fullfiled only on
// next scheduler queue processing step and this is exactly what we need.
const nextTick = async () => { };
exports.nextTick = nextTick;
// Returns control to thread each 'tick' ms to avoid blocking
async function asyncLoop(iters, tick, cb) {
    let ts = Date.now();
    for (let i = 0; i < iters; i++) {
        cb(i);
        // Date.now() is not monotonic, so in case if clock goes backwards we return return control too
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
            continue;
        await (0, exports.nextTick)();
        ts += diff;
    }
}
exports.asyncLoop = asyncLoop;
/**
 * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
 */
function utf8ToBytes(str) {
    if (typeof str !== 'string')
        throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
    return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
}
exports.utf8ToBytes = utf8ToBytes;
/**
 * Normalizes (non-hex) string or Uint8Array to Uint8Array.
 * Warning: when Uint8Array is passed, it would NOT get copied.
 * Keep in mind for future mutable operations.
 */
function toBytes(data) {
    if (typeof data === 'string')
        data = utf8ToBytes(data);
    if (!u8a(data))
        throw new Error(`expected Uint8Array, got ${typeof data}`);
    return data;
}
exports.toBytes = toBytes;
/**
 * Copies several Uint8Arrays into one.
 */
function concatBytes(...arrays) {
    const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
    let pad = 0; // walk through each item, ensure they have proper type
    arrays.forEach((a) => {
        if (!u8a(a))
            throw new Error('Uint8Array expected');
        r.set(a, pad);
        pad += a.length;
    });
    return r;
}
exports.concatBytes = concatBytes;
// For runtime check if class implements interface
class Hash {
    // Safe version that clones internal state
    clone() {
        return this._cloneInto();
    }
}
exports.Hash = Hash;
const toStr = {}.toString;
function checkOpts(defaults, opts) {
    if (opts !== undefined && toStr.call(opts) !== '[object Object]')
        throw new Error('Options should be object or undefined');
    const merged = Object.assign(defaults, opts);
    return merged;
}
exports.checkOpts = checkOpts;
function wrapConstructor(hashCons) {
    const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
    const tmp = hashCons();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashCons();
    return hashC;
}
exports.wrapConstructor = wrapConstructor;
function wrapConstructorWithOpts(hashCons) {
    const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
    const tmp = hashCons({});
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = (opts) => hashCons(opts);
    return hashC;
}
exports.wrapConstructorWithOpts = wrapConstructorWithOpts;
function wrapXOFConstructorWithOpts(hashCons) {
    const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
    const tmp = hashCons({});
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = (opts) => hashCons(opts);
    return hashC;
}
exports.wrapXOFConstructorWithOpts = wrapXOFConstructorWithOpts;
/**
 * Secure PRNG. Uses `crypto.getRandomValues`, which defers to OS.
 */
function randomBytes(bytesLength = 32) {
    if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === 'function') {
        return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
    }
    throw new Error('crypto.getRandomValues must be defined');
}
exports.randomBytes = randomBytes;

},{"@noble/hashes/crypto":10}],13:[function(require,module,exports){
"use strict";
/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bytes = exports.stringToBytes = exports.str = exports.bytesToString = exports.hex = exports.utf8 = exports.bech32m = exports.bech32 = exports.base58check = exports.base58xmr = exports.base58xrp = exports.base58flickr = exports.base58 = exports.base64urlnopad = exports.base64url = exports.base64 = exports.base32crockford = exports.base32hex = exports.base32 = exports.base16 = exports.utils = exports.assertNumber = void 0;
// Utilities
/**
 * @__NO_SIDE_EFFECTS__
 */
function assertNumber(n) {
    if (!Number.isSafeInteger(n))
        throw new Error(`Wrong integer: ${n}`);
}
exports.assertNumber = assertNumber;
/**
 * @__NO_SIDE_EFFECTS__
 */
function chain(...args) {
    // Wrap call in closure so JIT can inline calls
    const wrap = (a, b) => (c) => a(b(c));
    // Construct chain of args[-1].encode(args[-2].encode([...]))
    const encode = Array.from(args)
        .reverse()
        .reduce((acc, i) => (acc ? wrap(acc, i.encode) : i.encode), undefined);
    // Construct chain of args[0].decode(args[1].decode(...))
    const decode = args.reduce((acc, i) => (acc ? wrap(acc, i.decode) : i.decode), undefined);
    return { encode, decode };
}
/**
 * Encodes integer radix representation to array of strings using alphabet and back
 * @__NO_SIDE_EFFECTS__
 */
function alphabet(alphabet) {
    return {
        encode: (digits) => {
            if (!Array.isArray(digits) || (digits.length && typeof digits[0] !== 'number'))
                throw new Error('alphabet.encode input should be an array of numbers');
            return digits.map((i) => {
                assertNumber(i);
                if (i < 0 || i >= alphabet.length)
                    throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
                return alphabet[i];
            });
        },
        decode: (input) => {
            if (!Array.isArray(input) || (input.length && typeof input[0] !== 'string'))
                throw new Error('alphabet.decode input should be array of strings');
            return input.map((letter) => {
                if (typeof letter !== 'string')
                    throw new Error(`alphabet.decode: not string element=${letter}`);
                const index = alphabet.indexOf(letter);
                if (index === -1)
                    throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
                return index;
            });
        },
    };
}
/**
 * @__NO_SIDE_EFFECTS__
 */
function join(separator = '') {
    if (typeof separator !== 'string')
        throw new Error('join separator should be string');
    return {
        encode: (from) => {
            if (!Array.isArray(from) || (from.length && typeof from[0] !== 'string'))
                throw new Error('join.encode input should be array of strings');
            for (let i of from)
                if (typeof i !== 'string')
                    throw new Error(`join.encode: non-string input=${i}`);
            return from.join(separator);
        },
        decode: (to) => {
            if (typeof to !== 'string')
                throw new Error('join.decode input should be string');
            return to.split(separator);
        },
    };
}
/**
 * Pad strings array so it has integer number of bits
 * @__NO_SIDE_EFFECTS__
 */
function padding(bits, chr = '=') {
    assertNumber(bits);
    if (typeof chr !== 'string')
        throw new Error('padding chr should be string');
    return {
        encode(data) {
            if (!Array.isArray(data) || (data.length && typeof data[0] !== 'string'))
                throw new Error('padding.encode input should be array of strings');
            for (let i of data)
                if (typeof i !== 'string')
                    throw new Error(`padding.encode: non-string input=${i}`);
            while ((data.length * bits) % 8)
                data.push(chr);
            return data;
        },
        decode(input) {
            if (!Array.isArray(input) || (input.length && typeof input[0] !== 'string'))
                throw new Error('padding.encode input should be array of strings');
            for (let i of input)
                if (typeof i !== 'string')
                    throw new Error(`padding.decode: non-string input=${i}`);
            let end = input.length;
            if ((end * bits) % 8)
                throw new Error('Invalid padding: string should have whole number of bytes');
            for (; end > 0 && input[end - 1] === chr; end--) {
                if (!(((end - 1) * bits) % 8))
                    throw new Error('Invalid padding: string has too much padding');
            }
            return input.slice(0, end);
        },
    };
}
/**
 * @__NO_SIDE_EFFECTS__
 */
function normalize(fn) {
    if (typeof fn !== 'function')
        throw new Error('normalize fn should be function');
    return { encode: (from) => from, decode: (to) => fn(to) };
}
/**
 * Slow: O(n^2) time complexity
 * @__NO_SIDE_EFFECTS__
 */
function convertRadix(data, from, to) {
    // base 1 is impossible
    if (from < 2)
        throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
    if (to < 2)
        throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
    if (!Array.isArray(data))
        throw new Error('convertRadix: data should be array');
    if (!data.length)
        return [];
    let pos = 0;
    const res = [];
    const digits = Array.from(data);
    digits.forEach((d) => {
        assertNumber(d);
        if (d < 0 || d >= from)
            throw new Error(`Wrong integer: ${d}`);
    });
    while (true) {
        let carry = 0;
        let done = true;
        for (let i = pos; i < digits.length; i++) {
            const digit = digits[i];
            const digitBase = from * carry + digit;
            if (!Number.isSafeInteger(digitBase) ||
                (from * carry) / from !== carry ||
                digitBase - digit !== from * carry) {
                throw new Error('convertRadix: carry overflow');
            }
            carry = digitBase % to;
            const rounded = Math.floor(digitBase / to);
            digits[i] = rounded;
            if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
                throw new Error('convertRadix: carry overflow');
            if (!done)
                continue;
            else if (!rounded)
                pos = i;
            else
                done = false;
        }
        res.push(carry);
        if (done)
            break;
    }
    for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
        res.push(0);
    return res.reverse();
}
const gcd = /* @__NO_SIDE_EFFECTS__ */ (a, b) => (!b ? a : gcd(b, a % b));
const radix2carry = /*@__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd(from, to));
/**
 * Implemented with numbers, because BigInt is 5x slower
 * @__NO_SIDE_EFFECTS__
 */
function convertRadix2(data, from, to, padding) {
    if (!Array.isArray(data))
        throw new Error('convertRadix2: data should be array');
    if (from <= 0 || from > 32)
        throw new Error(`convertRadix2: wrong from=${from}`);
    if (to <= 0 || to > 32)
        throw new Error(`convertRadix2: wrong to=${to}`);
    if (radix2carry(from, to) > 32) {
        throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
    }
    let carry = 0;
    let pos = 0; // bitwise position in current element
    const mask = 2 ** to - 1;
    const res = [];
    for (const n of data) {
        assertNumber(n);
        if (n >= 2 ** from)
            throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
        carry = (carry << from) | n;
        if (pos + from > 32)
            throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
        pos += from;
        for (; pos >= to; pos -= to)
            res.push(((carry >> (pos - to)) & mask) >>> 0);
        carry &= 2 ** pos - 1; // clean carry, otherwise it will cause overflow
    }
    carry = (carry << (to - pos)) & mask;
    if (!padding && pos >= from)
        throw new Error('Excess padding');
    if (!padding && carry)
        throw new Error(`Non-zero padding: ${carry}`);
    if (padding && pos > 0)
        res.push(carry >>> 0);
    return res;
}
/**
 * @__NO_SIDE_EFFECTS__
 */
function radix(num) {
    assertNumber(num);
    return {
        encode: (bytes) => {
            if (!(bytes instanceof Uint8Array))
                throw new Error('radix.encode input should be Uint8Array');
            return convertRadix(Array.from(bytes), 2 ** 8, num);
        },
        decode: (digits) => {
            if (!Array.isArray(digits) || (digits.length && typeof digits[0] !== 'number'))
                throw new Error('radix.decode input should be array of strings');
            return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
        },
    };
}
/**
 * If both bases are power of same number (like `2**8 <-> 2**64`),
 * there is a linear algorithm. For now we have implementation for power-of-two bases only.
 * @__NO_SIDE_EFFECTS__
 */
function radix2(bits, revPadding = false) {
    assertNumber(bits);
    if (bits <= 0 || bits > 32)
        throw new Error('radix2: bits should be in (0..32]');
    if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32)
        throw new Error('radix2: carry overflow');
    return {
        encode: (bytes) => {
            if (!(bytes instanceof Uint8Array))
                throw new Error('radix2.encode input should be Uint8Array');
            return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
        },
        decode: (digits) => {
            if (!Array.isArray(digits) || (digits.length && typeof digits[0] !== 'number'))
                throw new Error('radix2.decode input should be array of strings');
            return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
        },
    };
}
/**
 * @__NO_SIDE_EFFECTS__
 */
function unsafeWrapper(fn) {
    if (typeof fn !== 'function')
        throw new Error('unsafeWrapper fn should be function');
    return function (...args) {
        try {
            return fn.apply(null, args);
        }
        catch (e) { }
    };
}
/**
 * @__NO_SIDE_EFFECTS__
 */
function checksum(len, fn) {
    assertNumber(len);
    if (typeof fn !== 'function')
        throw new Error('checksum fn should be function');
    return {
        encode(data) {
            if (!(data instanceof Uint8Array))
                throw new Error('checksum.encode: input should be Uint8Array');
            const checksum = fn(data).slice(0, len);
            const res = new Uint8Array(data.length + len);
            res.set(data);
            res.set(checksum, data.length);
            return res;
        },
        decode(data) {
            if (!(data instanceof Uint8Array))
                throw new Error('checksum.decode: input should be Uint8Array');
            const payload = data.slice(0, -len);
            const newChecksum = fn(payload).slice(0, len);
            const oldChecksum = data.slice(-len);
            for (let i = 0; i < len; i++)
                if (newChecksum[i] !== oldChecksum[i])
                    throw new Error('Invalid checksum');
            return payload;
        },
    };
}
exports.utils = { alphabet, chain, checksum, radix, radix2, join, padding };
// RFC 4648 aka RFC 3548
// ---------------------
exports.base16 = chain(radix2(4), alphabet('0123456789ABCDEF'), join(''));
exports.base32 = chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'), padding(5), join(''));
exports.base32hex = chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV'), padding(5), join(''));
exports.base32crockford = chain(radix2(5), alphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ'), join(''), normalize((s) => s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1')));
exports.base64 = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'), padding(6), join(''));
exports.base64url = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), padding(6), join(''));
exports.base64urlnopad = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), join(''));
// base58 code
// -----------
const genBase58 = (abc) => chain(radix(58), alphabet(abc), join(''));
exports.base58 = genBase58('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
exports.base58flickr = genBase58('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');
exports.base58xrp = genBase58('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');
// xmr ver is done in 8-byte blocks (which equals 11 chars in decoding). Last (non-full) block padded with '1' to size in XMR_BLOCK_LEN.
// Block encoding significantly reduces quadratic complexity of base58.
// Data len (index) -> encoded block len
const XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
exports.base58xmr = {
    encode(data) {
        let res = '';
        for (let i = 0; i < data.length; i += 8) {
            const block = data.subarray(i, i + 8);
            res += exports.base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], '1');
        }
        return res;
    },
    decode(str) {
        let res = [];
        for (let i = 0; i < str.length; i += 11) {
            const slice = str.slice(i, i + 11);
            const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
            const block = exports.base58.decode(slice);
            for (let j = 0; j < block.length - blockLen; j++) {
                if (block[j] !== 0)
                    throw new Error('base58xmr: wrong padding');
            }
            res = res.concat(Array.from(block.slice(block.length - blockLen)));
        }
        return Uint8Array.from(res);
    },
};
const base58check = (sha256) => chain(checksum(4, (data) => sha256(sha256(data))), exports.base58);
exports.base58check = base58check;
const BECH_ALPHABET = /* @__PURE__ */ chain(alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), join(''));
const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
/**
 * @__NO_SIDE_EFFECTS__
 */
function bech32Polymod(pre) {
    const b = pre >> 25;
    let chk = (pre & 0x1ffffff) << 5;
    for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
        if (((b >> i) & 1) === 1)
            chk ^= POLYMOD_GENERATORS[i];
    }
    return chk;
}
/**
 * @__NO_SIDE_EFFECTS__
 */
function bechChecksum(prefix, words, encodingConst = 1) {
    const len = prefix.length;
    let chk = 1;
    for (let i = 0; i < len; i++) {
        const c = prefix.charCodeAt(i);
        if (c < 33 || c > 126)
            throw new Error(`Invalid prefix (${prefix})`);
        chk = bech32Polymod(chk) ^ (c >> 5);
    }
    chk = bech32Polymod(chk);
    for (let i = 0; i < len; i++)
        chk = bech32Polymod(chk) ^ (prefix.charCodeAt(i) & 0x1f);
    for (let v of words)
        chk = bech32Polymod(chk) ^ v;
    for (let i = 0; i < 6; i++)
        chk = bech32Polymod(chk);
    chk ^= encodingConst;
    return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
}
/**
 * @__NO_SIDE_EFFECTS__
 */
function genBech32(encoding) {
    const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;
    const _words = radix2(5);
    const fromWords = _words.decode;
    const toWords = _words.encode;
    const fromWordsUnsafe = unsafeWrapper(fromWords);
    function encode(prefix, words, limit = 90) {
        if (typeof prefix !== 'string')
            throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
        if (!Array.isArray(words) || (words.length && typeof words[0] !== 'number'))
            throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
        const actualLength = prefix.length + 7 + words.length;
        if (limit !== false && actualLength > limit)
            throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
        const lowered = prefix.toLowerCase();
        const sum = bechChecksum(lowered, words, ENCODING_CONST);
        return `${lowered}1${BECH_ALPHABET.encode(words)}${sum}`;
    }
    function decode(str, limit = 90) {
        if (typeof str !== 'string')
            throw new Error(`bech32.decode input should be string, not ${typeof str}`);
        if (str.length < 8 || (limit !== false && str.length > limit))
            throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
        // don't allow mixed case
        const lowered = str.toLowerCase();
        if (str !== lowered && str !== str.toUpperCase())
            throw new Error(`String must be lowercase or uppercase`);
        str = lowered;
        const sepIndex = str.lastIndexOf('1');
        if (sepIndex === 0 || sepIndex === -1)
            throw new Error(`Letter "1" must be present between prefix and data only`);
        const prefix = str.slice(0, sepIndex);
        const _words = str.slice(sepIndex + 1);
        if (_words.length < 6)
            throw new Error('Data must be at least 6 characters long');
        const words = BECH_ALPHABET.decode(_words).slice(0, -6);
        const sum = bechChecksum(prefix, words, ENCODING_CONST);
        if (!_words.endsWith(sum))
            throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
        return { prefix, words };
    }
    const decodeUnsafe = unsafeWrapper(decode);
    function decodeToBytes(str) {
        const { prefix, words } = decode(str, false);
        return { prefix, words, bytes: fromWords(words) };
    }
    return { encode, decode, decodeToBytes, decodeUnsafe, fromWords, fromWordsUnsafe, toWords };
}
exports.bech32 = genBech32('bech32');
exports.bech32m = genBech32('bech32m');
exports.utf8 = {
    encode: (data) => new TextDecoder().decode(data),
    decode: (str) => new TextEncoder().encode(str),
};
exports.hex = chain(radix2(4), alphabet('0123456789abcdef'), join(''), normalize((s) => {
    if (typeof s !== 'string' || s.length % 2)
        throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
    return s.toLowerCase();
}));
// prettier-ignore
const CODERS = {
    utf8: exports.utf8, hex: exports.hex, base16: exports.base16, base32: exports.base32, base64: exports.base64, base64url: exports.base64url, base58: exports.base58, base58xmr: exports.base58xmr
};
const coderTypeError = 'Invalid encoding type. Available types: utf8, hex, base16, base32, base64, base64url, base58, base58xmr';
const bytesToString = (type, bytes) => {
    if (typeof type !== 'string' || !CODERS.hasOwnProperty(type))
        throw new TypeError(coderTypeError);
    if (!(bytes instanceof Uint8Array))
        throw new TypeError('bytesToString() expects Uint8Array');
    return CODERS[type].encode(bytes);
};
exports.bytesToString = bytesToString;
exports.str = exports.bytesToString; // as in python, but for bytes only
const stringToBytes = (type, str) => {
    if (!CODERS.hasOwnProperty(type))
        throw new TypeError(coderTypeError);
    if (typeof str !== 'string')
        throw new TypeError('stringToBytes() expects string');
    return CODERS[type].decode(str);
};
exports.stringToBytes = stringToBytes;
exports.bytes = exports.stringToBytes;

},{}],14:[function(require,module,exports){
const fleetSDK = require("@fleet-sdk/serializer");
const fleetSDKcore = require("@fleet-sdk/core");

qfleetSDK = fleetSDK;
qfleetSDKcore = fleetSDKcore;

},{"@fleet-sdk/core":2,"@fleet-sdk/serializer":4}]},{},[14]);
