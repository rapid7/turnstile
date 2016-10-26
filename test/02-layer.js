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

  it('responds with a `404: Not Found` response if no layers respond', function(done) {
    const app = Layer.create();

    HTTP.bench(fixture.REQUEST, (req, res) => app(req, res))
      .response((req, res) => {
        expect(res.statusCode).to.equal(404);
        expect(res.headers).to.contain.keys({'content-type': 'application/json'});
        expect(res.headers).to.contain.keys('content-length');
        expect(res.body).to.be.not.empty;
      })
      .finally(done);
  });

  it('passes requests to handlers', function behavior(done) {
    const app = Layer.create();

    HTTP.bench(fixture.REQUEST, (req, res) => {
      app.use(function middleware(_req, _res, next) {
        expect(_req).to.equal(req);
        expect(_res).to.equal(res);

        next();
      });

      app(req, res);
    }).finally(done);
  });

  it('advances to the next handler when `next()` is called', function(done) {
    const app = Layer.create();

    app.use(function middleware(req, res, next) {
      next();
    });

    HTTP.bench(fixture.REQUEST, (req, res) => {
      app.use(function middleware(_req, _res, next) {
        expect(_req).to.equal(req);
        expect(_res).to.equal(res);

        next();
      });

      app(req, res);
    }).finally(done);
  });

  it('stops advancing to the next handler when `next()` is called with an error', function(done) {
    const app = Layer.create();

    app.use(function middleware(req, res, next) {
      next(new Errors.AuthorizationError());
    });

    app.use(function middleware(_req, _res, _next) {
      throw Error('Control should not have entered next middleware');
    });

    HTTP.bench(fixture.REQUEST, (req, res) => app(req, res))
      .response((req, res) => {
        expect(res.statusCode).to.equal(401);
        expect(res.headers).to.contain.keys({'content-type': 'application/json'});
        expect(res.headers).to.contain.keys('content-length');
        expect(res.body).to.be.not.empty;
      })
      .finally(done);
  });

  it('catches and returns errors thrown in handlers', function(done) {
    const app = Layer.create();

    app.use(function middleware() {
      throw Error('This is an unhandled middleware exception');
    });

    HTTP.bench(fixture.REQUEST, (req, res) => app(req, res))
      .response((req, res) => {
        expect(res.statusCode).to.equal(500);
        expect(res.headers).to.contain.keys({'content-type': 'application/json'});
        expect(res.headers).to.contain.keys('content-length');

        expect(res.body).to.be.not.empty;
        expect(res.body).to.be.a('string');

        const error = JSON.parse(res.body);

        expect(error.code).to.equal(500);
        expect(error.message).to.equal('This is an unhandled middleware exception');
      })
      .finally(done);
  });
});
