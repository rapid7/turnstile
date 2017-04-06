'use strict';

const StatsD = require('hot-shots');

if (!global.Metrics) {
  global.Metrics = new StatsD(Object.assign({}, Config.get('metrics:client'), {
    errorHandler: (error) => {
      Log.error(error);
    },
    mock: !Config.get('metrics:enabled')
  }));
}
const metrics = global.Metrics;

/**
 * Send metrics to DogStatsD
 *
 * @param {String} metric - The name of the metric to send to DogStatsD
 * @param {Number} initialized - when the request was initialized (ms since the epoch)
 */
const responseMetrics = exports.generateMetrics = (metric, initialized) => {
  metrics.increment(metric);
  metrics.histogram(`${metric}.response_time`, `${Date.now() - initialized}ms`);
};

/**
 * Middleware handler for successful response metrics
 *
 * @param {HTTP.IncomingMessage} req
 * @param {HTTP.ServerResponse} res
 * @param {Function} next
 */
exports.responseHandler = (req, res, next) => {
  responseMetrics('response.success', req._begin);
  metrics.gauge('request.active', -1);

  next();
};

/**
 * Middleware handler for error response metrics
 *
 * @param {Error} err
 * @param {HTTP.IncomingMessage} req
 * @param {HTTP.ServerResponse} res
 * @param {Function} next
 */
exports.errResponseHandler = (err, req, res, next) => {
  responseMetrics('response.error', req._begin);
  metrics.gauge('request.active', -1);

  next(err);
};
