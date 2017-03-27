'use strict';
const EventEmitter = require('events').EventEmitter;

const Errors = require('../../errors');

/**
 * In-memory key database
 * @module
 */

/**
 * An abstract store extendable by implementations
 * @extends EventEmitter
 * @abstract
 */
class Store extends EventEmitter {
  /**
   * @param  {Object} options
   * @param  {String} options.signal  The OS signal upon which keys should be reloaded from disk
   */
  constructor(options) {
    options = Object.assign({
      signal: 'SIGHUP'
    }, options);
    super();

    this.options = options;
    this.signal = options.signal.toUpperCase();

    process.on(this.signal, () => this.load());
  }

  /**
   * Load keys
   * @throws {Error} description
   */
  load() {
    throw new Errors.NotImplementedError('Method `load` must be implemented in inheriting class.');
  }

  /**
   * Look up a key's secret by key-id
   *
   * @param  {HTTP.IncomingMessage} req   The key-id to lookup
   * @return {Promise<String|Errors.AuthorizationError>}  The key's secret or an error if the requested key-id is not
   * defined
   */
  lookup(req) {
    const identity = req.identity;
    const identifier = req.identifier;

    return new Promise((resolve, reject) => {
      if (!this.keys.hasOwnProperty(identity)) {
        reject(new Errors.AuthorizationError('Invalid authentication factors', {
          identifier
        }));
      }

      resolve(this.keys[identity]);
    });
  }
}

module.exports = Store;
