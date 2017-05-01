'use strict';

const Crypto = require('crypto');
const Errors = require('../../errors');
const Signature = require('../../signature');
const Store = require('../store').Store;
const REQUIRED_HEADERS = ['authorization', 'date', 'digest', 'host'];
const AUTHN_PROTOCOL = 'Rapid7-HMAC-V1-SHA256';
const DEFAULT_SKEW = 5000;

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
  /** Because the spec was formatted in such a way as to make the date header
   * section ambiguous, we are allowing some leniency in how dates are formatted.
   *
   * We will attempt to parse datetime strings first in keeping backwards
   * compatibility. If that fails, we attempt to parse as if the header was
   * a string representation of an integer. If that fails, we consider the
   * header to be invalid.
   */
  let date = new Date(request.headers.date);

  // Passing an invalid date string to the Date constructor results in a
  // Date object equal to NaN.
  if (isNaN(date)) {
    // If the date string is invalid, we assume it's the number of milliseconds
    // since the epoch and attempt to parse it as such.
    date = new Date(parseInt(request.headers.date, 10));
    // If it's still not a valid date object then we throw an error.
    if (isNaN(date)) {
      throw new Errors.RequestError('Invalid Date header', {
        identifier: request.identifier
      });
    }
  } else {
    // In cases where we find a valid datetime string we want to log that our
    // date object was created this way with information to identify the client.
    Log.warn('Date string deprecation notice: use millisecond-precision epoch time instead', {
      identifier: request.identifier,
      ip: request.headers['x-forwarded-for'] || request.connection.remoteAddress
    });
  }
  request.date = date;

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

  if (!Signature.constantTimeSafeEquals(Buffer.from(digestHeader), Buffer.from(`${algorithm}=${signature}`))) {
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

  Log.info(`Using authentication controller with database: ${db.path}`);

  // Return a request handler
  return function local(req, res, next) {
    const identifier = req.identifier;

    Log.debug('Enforcing token validator', {
      identifier
    });

    validate(skew, req);
    digest(algorithm, req);
    authorization(req);

    db.lookup(req).then((identity) => {
      // Make sure we're working with an array
      if (typeof identity === 'string') {
        identity = [identity];
      }

      // We can prep this generic AuthorizationError to throw in case we don't
      // end up with a valid signature and for some reason `signature.verify`
      // doesn't throw.
      let error = new Errors.AuthorizationError('Invalid authentication factors', {
        identifier
      });

      const valid = identity.some((id) => {
        const signature = new Signature(algorithm, req);

        signature.sign(id);

        Log.debug(`Request Signature: ${req.signature}`, {
          identifier
        });
        Log.debug(`Challenge Signature: ${signature.signature}`, {
          identifier
        });

        try {
          signature.verify(req.signature);
        } catch (err) {
          error = err;

          return false;
        }

        Log.debug('Authenticated. Forwarding request', {
          identifier
        });

        // If we haven't thrown (the key is valid) we return true
        // and Array.some will consider its job fulfilled and won't
        // continue iterating.
        return true;
      });

      if (valid) {
        return next();
      }

      throw error;
    }).catch((err) => {
      next(err);
    });
  };
};
