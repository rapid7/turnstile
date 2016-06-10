'use strict';

/*
 * This check fails for assignment of values on an Object argument, and does not
 * allow for argument type-checking/default setters. */
/* eslint-disable no-param-reassign */

const HTTP = require('http');
const NOT_MODIFIED = 304;

/**
 * Proxy requests to an HTTP server
 *
 * @module Forward
 */

/**
 * Create a control layer function
 *
 * @param  {Object} options
 * @param  {Number} options.port      The service's port number. Required.
 * @param  {String} options.hostname  The service's hostname. Default `localhost`
 *
 * @return {Function}                 A control layer for the router
 */
function create(options) {
  options = Object.assign({
    hostname: 'localhost'
  }, options);

  const port = Number(options.port);
  const hostname = options.hostname;
  const agent = new HTTP.Agent({
    keepAlive: true
  });

  if (!port) { throw new TypeError('Option `port` must be a number'); }

  return function handle(req, res, next) {
    const forward = HTTP.request({
      method: req.method,
      path: req.url,
      headers: req.headers,

      agent, hostname, port
    });

    forward.on('error', next);
    forward.on('response', function response(reverse) {
      res.writeHead(reverse.statusCode, reverse.statusMessage, reverse.headers);

      // HTTP.ClientResponse does not emit end for 304 responses.
      if (reverse.statusCode === NOT_MODIFIED) {
        return res.end();
      }

      reverse.pipe(res);
    });

    req.on('aborted', function aborted() {
      forward.abort();
    });

    req.pipe(forward);
  };
}
exports.create = create;
