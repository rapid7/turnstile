'use strict';

require('./resource/config');
require('./resource/log');

const HTTP = require('./resource/http');
const Errors = require('../lib/errors');
const Fixtures = require('./resource/fixtures');

const Controller = require('../lib/provider/local');
const Signature = require('../lib/signature');
const expect = require('chai').expect;

describe('lib/provider/local', function middleware() {
  describe('validate', function validate() {
    const req = new HTTP.IncomingMessage();

    beforeEach(function setup() {
      req.method = Fixtures.SIGNATURE.METHOD;
      req.url = Fixtures.SIGNATURE.URL;

      /*
       * TODO The `Buffer()`` constructor is going to become deprecated, but
       * `Buffer.from(str, enc)` isn't fully implemented yet. Need to replace this
       * call someday.
       */
      const authorization = Buffer( // eslint-disable-line new-cap
        Fixtures.DB.KEY + ':' +
        Fixtures.SIGNATURE.SIGNATURE, 'utf8'
      ).toString('base64');

      req.headers = {
        authorization: `Rapid7-HMAC-V1-SHA256 ${authorization}`,
        date: Fixtures.SIGNATURE.DATE,
        digest: 'sha256=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
        host: Fixtures.SIGNATURE.HOST
      };
    });

    it('fails if required headers are missing', function behavior() {
      delete req.headers.authorization;

      expect(() => Controller.validate(5000, req)).to.throw(Errors.RequestError);
    });

    it('fails if the date header is not a valid data string', function behavior() {
      req.headers.date = 'asdfasdfasdfasdf';

      expect(() => Controller.validate(5000, req)).to.throw(Errors.RequestError);
    });

    it('fails if the date header is more than SKEW ms from Now', function behavior() {
      expect(() => Controller.validate(5000, req)).to.throw(Errors.AuthorizationError);
    });

    it('passes if headers are valid', function behavior() {
      req.headers.date = (new Date()).toString();

      expect(() => Controller.validate(5000, req)).to.not.throw();
    });
  });

  describe('controller', function control() {
    const req = new HTTP.IncomingMessage();
    const res = new HTTP.ServerResponse(function handler() {});

    const controller = Controller.authn(Config.get('local'));

    beforeEach(function setup() {
      const now = (new Date()).toString();

      req.method = Fixtures.SIGNATURE.METHOD;
      req.url = Fixtures.SIGNATURE.URL;

      req.headers = {
        date: now,
        digest: 'sha256=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=',
        host: Fixtures.SIGNATURE.HOST
      };

      req.date = new Date(now);
      req.identity = Fixtures.DB.KEY;

      const signature = new Signature(Config.get('local:algorithm'), req);

      signature.sign(Fixtures.DB.SECRET);
      req.signature = signature.signature;

      /*
       * TODO The `Buffer()`` constructor is going to become deprecated, but
       * `Buffer.from(str, enc)` isn't fully implemented yet. Need to replace this
       * call someday.
       */
      const authorization = Buffer( // eslint-disable-line new-cap
        Fixtures.DB.KEY + ':' +
        signature.signature, 'utf8'
      ).toString('base64');

      req.headers.authorization = `Rapid7-HMAC-V1-SHA256 ${authorization}`;
    });

    it('passes a valid request to the next middleware', function behavior(done) {
      controller(req, res, function next(err) {
        expect(err).to.be.undefined;
        done();
      });
    });

    it('raises an error if the Authorization header is invalid', function behavior() {
      req.headers.authorization = 'INVLAID_HEADER';

      expect(() => controller(req, res, function next() {})).to.throw(Errors.RequestError);
    });

    it('raises an error if the date skew is too high', function behavior() {
      req.headers.date = Fixtures.SIGNATURE.DATE;

      expect(() => controller(req, res, function next() {})).to.throw(Errors.AuthorizationError);
    });
  });
});
