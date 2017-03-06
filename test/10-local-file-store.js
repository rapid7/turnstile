'use strict';

require('./resource/config');

const Errors = require('../lib/errors');
const Local = require('../lib/provider/local');
const expect = require('chai').expect;

/*
 * Matches parameters in the keys.json resource
 */
const fixture = {
  key: '7bf9708aa51b7f7859d0e68b6b62b8ab',
  secret: '6jzQ+NyqY7PwOFpipttvbp53baOI/bqGdn4DMc2ALN2v3+rcNYWz/T4r+jORJHBq'
};

describe('lib/local/store', function storage() {
  describe('Events', function events() {
    it('emits `update` after the data file is loaded', function behavior(done) {
      new Local.FileStore(Config.get('local:db')).once('update', done);
    });

    it('responds to a reload SIGNAL', function behavior(done) {
      new Local.FileStore(Config.get('local:db')).once('update', function updated() {
        // This is only called after the DB is initially loaded.
        this.once('update', done);

        // This should trigger the inner 'update' handler, above.
        process.emit('SIGHUP');
      });
    });

    it('emits `error` if a data file can not be loaded', function behavior(done) {
      new Local.FileStore({
        path: 'foo/bar.json'
      }).once('error', function error(err) {
        expect(err).to.be.an('error');
        done();
      });
    });
  });

  describe('Methods', function methods() {
    const db = new Local.FileStore(Config.get('local:db'));

    it('throws an error when `lookup` is called with an invalid key', function behavior() {
      expect(() => db.lookup('bogus key')).to.throw(Errors.AuthorizationError);
    });

    it('`lookup` returns a secret when it is called with a valid key', function behavior() {
      expect(() => db.lookup(fixture.key)).to.not.throw();
      expect(db.lookup(fixture.key)).to.equal(fixture.secret);
    });
  });
});
