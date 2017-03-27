'use strict';

require('./resource/config');

const Local = require('../lib/provider/local');
const expect = require('chai').expect;
const nock = require('nock');
const Resource = require('./resource');

const secret = '6jzQ+NyqY7PwOFpipttvbp53baOI/bqGdn4DMc2ALN2v3+rcNYWz/T4r+jORJHBq';

const fixture = {
  'some-service-in-us-east-1': secret,
  'some-service-in-us-west-1': secret
};

const prefixedFixture = {
  'prefix.some-service-in-us-east-1': secret,
  'prefix.some-service-in-us-west-1': secret
};

const defaultPropsdOpts = {
  path: 'http://localhost:9100/v1/properties',
  signal: 'SIGHUP',
  propsd: true,
  prefix: '',
  delimiter: ''
};

describe('lib/local/propsd_store', function storage() {
  // Cleanup process event listeners
  afterEach(Resource.cleanup);

  nock('http://localhost:9100')
    .persist()
    .get('/v1/properties')
    .reply(200, fixture)
    .get('/v1/properties/prefixed')
    .reply(200, prefixedFixture)
    .get('/v1/properties/malformed')
    .reply(200, 'this is a malformed property');

  describe('Events', function events() {
    it('emits `update` after the keys are loaded from Propsd', function behavior(done) {
      Local.Store(defaultPropsdOpts).once('update', done);
    });

    it('emits `error` if keys can not be loaded', function behavior(done) {
      Local.Store(Object.assign({}, defaultPropsdOpts, {
        path: 'http://localhost:9100/v1/properties/not.keys'
      })).once('error', function error(err) {
        expect(err).to.be.an.instanceOf(Error);
        done();
      });
    });
  });

  describe('Keys', function() {
    it('parses keys correctly from a Propsd endpoint', function(done) {
      const propsd = Local.Store(defaultPropsdOpts);

      propsd.once('update', () => {
        expect(propsd.keys).to.eql(fixture);
        done();
      });
    });

    it('emits `error` if Propsd data is malformed', function(done) {
      Local.Store(Object.assign({}, defaultPropsdOpts, {
        path: 'http://localhost:9100/v1/properties/malformed'
        })).once('error', (err) => {
        expect(err).to.be.an.instanceOf(Error);
        done();
      });
    });

    it('removes a key prefix if one is defined', function(done) {
      const propsd = Local.Store(Object.assign({}, defaultPropsdOpts, {
        path: 'http://localhost:9100/v1/properties/prefixed',
        prefix: 'prefix',
        delimiter: '.'
      }));

      propsd.once('update', () => {
        expect(propsd.keys).to.eql(fixture);
        done();
      });
    });
  });
});
