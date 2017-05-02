'use strict';

const jwt = require('jsonwebtoken');

const Errors = require('../../errors');
const Store = require('../store').Store;
const lookup = require('../store').lookup;

exports.jwt = function(options) {
  options = Object.assign({
    // Default values go here
  }, options);

  const db = Store(options.db);

  db.on('error', (err) => Log.error(err));

  Log.info(`Using jwt controller with database: ${db.path}`);

  return function token(req, res, next) {
    const identifier = req.identifier;

    Log.debug('Enforcing token validator', {
      identifier
    });

    // We can prep this generic AuthorizationError to throw in case we don't
    // end up with a valid signature and for some reason `jwt.verify`
    // doesn't throw.
    let error = new Errors.AuthorizationError('Invalid authentication factors', {
      identifier
    });
    const token = req.headers.authorization.replace('Bearer ', '');

    lookup(db, req).then((identity) => {
      const valid = identity.some((id) => {
        Log.debug(`Request Token: ${token}`, {
          identifier
        });

        try {
          jwt.verify(token, id, {
            clockTolerance: options.skew
          });
        } catch (err) {
          error = err;

          return false;
        }

        Log.debug('Authenticated. Forwarding request', {
          identifier
        });

        // If we haven't thrown (the key is valid) we return true
        // and Array.some will consider its job fulfilled and won't
        // continue iterating.
        return true;
      });

      if (valid) {
        return next();
      }

      throw error;
    }).catch((err) => {
      next(err);
    });
  };
};
