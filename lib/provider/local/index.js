'use strict';
const Errors = require('../../errors');
const Signature = require('../../signature');

const REQUIRED_HEADERS = ['authorization', 'date', 'digest', 'host'];
const DEFAULT_SKEW = 5000;
const AUTHN_PROTOCOL = 'Rapid7-HMAC-V1-SHA256';

const FileStore = exports.FileStore = require('./file_store');

/**
 * Validate a request's authentication headers against a local database of keys
 * @module provider/local
 */

const validate =

/**
 * Validate correctness of a request's parameters before trying to verify its signature
 *
 * @param  {Number} skew                  Maximum allowed skew, in milliseconds, between the server's time
 *                                        and the request's Date header
 * @param  {HTTP.IncomingMessage} request The request to validate
 *
 * @throws {Errors.RequestError}          If a required header is missing
 * @throws {Errors.AuthorizationError}    If the Data header skew is too large
 */
exports.validate = function(skew, request) {
  REQUIRED_HEADERS.forEach(function check(header) {
    if (!request.headers.hasOwnProperty(header)) {
      throw new Errors.RequestError(`Missing header ${header}`, {
        identifier: request.identifier
      });
    }
  });

  // Validate Date header
  request.date = new Date(request.headers.date);
  if (isNaN(request.date)) {
    throw new Errors.RequestError('Invalid Date header', {
      identifier: request.identifier
    });
  }

  // Verify that the request date is close to $NOW
  const now = Date.now();

  Log.debug(`Date skew ${now - request.date.getTime()}ms`);
  if (Math.abs(now - request.date.getTime()) > skew) {
    throw new Errors.AuthorizationError('Request date skew is too large', {
      identifier: request.identifier
    });
  }
};

const authorization =

/**
 * Parse the Authorization header and attach parameters to the request object
 *
 * @param  {HTTP.IncomingMessage} request The request to validate
 */
exports.authorization = function(request) {
  const parts = request.headers.authorization.split(' ');

  if (!parts.length || parts.length !== 2) {
    throw new Errors.RequestError('Invalid Authorization header', {
      identifier: request.identifier
    });
  }

  if (parts[0] !== AUTHN_PROTOCOL) {
    throw new Errors.AuthorizationError(`Invalid authentication protocol ${parts[0]}`, {
      identifier: request.identifier
    });
  }

  Log.debug(`Using Authorization Scheme: ${parts[0]}`, {
    identifier: request.identifier
  });

  /*
   * TODO The `Buffer()`` constructor is going to become deprecated, but
   * `Buffer.from(str, enc)` isn't fully implemented yet. Need to replace this
   * call someday.
   */
  const parameters = Buffer(parts[1], 'base64').toString('utf8').split(':'); // eslint-disable-line new-cap

  if (!parameters.length || parameters.length !== 2) {
    throw new Errors.AuthorizationError('Invalid authentication parameters', {
      identifier: request.identifier
    });
  }

  request.identity = parameters[0];
  request.signature = parameters[1];
};

/**
 * Create a control layer function
 *
 * @param  {Object} options
 * @param  {String} options.algorithm   The hash algorithm to use for signature generation
 * @param  {Number} options.skew        The maximum time-skew, in milliseconds,
 *                                      allowed between the server's time and the request's Date header
 * @param  {Object} options.db          Local/Store constructor options ({@link module:provider/local/store})
 *
 * @return {Function}                   A control layer for the router
 */
exports.authn = function(options) {
  options = Object.assign({
    algorithm: 'SHA256',
    skew: DEFAULT_SKEW
  }, options);

  // Sign/verify parameters
  const algorithm = options.algorithm;
  const skew = Number(options.skew);

  const db = new FileStore(options.db);

  db.on('error', (err) => Log.error(err));

  Log.info(`Using local authentication controller with database ${db.path}`);

  // Return a request handler
  return function handle(req, res, next) {
    const identifier = req.identifier;

    Log.debug('Enforcing local token validator', {
      identifier
    });

    validate(skew, req);
    // TODO Validate body digest signature
    // digest(req);
    authorization(req);

    const signature = new Signature(algorithm, req);

    signature.sign(db.lookup(req.identity));
    Log.debug(`Request Signature: ${req.signature}`, {
      identifier
    });
    Log.debug(`Challenge Signature: ${signature.signature}`, {
      identifier
    });

    signature.verify(req.signature);
    Log.debug('Authenticated. Forwarding request', {
      identifier
    });

    next();
  };
};
