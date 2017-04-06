'use strict';

const proxy = require('express-http-proxy');
const bytes = require('bytes');
const Errors = require('../errors');
const metrics = require('../metrics');

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

  return function handleProxy(req, res, next) {
    let proxyRequestTime = null;

    /* We don't want express-http-proxy to write the response for us because we
     * need to decorate it with some metrics and make sure that if an error comes
     * back we pass it to the error handlers correctly.
     */
    return proxy(`${context.hostname}:${context.port}`, {
      preserveHostHdr: true,
      parseReqBody: false,
      limit: Config.get('service:limit'),
      decorateRequest: (proxyReq, originalReq) => {
        Log.debug(`Forwarding request to ${context.hostname}:${context.port}${originalReq.url}`, {
          identifier: originalReq.identifier,
          method: originalReq.method,
          path: originalReq.url,
          size: bytes(parseInt(originalReq.headers['content-length'], 10))
        });

        // Submit metrics for outgoing proxy requests
        Metrics.increment('proxy.request.outgoing');
        Metrics.gauge('proxy.request.active', 1);
        proxyRequestTime = Date.now();
      },
      intercept: (rsp, data, req, res) => {
        Metrics.gauge('proxy.request.active', -1);

        if (rsp.statusCode >= 200 && rsp.statusCode < 400) {
          metrics.generateMetrics('proxy.response.success', proxyRequestTime);

          res._body = data;
          next();
        } else {
          metrics.generateMetrics('proxy.response.error', proxyRequestTime);

          next(new Errors(rsp.statusCode, rsp.statusMessage, {
            identifier: req.identifier
          }));
        }
      }
    })(req, res, next);
  };
};
