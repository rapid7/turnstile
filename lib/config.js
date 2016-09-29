'use strict';

const Path = require('path');

/*
 * This is a configuration file. It is, by definition, where "Magic Numbers" should be defined. */
/* eslint-disable rapid7/static-magic-numbers */

/**
 * Configuration provider
 *
 * @global
 * @param {Yargs} args
 */
const Config = global.Config = require('nconf')
  .argv({
    config: {
      alias: 'c',
      describe: 'Path to local turnstile configuration'
    }
  });

if (Config.get('config')) {
  Config.file(Path.resolve(process.cwd(), Config.get('config')));
}

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
  correlation: {
    enable: true,
    header: 'X-Request-Identifier'
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
