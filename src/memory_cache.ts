"use strict";

const DEFAULT_SIZE = 50;
const DEFAULT_EXPIRE_TIME_MS = 10000;

/**
 * @param  {integer} size
 * @param  {integer} expireTime
 * @name MemoryCache
 * @constructor
 */
function MemoryCache(size, expireTime) {
  this._cache = Object.create(null);
  this._size = size || DEFAULT_SIZE;
  this._freeSpace = this._size;
  this._timeouts = Object.create(null);
  this._expireTime = expireTime || DEFAULT_EXPIRE_TIME_MS;
}

/**
 * Returns cache value for the specified key and refresh timing.
 *
 * @param {String} key
 * @returns {*} Value or `undefined` if value does not exist.
 */
MemoryCache.prototype.get = function (key) {
  const value = this._cache[key];

  if (value) {
    this._timeouts[key] = new Date().getTime();
  }

  return value;
};

/**
 * Assigns value for the specified key.
 *
 * @param {String} key
 * @param {*} value
 */
MemoryCache.prototype.set = function (key, value) {
  if (this._cache[key]) {
    this._cache[key] = value;
    this._timeouts[key] = new Date().getTime();
  } else {
    if (this._freeSpace === 0) {
      // find an expired element or delete one randomly
      const now = new Date().getTime();
      let candidate;

      const allKeys = Object.keys(this._cache);

      // choose expired
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const _this = this;
      allKeys.every(function (tmpKey) {
        if (now - _this._timeouts[tmpKey] > _this._expireTime) {
          candidate = tmpKey;
          return false;
        }

        return true;
      });

      // choose random candidate
      if (!candidate) {
        candidate = allKeys[Math.floor(Math.random() * this._size)];
      }

      this.delete(candidate);
    }

    this._cache[key] = value;
    this._timeouts[key] = new Date().getTime();
    this._freeSpace -= 1;
  }
};

/**
 * Deletes value for the specified key.
 *
 * @param {String} key
 */
MemoryCache.prototype.delete = function (key) {
  this._cache[key].dispose();

  delete this._cache[key];
  delete this._timeouts[key];
  this._freeSpace += 1;
};

/**
 * Clears the whole cache storage.
 */
MemoryCache.prototype.clear = function () {
  this._cache = Object.create(null);
  this._freeSpace = this._size;
  this._timeouts = Object.create(null);
};

export default MemoryCache;
