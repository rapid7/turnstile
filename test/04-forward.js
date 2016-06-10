'use strict';

require('./resource/config');
require('./resource/log');

// const Errors = require('../lib/errors');
const Fixtures = require('./resource/fixtures');
const HTTP = require('./resource/http');

const Controller = require('../lib/control/forward');
const expect = require('chai').expect;

describe('lib/control/forward', function middleware() {
  describe('controller', function _controller() {
    let server, controller;

    // Set up a test HTTP server
    before(function _before(done) {
      server = HTTP.server(function listening(port) {
        controller = Controller.create(Object.assign({
          hostname: Config.get('service:hostname'),
          port
        }));

        done();
      });
    });

    after(() => server.close());

    it('throws a TypeError if options.port is not a Number', function behavior() {
      expect(function _expect() {
        Controller.create(Object.assign({
          hostname: Config.get('service:hostname'),
          port: 'lalalala'
        }));
      }).to.throw(TypeError);
    });

    it('connects to an HTTP server and forwards a request', function behavior(done) {
      const fixture = Fixtures.HTTP[200];

      HTTP.request(server.handle(fixture), fixture.REQUEST)
      .once('request', function request(req, res) {
        controller(req, res, function next(err) {
          expect(err).to.be.undefined;
        });
      })
      .once('response', function response(res) {
        expect(res.statusCode).to.equal(fixture.RESPONSE.CODE);
        expect(res.headers).to.contain.keys({'content-type': fixture.RESPONSE.TYPE});
        expect(res.headers).to.contain.keys('content-length');
        expect(res.body).to.equal(fixture.RESPONSE.BODY);

        done();
      });
    });

    [301, 302, 304, 400, 401, 403, 404, 500, 501].forEach(function _cases(code) {
      it(`handles a ${code} response from the server`, function behavior(done) {
        HTTP.request(server.handle(Fixtures.HTTP[code]), Fixtures.HTTP[code].REQUEST)
        .once('request', function request(req, res) {
          controller(req, res, function next(err) {
            expect(err).to.be.undefined;
          });
        })
        .once('response', function response(res) {
          expect(res.statusCode).to.equal(Fixtures.HTTP[code].RESPONSE.CODE);
          expect(res.headers).to.contain.keys({'content-type': Fixtures.HTTP[code].RESPONSE.TYPE});

          if (Fixtures.HTTP[code].RESPONSE.BODY) {
            expect(res.headers).to.contain.keys('content-length');
            expect(res.body).to.equal(Fixtures.HTTP[code].RESPONSE.BODY);
          }

          done();
        });
      });
    });
  });
});
