'use strict';

require('./resource/config');

const Errors = require('../lib/errors');
const Local = require('../lib/provider/local');
const expect = require('chai').expect;
const nock = require('nock');

const db = {
  path: 'http://localhost:9100/v1/properties/turnstile.keys',
  signal: 'SIGHUP'
};

const key = '7bf9708aa51b7f7859d0e68b6b62b8ab';
const secret = '6jzQ+NyqY7PwOFpipttvbp53baOI/bqGdn4DMc2ALN2v3+rcNYWz/T4r+jORJHBq';

const fixture = {key, secret};
const resp = {};

resp[key] = secret;

describe('lib/local/remote_store', function storage() {
  nock('http://localhost:9100')
    .persist()
    .get('/v1/properties/turnstile.keys')
    .reply(200, resp);

  describe('Events', function events() {
    it('emits `update` after the data file is loaded', function behavior(done) {
      Local.Store(db).once('update', done);
    });

    it('emits `error` if a data file can not be loaded', function behavior(done) {
      Local.Store({
        path: 'http://localhost:9100/v1/properties/not.keys'
      }).once('error', function error(err) {
        expect(err).to.be.an.instanceOf(Error);
        done();
      });
    });
  });
});
