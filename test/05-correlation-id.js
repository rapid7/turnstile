'use strict';

require('./resource/config');
require('./resource/log');

const httpMocks = require('node-mocks-http');
const expect = require('chai').expect;

const Correlation = require('../lib/control/correlation');

describe('lib/control/correlation', function() {
  const correlation = Correlation.create({
    header: 'correlation-id'
  });

  let req = {},
    res = {};

  beforeEach(function(done) {
    req = httpMocks.createRequest({
      method: 'GET'
    });

    res = httpMocks.createResponse();
    done();
  });

  it('throws a ReferenceError if the header parameter is missing', function() {
    expect(() => Correlation.create()).to.throw(ReferenceError);
  });

  it('generates a new UUID if the request does not have a correlation header', function(done) {
    correlation(req, res, (error) => {
      expect(req.identifier).to.be.a('string');
      expect(req.headers).to.contain.keys('correlation-id');
      expect(req.identifier).to.equal(req.headers['correlation-id']);
      done();
    });
  });

  it('detects a correlation header from downstream and adds it to the request', function(done) {
    req.headers['correlation-id'] = 'test-correlation-id';
    correlation(req, res, (error) => {
      expect(req.identifier).to.be.a('string');
      expect(req.identifier).to.equal('test-correlation-id');
      done();
    });
  });
});
