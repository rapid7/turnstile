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
      req.headers[header] = UUID.v4();
      Log.debug(`Setting Correlation-Identifier header ${header}:${req.headers[header]}`);
    }

    req.identifier = req.headers[header];
    next();
  };
};
