'use strict';
/**
 * This check fails for assignment of values on an Object argument, and does not
 * allow for argument type-checking/default setters. */
/* eslint-disable no-param-reassign */

/**
 * This check is invalid. Functions defined outside of a class are still hoisted. */
/* eslint-disable no-use-before-define */

const Crypto = require('crypto');
const EventEmitter = require('events').EventEmitter;
const HTTP = require('http');
const expect = require('chai').expect;

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

/**
 * Stub server for client testing
 *
 * @param {Function}  ready
 * @return {HTTP.Server}
 */
exports.server = function() {
  const server = HTTP.createServer(function handler(req, res) {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', (chunk) => {
      if (chunk) { chunks.push(chunk); }
      req.body = Buffer.concat(chunks).toString('utf8');

      if (handlers.hasOwnProperty(req.url)) {
        return handlers[req.url](req, res);
      }

      const body = 'Not Found';

      res.writeHead(404, {
        'content-type': 'text/plain',
        'content-length': Buffer.byteLength(body, 'utf8')
      });

      res.write(body, 'utf8');
      res.end();
    });
  });

  const handlers = server.handlers = {};

  server.handle = function(handler) {
    const path = '/' + Crypto.randomBytes(32).toString('hex');

    if (handler instanceof Function) {
      handlers[path] = handler;
    } else if (handler instanceof Object) {
      // Treat `handler` as a Fixture
      handlers[path] = function _handler(req, res) {
        expect(req.method).to.equal(handler.REQUEST.method);
        expect(req.url).to.equal(path);
        expect(req.headers).to.contain.keys({'content-type': handler.REQUEST.type});
        expect(req.headers).to.contain.keys('content-length');
        expect(req.body).to.equal(handler.REQUEST.body);

        if (handler.RESPONSE.body) {
          res.setHeader('content-length', Buffer.byteLength(handler.RESPONSE.body, 'utf8'));
        }

        res.setHeader('content-type', handler.RESPONSE.type);
        res.writeHead(handler.RESPONSE.code);

        if (handler.RESPONSE.body) {
          res.write(handler.RESPONSE.body, 'utf8');
        }

        res.end();
      };
    }

    return path;
  };

  server.start = function(ready) {
    server.listen(0, '127.0.0.1', () => ready(server.address().port));
  };

  return server;
};

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
