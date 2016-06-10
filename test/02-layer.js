'use strict';

require('./resource/config');
require('./resource/log');

const Errors = require('../lib/errors');
const Fixtures = require('./resource/fixtures');
const HTTP = require('./resource/http');

const Layer = require('../lib/control/layer');
const expect = require('chai').expect;

describe('lib/control/layer', function layer() {
  const fixture = Fixtures.HTTP[200];

  it('responds with a `404: Not Found` response if no layers respond', function behavior(done) {
    const app = Layer.create();

    HTTP.request(HTTP.path(), fixture.REQUEST)
    .once('request', (req, res) => app(req, res))
    .once('response', function response(res) {
      expect(res.statusCode).to.equal(404);
      expect(res.headers).to.contain.keys({'content-type': 'application/json'});
      expect(res.headers).to.contain.keys('content-length');
      expect(res.body).to.be.not.empty;

      done();
    });
  });

  it('passes requests to handlers', function behavior(done) {
    const app = Layer.create();

    HTTP.request(HTTP.path(), fixture.REQUEST)
    .once('request', function request(req, res) {
      app.use(function middleware(_req, _res, next) {
        expect(_req).to.equal(req);
        expect(_res).to.equal(res);

        next();
      });

      app(req, res);
    }).on('response', () => done());
  });

  it('advances to the next handler when `next()` is called', function behavior(done) {
    const app = Layer.create();

    HTTP.request(HTTP.path(), fixture.REQUEST)
    .once('request', function request(req, res) {
      app.use(function middleware(_req, _res, next) {
        next();
      });

      app.use(function middleware(_req, _res, next) {
        expect(_req).to.equal(req);
        expect(_res).to.equal(res);

        done();
      });

      app(req, res);
    });
  });

  it('stops advancing to the next handler when `next()` is called with an error', function behavior(done) {
    const app = Layer.create();

    HTTP.request(HTTP.path(), fixture.REQUEST)
    .once('request', function request(req, res) {
      app.use(function middleware(_req, _res, next) {
        next(new Errors.AuthorizationError());
      });

      app.use(function middleware(_req, _res, _next) {
        throw Error('What are you doing in here?!');
      });

      app(req, res);
    })
    .once('response', function response(res) {
      expect(res.statusCode).to.equal(401);
      expect(res.headers).to.contain.keys({'content-type': 'application/json'});
      expect(res.headers).to.contain.keys('content-length');
      expect(res.body).to.be.not.empty;

      done();
    });
  });

  it('catches and returns errors thrown in handlers', function behavior(done) {
    const ERROR_MESSAGE = 'What are you doing in here?!';
    const app = Layer.create();

    HTTP.request(HTTP.path(), fixture.REQUEST)
    .once('request', function request(req, res) {
      app.use(function middleware(_req_, _res_, _next_) {
        throw Error(ERROR_MESSAGE);
      });

      app(req, res);
    })
    .once('response', function response(res) {
      expect(res.statusCode).to.equal(500);
      expect(res.headers).to.contain.keys({'content-type': 'application/json'});
      expect(res.headers).to.contain.keys('content-length');

      expect(res.body).to.be.a('string');

      const error = JSON.parse(res.body);

      expect(error.code).to.equal(500);
      expect(error.message).to.equal(ERROR_MESSAGE);

      done();
    });
  });
});
