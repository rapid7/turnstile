'use strict';
const url = require('url');
const Crypto = require('crypto');

const Errors = require('../../errors');
const Signature = require('../../signature');

const REQUIRED_HEADERS = ['authorization', 'date', 'digest', 'host'];
const DEFAULT_SKEW = 5000;
const AUTHN_PROTOCOL = 'Rapid7-HMAC-V1-SHA256';

const FileStore = require('./file_store');
const RemoteStore = require('./remote_store');

/**
 * Factory function to determine the type of store to return.
 * @param  {Object} options
 * @param  {String} options.signal  The OS signal upon which keys should be reloaded from disk
 * @param  {String} options.path    The path (local or remote) in which keys are defined
 * @return {FileStore|RemoteStore}
 */
const Store = exports.Store = (options) => {
  Log.debug('OPTIONS', options);
  const path = url.parse(options.path);

  if (path.hostname) {
    return new RemoteStore(options);
  }

  return new FileStore(options);
};

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

const digest =

/**
 * Validate correctness of the request's digest header
 *
 * @param  {String} algorithm The configured hashing algorithm
 * @param  {HTTP.IncomingMessage} request The request to validate
 *
 * @throws {Errors.AuthorizationError}    If the digest header does not match the request body
 */
exports.digest = function(algorithm, request) {
  const body = request.body.toString();
  const digestHeader = request.headers.digest;

  const hash = Crypto.createHash(algorithm);

  hash.update(body, 'utf8');
  const signature = hash.digest('base64');

  if (digestHeader !== `${algorithm}=${signature}`) {
    throw new Errors.AuthorizationError('Digest header does not match request body', {
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

  const parameters = Buffer.from(parts[1], 'base64').toString('utf8').split(':'); // eslint-disable-line new-cap

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

  const db = Store(options.db);

  db.on('error', (err) => Log.error(err));

  Log.info(`Using local authentication controller with database ${db.path}`);

  // Return a request handler
  return function local(req, res, next) {
    const identifier = req.identifier;

    Log.debug('Enforcing local token validator', {
      identifier
    });

    validate(skew, req);
    digest(algorithm, req);
    authorization(req);

    const signature = new Signature(algorithm, req);

    signature.sign(db.lookup(req));
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
