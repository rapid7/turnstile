'use strict';
const Path = require('path');

/**
 * Create a global configuration interface
 * @module
 */

/**
 * Configuration provider
 * @global
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
    colorize: false,
    timestamp: true,
    json: true,
    stringify: true
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
