'use strict';

/**
 * Testing stubs for HTTP.IncomingMessage and HTTP.ServerResponse
 */
class IncomingMessage extends require('stream').PassThrough {
  constructor(request) {
    request = Object.assign({
      method: 'GET',
      url: '/default/test/path'
    }, request);

    request.headers = Object.assign({}, {
      'content-type': request.type,
      'content-length': Buffer.byteLength(request.body, 'utf8')
    }, request.headers);

    super();

    Object.assign(this, request);
  }
}
exports.IncomingMessage = IncomingMessage;

class ServerResponse extends require('stream').PassThrough {
  constructor(handler) {
    super({});
    this.handler = handler;

    this.headers = {};
    this.chunks = [];
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  }

  writeHead(code, status, headers) {
    this.statusCode = code;

    if (status) {
      this.statusMessage = status;
    }

    if (headers) {
      this.headers = headers;
    }
  }

  write(chunk) {
    this.chunks.push(chunk);
  }

  end(chunk) {
    if (chunk) {
      this.chunks.push(chunk);
    }

    this.ended = true;
    this.body = Buffer.concat(this.chunks).toString('utf8');
    this.handler(this);
  }
}
exports.ServerResponse = ServerResponse;

exports.bench = function(request, handler) {
  return new Promise((resolve, reject) => {
    const req = new IncomingMessage(request);
    const res = new ServerResponse(() => resolve([req, res]));

    setImmediate(() => {
      try {
        handler(req, res);

        if (request.body) {
          req.write(request.body);
        }

        req.end();
      } catch (err) {
        reject(err);
      }
    });
  });
};
