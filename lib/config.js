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
module.exports = function config(args) {
  const Config = global.Config = require('nconf').env()
    .argv({
      config: {
        alias: 'c',
        default: '/etc/turnstile/config.json',
        describe: 'Path to local turnstile configuration'
      }
    });

  if (args.c) {
    Config.file(Path.resolve(process.cwd(), args.c));
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
};
