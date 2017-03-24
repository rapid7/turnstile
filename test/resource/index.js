'use strict';

/**
 * Clean up process event listeners
 */
exports.cleanup = () => {
  process.removeAllListeners('SIGHUP');
};
