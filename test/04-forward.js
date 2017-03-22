'use strict';

require('./resource/config');
require('./resource/log');

const Forward = require('../lib/control/forward');
const expect = require('chai').expect;

const forward = Forward.create({
  hostname: Config.get('service:hostname'),
  port: Config.get('service:port')
});

describe('lib/control/forward', function() {
  it('throws a TypeError if options.port is not a Number', function() {
    expect(function _expect() {
      Forward.create({
        hostname: Config.get('service:hostname'),
        port: 'lalalala'
      });
    }).to.throw(TypeError);
  });

  it('correctly generates the proxying middleware', function() {
    expect(forward.name).to.equal('handleProxy');
    expect(forward.length).to.equal(3);
  });
});
