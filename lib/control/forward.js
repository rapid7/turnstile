'use strict';

const proxy = require('express-http-proxy');

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

  const context = {
    port: Number(options.port),
    hostname: options.hostname
  };

  if (!context.port) {
    throw new TypeError('Option `port` must be a number');
  }
  Log.info(`Using HTTP forwarder to ${context.hostname}:${context.port}`);

  return proxy(`${context.hostname}:${context.port}`, {
    preserveHostHdr: true,
    parseReqBody: false,
    limit: '10mb',
    decorateRequest: (proxyReq, originalReq) => {
      Log.debug(`Forwarding request to ${context.hostname}:${context.port}${originalReq.url}`, {
        identifier: originalReq.identifier,
        method: originalReq.method,
        path: originalReq.url
      });
    }
    // intercept: (rsp, data, req, res, callback) => {
    //   // This allows us to intercept the response and do something with it.
    //   callback(null, data);
    // }
  });
};
