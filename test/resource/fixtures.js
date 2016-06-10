/**
 *  A valid signature and its input parameters for testing
 */
exports.SIGNATURE = {
  METHOD: 'GET',
  URL: '/after/it',
  DATE: 'Thu Mar 24 2016 00:17:57 GMT-0400 (EDT)',
  HOST: 'localhost',
  SECRET: '00ccf57c75b17a0f86b1e2fa231339f99ba9d334c636d1c473e71783cf902e24',
  SIGNATURE: 'tWN/dWrtBniKSrTfVQmRxLng6KVGC4s7BAruMTAWY2w='
};

/**
 * An entry in ./keys.json to test against
 */
exports.DB = {
  KEY: '7bf9708aa51b7f7859d0e68b6b62b8ab',
  SECRET: '6jzQ+NyqY7PwOFpipttvbp53baOI/bqGdn4DMc2ALN2v3+rcNYWz/T4r+jORJHBq'
};

/**
 * HTTP Request/Response parameters
 */
exports.HTTP = {
  200: {
    REQUEST: {
      METHOD: 'GET',
      TYPE: 'text/plain',
      BODY: 'knock knock'
    },
    RESPONSE: {
      CODE: 200,
      TYPE: 'text/plain',
      BODY: 'Hello, world!'
    }
  }
};

[301, 302, 304, 400, 401, 403, 404, 500, 501].forEach(function fixture(code) {
  exports.HTTP[code] = {
    REQUEST: exports.HTTP[200].REQUEST,
    RESPONSE: Object.assign({}, exports.HTTP[200].RESPONSE)
  };

  exports.HTTP[code].RESPONSE.CODE = code;
});

delete exports.HTTP[304].RESPONSE.BODY;
