'use strict';

const Path = require('path');

const Errors = require('../lib/errors');
const Local = require('../lib/provider/local');
const expect = require('chai').expect;

/*
 * Mock local config object
 */
const db = {
  path: Path.join(__dirname, 'resource/keys.json'),
  signal: 'SIGHUP'
};

/*
 * Matches parameters in the keys.json resource
 */
const fixture = {
  identity: '7bf9708aa51b7f7859d0e68b6b62b8ab',
  secret: '6jzQ+NyqY7PwOFpipttvbp53baOI/bqGdn4DMc2ALN2v3+rcNYWz/T4r+jORJHBq'
};

describe('lib/local/store', function storage() {
  describe('Events', function events() {
    it('responds to a reload SIGNAL', function behavior(done) {
      Local.Store(db).once('update', function updated() {
        // This is only called after the DB is initially loaded.
        this.once('update', done);

        // This should trigger the inner 'update' handler, above.
        process.emit('SIGHUP');
      });
    });
  });

  describe('Methods', function methods() {
    const dbImpl = Local.Store(db);

    it('throws an error when `lookup` is called with an invalid key', function behavior() {
      expect(() => dbImpl.lookup('bogus key')).to.throw(Errors.AuthorizationError);
    });

    it('`lookup` returns a secret when it is called with a valid key', function behavior() {
      expect(() => dbImpl.lookup(fixture)).to.not.throw();
      expect(dbImpl.lookup(fixture)).to.equal(fixture.secret);
    });
  });
});
