'use strict';
const UUID = require('node-libuuid');

/**
 * Read or generate a correlation identifier for logging and debugging
 * @module
 */

/**
 * Create a control layer function
 *
 * @param  {Object} options
 * @param  {String} options.header  The header used to pass correlation ID values between services
 * @return {Function}               A control layer for the router
 */
exports.create = function(options) {
  options = Object.assign({}, options);

  if (!options.hasOwnProperty('header')) {
    throw ReferenceError('Missing required parameter `header`!');
  }

  Log.info(`Using Correlation-Identifier ${options.header}`);
  const header = options.header;

  return function handle(req, res, next) {
    if (!req.headers.hasOwnProperty(header)) {
      req.identifier = req.headers[header] = UUID.v4();
      Log.debug(`Setting Correlation-Identifier header ${header}:${req.identifier}`, {
        identifier: req.identifier
      });

      return next();
    }

    req.identifier = req.headers[header];
    Log.debug(`Found Correlation-Identifier header ${header}:${req.identifier}`, {
      identifier: req.identifier
    });

    next();
  };
};
