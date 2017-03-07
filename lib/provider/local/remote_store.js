'use strict';

const rp = require('request-promise-native');

const Store = require('./store');

/**
 * In-memory key database
 * @module
 */

/**
 * A remote HTTP endpoint-based key store
 * @extends EventEmitter
 */
class RemoteStore extends Store {
  /**
   * @param  {Object} options
   * @param  {String} options.signal  The OS signal upon which keys should be reloaded from disk
   * @param  {String} options.path    The local file in which keys are defined
   */
  constructor(options) {
    super(options);

    this.path = options.path;

    setImmediate(() => this.load());
  }

  /**
   * Load keys from a remote HTTP endpoint
   */
  load() {
    rp({
      uri: this.path,
      json: true
    }).then((data) => {
      this.keys = JSON.parse(data);
      this.emit('update');
    }).catch((err) => {
      this.emit('error', err);
    });
  }
}

module.exports = RemoteStore;
