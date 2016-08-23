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

    this.method = request.method;
    this.uri = request.url;
    this.host = request.headers.host;
    this.date = request.date.getTime().toString(10);
    this.identity = request.identity;
    this.digest = request.headers.digest;
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
      throw new Errors.AuthorizationError('Invalid authentication factors');
    }
  }
}

module.exports = Signature;
