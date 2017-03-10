'use strict';

require('./resource/config');
require('./resource/log');

const Errors = require('../lib/errors');
const Signature = require('../lib/signature');
const expect = require('chai').expect;

const fixture = {
  method: 'GET',
  url: '/after/it',
  date: new Date('Thu Mar 24 2016 00:17:57 GMT-0400 (EDT)'),
  headers: {
    host: 'localhost',
    digest: 'SHA256=47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='
  },
  identity: '7bf9708aa51b7f7859d0e68b6b62b8ab'
};

const secret = '6jzQ+NyqY7PwOFpipttvbp53baOI/bqGdn4DMc2ALN2v3+rcNYWz/T4r+jORJHBq';
const signed = 'GRilc5yXm7NO7h+XF0KhjifIgtE+dJn+9UOotMIEYZo=';

describe('lib/signature', function() {
  const signature = new Signature(Config.get('local:algorithm'), fixture);

  it('generates a base64 signature string', function() {
    expect(signature.signature).to.be.undefined;
    signature.sign(secret);

    expect(signature.signature).to.match(/^[a-zA-Z0-9\/\+=]+$/);
    expect(signature.signature).to.equal(signed);
  });

  it('uses a `path` request parameter if `url` is not defined', function() {
    const pathFixture = Object.assign({
      path: fixture.url
    }, fixture);

    delete pathFixture.url;

    const signatureUsesPath = new Signature(Config.get('local:algorithm'), pathFixture);

    signatureUsesPath.sign(secret);
    expect(signatureUsesPath.signature).to.equal(signed);
  });

  it('favors the `url` request parameter over `path`', function() {
    const signatureFavorsURL = new Signature(Config.get('local:algorithm'), Object.assign({
      path: '/foo/bar/baz'
    }, fixture));

    signatureFavorsURL.sign(secret);
    expect(signatureFavorsURL.signature).to.equal(signed);
  });

  it('raises an exception if neither `path` nor `url` parameters are present', function() {
    const pathFixture = Object.assign({}, fixture);

    delete pathFixture.url;

    expect(() => {
      new Signature(Config.get('local:algorithm'), pathFixture);
    }).to.throw(Errors.RequestError);
  });

  it('validates a request signature', function() {
    expect(() => signature.verify(signed)).to.not.throw();
  });

  it('throws an error for an invalid request signature', function() {
    expect(() => signature.verify('asldfasdflkjhasdlfkjhasdlfkjhasdflk')).to.throw(Errors.AuthorizationError);
  });
});
