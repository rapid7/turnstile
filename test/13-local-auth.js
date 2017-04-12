'use strict';

require('./resource/config');
require('./resource/log');

const HTTP = require('./resource/http');
const Errors = require('../lib/errors');

const Controller = require('../lib/provider/local');
const Signature = require('../lib/signature');
const expect = require('chai').expect;
const Crypto = require('crypto');

const identity = '7bf9708aa51b7f7859d0e68b6b62b8ab';
const secret = '6jzQ+NyqY7PwOFpipttvbp53baOI/bqGdn4DMc2ALN2v3+rcNYWz/T4r+jORJHBq';
const signed = 'AuICfpC1IcSBDoFYh/wjc+pgsmfd2t8EGng+n0FK3Tk=';
const body = 'the contents of the request body';
const algorithm = 'SHA256';
const hash = Crypto.createHash(algorithm);

hash.update(body, 'utf8');
const signature = hash.digest('base64');

const authorization = Buffer.from(`${identity}:${signed}`, 'utf8').toString('base64');
const date = new Date();
const fixture = {
  method: 'GET',
  url: '/after/it',
  date,
  headers: {
    host: 'localhost',
    date: date.getTime(),
    digest: `${algorithm}=${signature}`,
    authorization: `Rapid7-HMAC-V1-SHA256 ${authorization}`,
    'x-forwarded-for': '127.0.0.1'
  },
  body
};

function validateWrapper(req, res) {
  Controller.validate(5000, req);
  res.end();
}

function authorizationWrapper(req, res) {
  Controller.authorization(req);
  res.end();
}

function digestWrapper(req, res) {
  Controller.digest('SHA256', req);
  res.end();
}

