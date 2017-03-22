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
   * @return {String}                     The key's secret, if the key-id is defined
   * @throws {Errors.AuthorizationError}  If the requested key-id is not defined
   */
  lookup(req) {
    const identity = req.identity;
    const identifier = req.identifier;

    if (!this.keys.hasOwnProperty(identity)) {
      throw new Errors.AuthorizationError('Invalid authentication factors', {
        identifier
      });
    }

    return this.keys[identity];
  }
}

module.exports = Store;
