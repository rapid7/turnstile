'use strict';

/**
 * HTTP Request/Response parameters
 */
exports.HTTP = {
  200: {
    REQUEST: {
      method: 'GET',
      type: 'text/plain',
      body: 'knock knock'
    },
    RESPONSE: {
      code: 200,
      type: 'text/plain',
      body: 'Hello, world!'
    }
  }
};

[301, 302, 304, 400, 401, 403, 404, 500, 501].forEach(function fixture(code) {
  exports.HTTP[code] = {
    REQUEST: exports.HTTP[200].REQUEST,
    RESPONSE: Object.assign({}, exports.HTTP[200].RESPONSE)
  };

  exports.HTTP[code].RESPONSE.code = code;
});

exports.HTTP[304].RESPONSE.body = '';
