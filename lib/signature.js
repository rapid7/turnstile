'use strict';
const Crypto = require('crypto');
const Errors = require('./errors');

const SP = ' ';
const LF = '\n';

/**
 * A generic HMAC sign/verify base for HTTP requests
 */
class Signature {
  /**
   * @param  {String} algorithm  The hash algorithm to use for signature generation
   * @param  {HTTP.IncomingMessage} request The request object to sign
   */
  constructor(algorithm, request) {
    this.algorithm = algorithm;
    const identifier = this.identifier = request.identifier;

    this.method = request.method.toUpperCase();
    Log.debug(`Using method ${this.method}`, {identifier});

    if (request.hasOwnProperty('url')) { this.uri = request.url; }
    else if (request.hasOwnProperty('path')) { this.uri = request.path; }
    else { throw new Errors.RequestError('Missing URI field'); }
    Log.debug(`Using URI ${this.uri}`, {identifier});

    this.host = request.headers.host;
    Log.debug(`Using host ${this.host}`, {identifier});

    this.date = String(request.date.getTime());
    Log.debug(`Using date ${this.date}`, {identifier});

    this.identity = request.identity;
    Log.debug(`Using identity ${this.identity}`, {identifier});

    this.digest = request.headers.digest;
    Log.debug(`Using digest ${this.digest}`, {identifier});
  }

  /**
   * Sign generate a body from configured parameters and sign with a secret
   *
   * @param  {String} secret The signing secret
   * @return {String}        A base64 digest of the signature
   */
  sign(secret) {
    const signer = Crypto.createHmac(this.algorithm, secret);

    signer.update(this.method + SP + this.uri + LF, 'utf8');
    signer.update(this.host + LF, 'utf8');
    signer.update(this.date + LF, 'utf8');
    signer.update(this.identity + LF, 'utf8');
    signer.update(this.digest + LF, 'utf8');

    // TODO Additional Headers

    return (this.signature = signer.digest('base64'));
  }

  /**
   * Verify another signature. `sign` must be called first to generate the
   * signature to test against!
   *
   * @param  {String} signature The signature to verify
   * @throws {Errors.AuthorizationError} If signatures does not match.
   */
  verify(signature) {
    if (signature !== this.signature) {
      throw new Errors.AuthorizationError('Invalid authentication factors', {
        identifier: this.identifier
      });
    }
  }
}

module.exports = Signature;
