'use strict';

require('./resource/config');

const Errors = require('../lib/errors');
const Fixtures = require('./resource/fixtures');

const Signature = require('../lib/signature');
const expect = require('chai').expect;

describe('lib/signature', function _signature() {
  const signature = new Signature(Config.get('local:algorithm'), {
    method: Fixtures.SIGNATURE.METHOD,
    url: Fixtures.SIGNATURE.URL,
    date: new Date(Fixtures.SIGNATURE.DATE),
    headers: {
      host: Fixtures.SIGNATURE.HOST,
      digest: Fixtures.SIGNATURE.DIGEST
    },
    identity: Fixtures.DB.KEY
  });

  it('generates a base64 signature string', function behavior() {
    expect(signature.signature).to.be.undefined;
    signature.sign(Fixtures.DB.SECRET);

    expect(signature.signature).to.match(/^[a-zA-Z0-9\/\+=]+$/);
    expect(signature.signature).to.equal(Fixtures.SIGNATURE.SIGNATURE);
  });

  it('validates a request signature', function behavior() {
    expect(() => signature.verify(Fixtures.SIGNATURE.SIGNATURE)).to.not.throw();
  });

  it('throws an error for an invalid request signature', function behavior() {
    expect(() => signature.verify('asldfasdflkjhasdlfkjhasdlfkjhasdflk')).to.throw(Errors.AuthorizationError);
  });
});
