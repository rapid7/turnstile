'use strict';
const FS = require('fs');
const Path = require('path');

const Store = require('./store');

/**
 * In-memory key database
 * @module
 */

/**
 * A local key store
 * @extends Store
 */
class FileStore extends Store {
  /**
   * @param  {Object} options
   * @param  {String} options.signal  The OS signal upon which keys should be reloaded from disk
   * @param  {String} options.path    The local file in which keys are defined
   */
  constructor(options) {
    options = Object.assign({
      path: 'data/keys.json'
    }, options);
    super(options);

    this.path = Path.resolve(__dirname, '../../../', options.path);

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
        this.emit('error', e);
      }
    });
  }
}
module.exports = FileStore;
