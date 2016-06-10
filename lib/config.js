'use strict';

/*
 * This is a configuration file. It is, by definition, where "Magic Numbers" should be defined. */
/* eslint-disable rapid7/static-magic-numbers */

/**
 * Configuration provider
 *
 * @global
 */
const Config = global.Config = require('nconf');

Config.defaults({
  listen: {
    port: 9300,
    bind: '0.0.0.0'
  },
  log: {
    level: 'info',
    colorize: true,
    timestamp: true
  },
  local: {
    db: {
      path: 'data/keys.json',
      signal: 'SIGHUP'
    },
    algorithm: 'sha256',
    skew: 1000
  },
  service: {
    port: 9301,
    hostname: 'localhost'
  }
});
