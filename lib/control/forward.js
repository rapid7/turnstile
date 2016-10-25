'use strict';

const HTTP = require('http');

/**
 * Proxy requests to an HTTP server
 * @module
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
exports.create = function(options) {
  options = Object.assign({
    hostname: 'localhost'
  }, options);

  const port = Number(options.port);
  const hostname = options.hostname;
  const agent = new HTTP.Agent({
    keepAlive: true
  });

  if (!port) { throw new TypeError('Option `port` must be a number'); }

  Log.info(`Using HTTP forwarder to ${hostname}:${port}`);

  return function handle(req, res, next) {
    Log.debug(`Forwarding request to ${hostname}:${port}${req.url}`, {
      identifier: req.identifier,
      method: req.method,
      path: req.url
    });

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
      if (reverse.statusCode === 304) {
        return res.end();
      }

      reverse.pipe(res);
    });

    req.on('aborted', function aborted() {
      forward.abort();
    });

    req.pipe(forward);
  };
};
