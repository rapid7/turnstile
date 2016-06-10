'use strict';

/*
 * This check fails for assignment of values on an Object argument, and does not
 * allow for argument type-checking/default setters. */
/* eslint-disable no-param-reassign */

const STATUS_CODES = require('http').STATUS_CODES;

const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const INTERNAL_SERVER_ERROR = 500;

const WHITE_SPACE = /[^a-zA-Z0-9]/g;
const NOTHING = String();

/**
 * A generic HTTP Error
 */
class HTTPError extends Error {
  /**
   * @param  {Number} code     An HTTP status code
   * @param  {String} message  An error message
   * @param  {Object} metadata Contextual data to be included in the error
   */
  constructor(code, message, metadata) {
    super();

    this.code = Number(code) || INTERNAL_SERVER_ERROR;
    this.name = STATUS_CODES[this.code].replace(WHITE_SPACE, NOTHING);
    this.message = message || STATUS_CODES[this.code];
    this.metadata = metadata || {};
  }

  /**
   * Generate a JSON serializable Object
   *
   * @return {Object} A JSON-serializable Object
   */
  toJSON() {
    return ({
      code: this.code,
      name: this.name,
      message: this.message,
      metadata: this.metadata
    });
  }

  /**
   * An error renderer control layer
   *
   * @param  {Error}                err  An Error that manifested in the request
   * @param  {HTTP.IncomingMessage} req  The HTTP Request handle
   * @param  {HTTP.ServerResponse}  res  The HTTP Response handle
   */
  static handler(err, req, res) {
    // Wrap instances of Error in an HTTPError
    if (!(err instanceof HTTPError)) {
      err = new HTTPError(err.code || INTERNAL_SERVER_ERROR, err.message);
    }

    const content = Buffer(JSON.stringify(err, null, 2), 'utf8'); // eslint-disable-line new-cap

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Length', content.length);
    res.writeHead(err.code || INTERNAL_SERVER_ERROR);

    res.write(content);
    res.end();
  }
}

exports = module.exports = HTTPError;

/**
 * An HTTP 400 response
 *
 * @class
 * @name HTTPError.RequestError
 * @extends HTTPError
 */
class RequestError extends HTTPError {
  constructor(reason) {
    super(BAD_REQUEST, null, {
      reason
    });
  }
}

exports.RequestError = RequestError;

/**
 * An HTTP 401 response
 *
 * @class
 * @name HTTPError.AuthorizationError
 * @extends HTTPError
 */
class AuthorizationError extends HTTPError {
  constructor(reason) {
    super(UNAUTHORIZED, null, {
      reason
    });
  }
}

exports.AuthorizationError = AuthorizationError;

/**
 * An HTTP 404 response
 *
 * @class
 * @name HTTPError.NotFoundError
 * @extends HTTPError
 */
class NotFoundError extends HTTPError {
  constructor(method, path) {
    super(NOT_FOUND, null, {
      method, path
    });
  }
}

exports.NotFoundError = NotFoundError;
