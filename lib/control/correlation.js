'use strict';
const UUID = require('node-libuuid');

exports.create = function create(options) {
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
