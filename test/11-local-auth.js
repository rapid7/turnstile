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
      req.url = Fixtures.SIGNATURE.URL;
      req.headers = {
        date: Fixtures.SIGNATURE.DATE,
        host: Fixtures.SIGNATURE.HOST,
        'x-auth-key': Fixtures.DB.KEY,
        'x-auth-signature': Fixtures.SIGNATURE.SIGNATURE
      };
    });

    it('fails if required headers are missing', function behavior() {
      delete req.headers['x-auth-signature'];

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

      const signature = new Signature(Config.get('local:algorithm'), {
        Date: now,
        Method: Fixtures.SIGNATURE.METHOD,
        URI: Fixtures.SIGNATURE.URL,
        Host: Fixtures.SIGNATURE.HOST
      });

      req.method = Fixtures.SIGNATURE.METHOD;
      req.url = Fixtures.SIGNATURE.URL;
      req.headers = {
        date: now,
        host: Fixtures.SIGNATURE.HOST,
        'x-auth-key': Fixtures.DB.KEY,
        'x-auth-signature': signature.sign(Fixtures.DB.SECRET)
      };
    });

    it('passes a valid request to the next middleware', function behavior(done) {
      controller(req, res, function next(err) {
        expect(err).to.be.undefined;
        done();
      });
    });

    it('raises an error if the signature is invalid', function behavior() {
      req.headers['x-auth-signature'] = 'INVLAID_SIGNATURE';

      expect(() => controller(req, res, function next() {})).to.throw(Errors.AuthorizationError);
    });

    it('raises an error if the key is invalid', function behavior() {
      req.headers['x-auth-key'] = 'INVLAID_KEY';

      expect(() => controller(req, res, function next() {})).to.throw(Errors.AuthorizationError);
    });

    it('raises an error if the date skew is too high', function behavior() {
      req.headers.date = Fixtures.SIGNATURE.DATE;

      expect(() => controller(req, res, function next() {})).to.throw(Errors.AuthorizationError);
    });
  });
});
