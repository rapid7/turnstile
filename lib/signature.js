'use strict';
const Crypto = require('crypto');
const Errors = require('./errors');

/**
 * A generic HMAC sign/verify base for HTTP requests
 */
class Signature {
  /**
   * @param  {String} algorithm  The hash algorithm to use for signature generation
   * @param  {Object} parameters Key-value pairs of parameters that will be signed
   */
  constructor(algorithm, parameters) {
    this.algorithm = algorithm;
    this.parameters = parameters || {};
  }

  /**
   * Sign generate a body from configured parameters and sign with a secret
   *
   * @param  {String} secret The signing secret
   * @return {String}        A base64 digest of the signature
   */
  sign(secret) {
    const signer = Crypto.createHmac(this.algorithm, secret);

    Object.keys(this.parameters).sort().forEach((key) => {
      signer.update(`${key}: ${this.parameters[key]}\n`);
    });

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
