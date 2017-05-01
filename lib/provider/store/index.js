'use strict';
const url = require('url');

const FileStore = require('./file_store');
const RemoteStore = require('./remote_store');
const PropsdStore = require('./propsd_store');

/**
 * Factory function to determine the type of store to return.
 * @param  {Object} options
 * @param  {String} options.signal  The OS signal upon which keys should be reloaded from disk
 * @param  {String} options.path    The path (local or remote) in which keys are defined
 * @return {FileStore|RemoteStore|PropsdStore}
 */
exports.Store = (options) => {
  Log.debug('OPTIONS', options);
  const path = url.parse(options.path);

  if (options.propsd) {
    return new PropsdStore(options);
  }

  if (path.hostname) {
    return new RemoteStore(options);
  }

  return new FileStore(options);
};
