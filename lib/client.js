'use strict';

const Crypto = require('crypto');
const Signature = require('./signature');
const rp = require('request-promise-native');
const checkArgument = require('conditional').checkArgument;

/**
 * A Turnstile client
 * @class
 */
class TurnstileClient {
  /**
   * @constructor
   * @param {Object} conf
   * @param {String} conf.digest
   * @param {Buffer} conf.payload
   * @param {String} conf.secret
   * @param {(HTTP.IncomingMessage|Url)} request
   */
  constructor(conf, request) {
    checkArgument(conf.digest);
    checkArgument(conf.payload);
    checkArgument(conf.secret);

    this._payload = conf.payload;
    this._algorithm = conf.digest.toUpperCase();
    this._secret = conf.secret;

    this._request = {
      uri: request.href,
      method: request.method,
      headers: Object.assign(request.headers, {
        'content-length': this._payload.length,
        digest: `${this._algorithm}=${this._hmac}`
      }),
      resolveWithFullResponse: true,
      body: this._payload
    };

    const signature = new Signature(this._algorithm, request);

    signature.sign(this._secret);

    Log.debug(`Request: identity ${request.identity}`);
    Log.debug(`Request: signature ${signature.signature}`);

    const authorization = Buffer.from(`${request.identity}:${signature.signature}`, 'utf8').toString('base64');

    this._request.headers.authorization = `Rapid7-HMAC-V1-${this._algorithm} ${authorization}`;
    Log.debug(`Request: authorization ${this._request.headers.authorization}`);
  }

  /**
   * Generate an HMAC based on the provided algorithm
   *
   * @return {string|Buffer}
   */
  get _hmac() {
    const hash = Crypto.createHash(this._algorithm);

    hash.update(this._payload);

    return hash.digest('base64');
  }

  /**
   * Issue the request
   * @return {Promise}
   */
  request() {
    return rp(this._request);
  }
}

module.exports = TurnstileClient;
