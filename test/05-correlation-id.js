'use strict';

require('./resource/config');
require('./resource/log');

// const Errors = require('../lib/errors');
const HTTP = require('./resource/http');

const Correlation = require('../lib/control/correlation');
const Layer = require('../lib/control/layer');
const expect = require('chai').expect;

/*
 * Create an app controller with the correlation middleware attached
 */
const app = Layer.create();

app.use(Correlation.create({
  header: 'correlation-id'
}));

describe('lib/control/correlation', function() {
  describe('controller', function() {
    it('throws a ReferenceError if the header parameter is missing', function() {
      expect(() => Correlation.create()).to.throw(ReferenceError);
    });

    it('generates a new UUID if the request does not have a correlation header', function(done) {
      HTTP.bench({}, app)
        .response((req, res) => {
          expect(req.identifier).to.be.a('string');
          expect(req.headers).to.contain.keys('correlation-id');
          expect(req.identifier).to.equal(req.headers['correlation-id']);
        })
        .finally(done);
    });

    it('detects a correlation header from downstream and adds it to the request', function(done) {
      HTTP.bench({
        headers: {
          'correlation-id': 'test-correlation-id'
        }
      }, app)
        .response((req, res) => {
          expect(req.identifier).to.be.a('string');
          expect(req.identifier).to.equal('test-correlation-id');
        })
        .finally(done);
    });
  });
});
