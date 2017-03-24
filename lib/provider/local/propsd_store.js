'use strict';

const rp = require('request-promise-native');
const assert = require('assert');

const Store = require('./store');

/**
 * In-memory key database
 * @module
 */

/**
 * A Propsd endpoint-based key store
 *
 * @link http://github.com/rapid7/propsd
 * @extends Store
 */
class PropsdStore extends Store {
  /**
   * @param  {Object} options
   * @param  {String} options.signal  The OS signal upon which keys should be reloaded from disk
   * @param  {String} options.path    The Propsd URL
   * @param  {String} options.prefix  The key prefix Turnstile should use to identify keys
   * @param  {String} options.delimiter The delimiter used to separate the prefix from the identity
   */
  constructor(options) {
    super(options);

    this.prefix = options.prefix;
    this.path = options.path;
    this.delimiter = options.delimiter;

    this.load();
  }

  /**
   * Load keys from a remote HTTP endpoint
   */
  load() {
    rp({
      uri: this.path,
      json: true
    }).then((data) => {
      assert(typeof data === 'object');
      // Keys are the result of filtering the Propsd property set by the prefix, then removing the prefix from the
      // key leaving an object of `identity: secret`.
      this.keys = Object.keys(data)
        .filter((key) => key.startsWith(this.prefix))
        .reduce((obj, key) => {
          let resultKey = key;

          if (this.prefix) {
            // Only replace the prefix and delimiter if they exist
            resultKey = key.replace(this.prefix, '').replace(this.delimiter, '');
          }

          obj[resultKey] = data[key];

          return obj;
        }, {});
      this.emit('update');
    }).catch((err) => {
      this.emit('error', err);
    });
  }
}

module.exports = PropsdStore;
