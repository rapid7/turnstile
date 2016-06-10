'use strict';

/**
 * Expose a stub logger for testing
 */
global.Log = new (require('winston').Logger)();
