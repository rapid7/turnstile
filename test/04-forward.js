'use strict';

require('./resource/config');
require('./resource/log');

// const Errors = require('../lib/errors');
const Fixtures = require('./resource/fixtures');
const HTTP = require('./resource/http');

const Forward = require('../lib/control/forward');
const expect = require('chai').expect;

const controller = Forward.create({
  hostname: Config.get('service:hostname'),
  port: 80
});
const server = HTTP.server();

describe('lib/control/forward', function() {
  describe('controller', function() {
    before((done) => {
      server.start((port) => {
        controller.context.port = port;
        done();
      });
    });
    after(() => server.close());

    it('throws a TypeError if options.port is not a Number', function() {
      expect(function _expect() {
        Forward.create({
          hostname: Config.get('service:hostname'),
          port: 'lalalala'
        });
      }).to.throw(TypeError);
    });

    it('connects to an HTTP server and forwards a request', function(done) {
      const fixture = Fixtures.HTTP[200];
      const request = Object.assign({}, fixture.REQUEST, {
        url: server.handle(Fixtures.HTTP[200])
      });

      HTTP.bench(request, (req, res) => controller(req, res, function(err) {
        expect(err).to.be.undefined;
      }))
        .response((req, res) => {
          expect(res.statusCode).to.equal(fixture.RESPONSE.code);
          expect(res.headers).to.contain.keys({'content-type': fixture.RESPONSE.type});
          expect(res.headers).to.contain.keys('content-length');
          expect(res.body).to.equal(fixture.RESPONSE.body);
        })
        .finally(done);
    });

    [301, 302, 400, 401, 403, 404, 500, 501].forEach(function(code) {
      it(`handles a ${code} response from the server`, function(done) {
        const fixture = Fixtures.HTTP[code];
        const request = Object.assign({}, fixture.REQUEST, {
          url: server.handle(Fixtures.HTTP[code])
        });

        HTTP.bench(request, (req, res) => controller(req, res, function(err) {
          expect(err).to.be.undefined;
        }))
          .response((req, res) => {
            expect(res.statusCode).to.equal(fixture.RESPONSE.code);
            expect(res.headers).to.contain.keys({'content-type': fixture.RESPONSE.type});
            expect(res.headers).to.contain.keys('content-length');
            expect(res.body).to.equal(fixture.RESPONSE.body);
          })
          .finally(done);
      });
    });

    it(`handles a 304 response from the server`, function(done) {
      const fixture = Fixtures.HTTP[304];
      const request = Object.assign({}, fixture.REQUEST, {
        url: server.handle(Fixtures.HTTP[304])
      });

      HTTP.bench(request, (req, res) => controller(req, res, function(err) {
        expect(err).to.be.undefined;
      }))
        .response((req, res) => {
          expect(res.statusCode).to.equal(fixture.RESPONSE.code);
          expect(res.headers).to.contain.keys({'content-type': fixture.RESPONSE.type});
          expect(res.body).to.equal(fixture.RESPONSE.body);
        })
        .finally(done);
    });
  });
});
