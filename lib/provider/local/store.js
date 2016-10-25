'use strict';
const EventEmitter = require('events').EventEmitter;
const FS = require('fs');
const Path = require('path');

const Errors = require('../../errors');

/**
 * In-memory key database
 * @module
 */

/**
 * A local key store
 * @extends EventEmitter
 */
class Store extends EventEmitter {
  /**
   * @param  {Object} options
   * @param  {String} options.signal  The OS signal upon which keys should be reloaded from disk
   * @param  {String} options.path    The local file in which keys are defined
   */
  constructor(options) {
    options = Object.assign({
      signal: 'SIGHUP',
      path: 'data/keys.json'
    }, options);
    super();

    this.signal = options.signal.toUpperCase();
    this.path = Path.resolve(__dirname, '../../../', options.path);

    process.on(this.signal, () => this.load());
    setImmediate(() => this.load());
  }

  /**
   * Load keys from a file on disk
   */
  load() {
    FS.readFile(this.path, (err, content) => {
      if (err) { return this.emit('error', err); }

      try {
        this.keys = JSON.parse(content.toString('utf8'));
        this.emit('update');
      } catch (e) {
        this.emit('error', err);
      }
    });
  }

  /**
   * Look up a key's secret by key-id
   *
   * @param  {String} key                 The key-id to lookup
   * @return {String}                     The key's secret, if the key-id is defined
   * @throws {Errors.AuthorizationError}  If the requested key-id is not defined
   */
  lookup(key) {
    if (!this.keys.hasOwnProperty(key)) {
      throw new Errors.AuthorizationError('Invalid authentication factors');
    }

    return this.keys[key];
  }
}
module.exports = Store;
