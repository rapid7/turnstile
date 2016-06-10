'use strict';
const Path = require('path');

/*
 * This is a configuration file. It is, by definition, where "Magic Numbers" should be defined. */
/* eslint-disable rapid7/static-magic-numbers */
const Config = global.Config = require('nconf');

/**
 * Modified Config interface for testing
 */
Config.defaults({
  local: {
    db: {
      path: Path.join(__dirname, '/keys.json'),
      signal: 'SIGHUP'
    },
    algorithm: 'sha256',
    skew: 5000
  },
  service: {
    port: 9301,
    hostname: 'localhost'
  }
});