describe('lib/provider/local', function() {
  describe('validation', function() {
    it('fails if required headers are missing', function() {
      const missingHeaders = Object.assign({}, fixture, {
        headers: {}
      });

      return HTTP.bench(missingHeaders, (req, res) => validateWrapper(req, res)).catch((err) => {
        expect(err).to.be.instanceof(Errors.RequestError);
        expect(err.message).to.equal('Missing header authorization');
      });
    });

    it('fails if the date header is neither a valid date string or number', function() {
      const invalidDate = Object.assign({}, fixture, {
        headers: Object.assign({}, fixture.headers, {
          date: 'asdfasdfasdfasdf'
        })
      });

      return HTTP.bench(invalidDate, (req, res) => validateWrapper(req, res)).catch((err) => {
        expect(err).to.be.instanceof(Errors.RequestError);
        expect(err.message).to.equal('Invalid Date header');
      });
    });

    it('passes if the date header is a number', function() {
      const validNumericDate = Object.assign({}, fixture, {
        headers: Object.assign({}, fixture.headers, {
          date: Date.now().toString()
        })
      });

      return HTTP.bench(validNumericDate, (req, res) => validateWrapper(req, res)).then((data) => {
        expect(data[0]).to.be.instanceof(HTTP.IncomingMessage);
        expect(data[1]).to.be.instanceof(HTTP.ServerResponse);
      });
    });

    it('passes if the date header is a datetime string', function() {
      const stringDate = Object.assign({}, fixture, {
        headers: Object.assign({}, fixture.headers, {
          date: (new Date()).toISOString()
        })
      });

      return HTTP.bench(stringDate, (req, res) => validateWrapper(req, res)).then((data) => {
        expect(data[0]).to.be.instanceof(HTTP.IncomingMessage);
        expect(data[1]).to.be.instanceof(HTTP.ServerResponse);
      });
    });

    it('fails if the date header is more than SKEW ms from Now', function() {
      return HTTP.bench(fixture, (req, res) => validateWrapper(req, res)).catch((err) => {
        expect(err).to.be.instanceof(Errors.AuthorizationError);
        expect(err.message).to.equal('Request date skew is too large');
      });
    });
  });

  describe('digest validation', function() {
    it('fails if the request body does not match the digest header', function() {
      const invalidDigest = Object.assign({}, fixture, {
        body: 'this is my body, there are many like it but this one is mine'
      });

      return HTTP.bench(invalidDigest, (req, res) => digestWrapper(req, res)).catch((err) => {
        expect(err).to.be.instanceof(Errors.AuthorizationError);
        expect(err.message).to.equal('Digest header does not match request body');
      });
    });

    it('passes if the request body matches the digest header', function() {
      const body = 'this is my body, there are many like it but this one is mine';
      const hash = Crypto.createHash('SHA256');

      hash.update(body, 'utf8');
      const signature = hash.digest('base64');

      const validDigest = Object.assign({}, fixture, {
        body,
        headers: Object.assign({}, fixture.headers, {
          digest: `${algorithm}=${signature}`
        })
      });

      return HTTP.bench(validDigest, (req, res) => digestWrapper(req, res));
    });
  });

  describe('authorization', function() {
    it('fails if the Authorization header is invalid', function() {
      const invalidAuth = Object.assign({}, fixture, {
        headers: {
          authorization: 'INVLAID_HEADER'
        }
      });

      return HTTP.bench(invalidAuth, (req, res) => authorizationWrapper(req, res)).catch((err) => {
        expect(err).to.be.instanceof(Errors.RequestError);
        expect(err.message).to.equal('Invalid Authorization header');
      });
    });

    it('fails if the Authorization protocol is unsupported', function() {
      const invalidAuth = Object.assign({}, fixture, {
        headers: {
          authorization: 'Rapid7-HMAC-V1-FOOBAR randomBase64foobarbaz'
        }
      });

      return HTTP.bench(invalidAuth, (req, res) => authorizationWrapper(req, res)).catch((err) => {
        expect(err).to.be.instanceof(Errors.AuthorizationError);
        expect(err.message).to.equal('Invalid authentication protocol Rapid7-HMAC-V1-FOOBAR');
      });
    });

    it('fails if the Authorization parameters are invalid', function() {
      const invalidAuth = Object.assign({}, fixture, {
        headers: {
          authorization: 'Rapid7-HMAC-V1-SHA256 randomBase64foobarbaz'
        }
      });

      return HTTP.bench(invalidAuth, (req, res) => authorizationWrapper(req, res)).catch((err) => {
        expect(err).to.be.instanceof(Errors.AuthorizationError);
        expect(err.message).to.equal('Invalid authentication parameters');
      });
    });

    it('passes if headers are valid', function() {
      const valid = Object.assign({}, fixture, {
        headers: Object.assign({}, fixture.headers, {
          date: (new Date()).getTime()
        })
      });

      return HTTP.bench(valid, (req, res) => validateWrapper(req, res));
    });
  });

  describe('controller', function control() {
    const controller = Controller.authn(Config.get('local'));

    const generateRequest = (identity, secret) => {
      // Set the date key in headers and request. This is required to generate
      // a valid request signature for testing.
      const date = new Date();
      const req = Object.assign({}, fixture, {
        headers: Object.assign({}, fixture.headers, {
          date: date.getTime().toString()
        }),
        identity,
        date
      });
      const signature = new Signature(Config.get('local:algorithm'), req);
      const authorization = Buffer.from(`${identity}:${signature.sign(secret)}`, 'utf8').toString('base64');

      req.headers.authorization = `Rapid7-HMAC-V1-SHA256 ${authorization}`;

      return req;
    };

    it('passes a valid request to the next middleware', function() {
      return HTTP.bench(generateRequest(identity, secret), (req, res) => {
        controller(req, res, function(err) {
          expect(err).to.be.undefined;
          res.end();
        });
      });
    });

    it('finds the valid secret in an array', function() {
      return HTTP.bench(generateRequest('some-turnstile-client', secret), (req, res) => {
        controller(req, res, function(err) {
          expect(err).to.be.undefined;
          res.end();
        });
      });
    });

    it('throws an error if the secret is not found', function() {
      return HTTP.bench(generateRequest('some-turnstile-client', 'a secret that doesn\'t exist'), (req, res) => {
        controller(req, res, function(err) {
          expect(err).to.be.instanceof(Errors.AuthorizationError);
          expect(err.message).to.be.equal('Invalid authentication factors');
          res.end();
        });
      });
    });
  });
});
