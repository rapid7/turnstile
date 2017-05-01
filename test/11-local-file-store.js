'use strict';
const Path = require('path');

require('./resource/config');

const Local = require('../lib/provider/store');
const Resource = require('./resource');
const expect = require('chai').expect;

const db = {
  path: Path.join(__dirname, 'resource/keys.json'),
  signal: 'SIGHUP'
};

describe('lib/local/file_store', function storage() {
  // Cleanup process event listeners
  afterEach(Resource.cleanup);

  describe('Events', function events() {
    it('emits `update` after the data file is loaded', function behavior(done) {
      const store = Local.Store(db);

      store.once('update', () => {
        done();
      });
    });

    it('emits `error` if a data file can not be loaded', function behavior(done) {
      Local.Store({
        path: 'foo/bar.json'
      }).once('error', function error(err) {
        expect(err).to.be.an.instanceOf(Error);
        done();
      });
    });
  });
});
