'use strict';
const Errors = require('../errors');

/**
 * A minimal HTTP router, without routes.
 * @module
 */

/**
 * A minimal HTTP router, without routes.
 */
class Layer {
  /**
   * @constructor
   */
  constructor() {
    this.layers = [];
  }

  /**
   * Add a control layer to the router
   *
   * @param  {Function} handler A control function
   */
  use(handler) {
    this.layers.push(handler);
  }

  /**
   * Build a new controller, and return a handler function that can be
   * passed directly to an HTTP Server's `request` event.
   *
   * @return {Function} A valid handler for `request` events from an HTTP.Server instance
   */
  static create() {
    const controller = new Layer();

    /* eslint-disable require-jsdoc */
    function handler(req, res) {
      controller.each(req, res);
    }
    /* eslint-enable require-jsdoc */

    handler.controller = controller;

    // Expose some of the controller's methods on the handler
    ['use'].forEach((method) => {
      handler[method] = Layer.prototype[method].bind(controller);
    });

    return handler;
  }

  /**
   * Asynchronous iterator to pass requests to each layer
   *
   * @param  {HTTP.IncomingMessage} req
   * @param  {HTTP.ServerResponse} res
   *
   * @private
   */
  each(req, res) {
    Layer.iterator(this.layers, function worker(layer, next) {
      layer(req, res, next);
    }, function complete(err) {
      if (err) {
        return Errors.handler(err, req, res);
      }

      // Return a not-found error
      Errors.handler(new Errors.NotFoundError(req.method, req.url), req, res);
    });
  }

  /**
   * Iterate serially over a set of tasks
   *
   * @param  {Array}    elements An array of tasks to pass to worker
   * @param  {Function} worker   A handler method for each task in elements. Passed
   *                             one item from elements and a callback, which may be passed an error.
   * @param  {Function} complete Called if all tasks complete, or if a task passes an error to its callback
   * @param  {Number}   position Start position. Default `0`.
   *
   * @returns {Undefined}
   * @private
   */
  static iterator(elements, worker, complete, position) {
    position = Number(position) || 0;
    if (position >= elements.length) {
      return complete();
    }

    try {
      worker(elements[position], function next(err) {
        if (err) {
          return complete(err);
        }

        Layer.iterator(elements, worker, complete, position + 1);
      });
    } catch (err) {
      complete(err);
    }
  }
}

module.exports = Layer;
