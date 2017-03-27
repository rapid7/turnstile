'use strict';

const Crypto = require('crypto');
const Signature = require('../../lib/signature');
const rp = require('request-promise-native');

/**
 */






/**
 * Generate a digest signature for the request's headers
 *
 * @param  {String} algorithm Hash algorithm
 * @param  {Buffer} payload   Request body
 * @return {String}           Base64-encoded hash signature
 */
const digest = exports.digest = (algorithm, payload) => {
  const hash = Crypto.createHash(algorithm);

  return new Promise((resolve, reject) => {
    hash.update(payload);
    resolve(hash.digest('base64'));
  });
};

/**
 * Make an HTTP request
 *
 * @param  {Object} params Request parameters. @see {@link https://nodejs.org/
 *                         dist/latest-v4.x/docs/api/http.html#http_http_request_options_callback}
 * @return {Promise}
 */
const request = exports.request = (params) => {
  const algorithm = Config.get('digest').toUpperCase();

  return read(Config.get('payload'))
    .then((payload) => {
      params.payload = payload;

      return payload;
    }).then((payload) => {
      return digest(algorithm, payload);
    }).then((signature) => {
      params.headers.digest = `${algorithm}=${signature}`;
    }).then(() => {
      const signature = new Signature(algorithm, params);

      signature.sign(Config.get('secret'));
      Log.debug(`Request: identity ${params.identity}`);
      Log.debug(`Request: signature ${signature.signature}`);

      const authorization = Buffer(`${params.identity}:${signature.signature}`, 'utf8').toString('base64');

      params.headers.authorization = `Rapid7-HMAC-V1-${algorithm} ${authorization}`;
      Log.debug(`Request: authorization ${params.headers.authorization}`);
    }).then(() => {
      const opts = {
        uri: params.href,
        headers: Object.assign({}, params.headers, {
          'content-length': params.payload.length
        }),
        resolveWithFullResponse: true,
        body: params.payload
      };

      return rp(opts);
    });
};
