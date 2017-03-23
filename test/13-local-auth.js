'use strict';

require('./resource/config');
require('./resource/log');

const HTTP = require('./resource/http');
const Errors = require('../lib/errors');

const Controller = require('../lib/provider/local');
const Signature = require('../lib/signature');
const expect = require('chai').expect;

const identity = '7bf9708aa51b7f7859d0e68b6b62b8ab';
const secret = '6jzQ+NyqY7PwOFpipttvbp53baOI/bqGdn4DMc2ALN2v3+rcNYWz/T4r+jORJHBq';
const signed = 'AuICfpC1IcSBDoFYh/wjc+pgsmfd2t8EGng+n0FK3Tk=';

const authorization = Buffer.from(`${identity}:${signed}`, 'utf8').toString('base64');

const fixture = {
  method: 'GET',
  url: '/after/it',
  date: new Date('Thu Mar 24 2016 00:17:57 GMT-0400 (EDT)'),
  headers: {
    host: 'localhost',
    date: 'Thu Mar 24 2016 00:17:57 GMT-0400 (EDT)',
    digest: 'SHA256=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
    authorization: `Rapid7-HMAC-V1-SHA256 ${authorization}`
  }
};

function validateWrapper(req, res) {
  Controller.validate(5000, req);
  res.end();
}

function authorizationWrapper(req, res) {
  Controller.authorization(req);
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

    it('fails if the date header is not a valid date string', function() {
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

    it('fails if the date header is more than SKEW ms from Now', function() {
      return HTTP.bench(fixture, (req, res) => validateWrapper(req, res)).catch((err) => {
        expect(err).to.be.instanceof(Errors.AuthorizationError);
        expect(err.message).to.equal('Request date skew is too large');
      });
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
          date: (new Date()).toString()
        })
      });

      return HTTP.bench(valid, (req, res) => validateWrapper(req, res));
    });
  });

  describe('controller', function control() {
    const controller = Controller.authn(Config.get('local'));

    it('passes a valid request to the next middleware', function() {
      // Set the date key in headers and request. This is required to generate
      // a valid request signature for testing.
      const date = (new Date()).toString();
      const valid = Object.assign({}, fixture, {
        headers: Object.assign({}, fixture.headers, {date}),
        identity,
        date: new Date(date)
      });

      const signature = new Signature(Config.get('local:algorithm'), valid);
      const authorization = Buffer.from(`${identity}:${signature.sign(secret)}`, 'utf8').toString('base64');

      valid.headers.authorization = `Rapid7-HMAC-V1-SHA256 ${authorization}`;

      return HTTP.bench(valid, (req, res) => {
        controller(req, res, function(err) {
          expect(err).to.be.undefined;
          res.end();
        });
      });
    });
  });
});
