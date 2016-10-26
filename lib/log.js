'use strict';
const Winston = require('winston');

/**
 * Create a global logging interface
 * @module
 */

/**
 * Logging provider
 * @global
 */
const Log = global.Log = new Winston.Logger();

/*
 * Ensure that capitalized levels don't crash the colorize routine
 */
Winston.addColors({
  ERROR: 'red',
  WARN: 'yellow',
  HELP: 'cyan',
  DATA: 'grey',
  INFO: 'green',
  DEBUG: 'blue',
  PROMPT: 'grey',
  VERBOSE: 'cyan',
  INPUT: 'grey',
  SILLY: 'magenta'
});

/**
 * Log formatting to match levels used by Logback
 */
class Logback extends Winston.transports.Console {
  /**
   * @constructor
   * @param  {Object} options
   */
  constructor(options) {
    super(Object.assign({
      colorize: false,
      timestamp: true,
      json: true,
      stringify: true
    }, options));
  }

  /**
   * Wrap the log method to uppercase `level`
   *
   * @see {@link https://github.com/winstonjs/winston/blob/master/lib/winston/transports/console.js#L91}
   *
   * @param  {String} level
   * @param  {String} msg
   * @param  {Object} meta
   * @param  {Function} callback
   */
  log(level, msg, meta, callback) {
    super.log(level.toUpperCase(), msg, meta, callback);
  }
}

Log.add(Logback, Config.get('log'));
