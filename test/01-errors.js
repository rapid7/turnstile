'use strict';

const Errors = require('../lib/errors');
const expect = require('chai').expect;

describe('lib/errors', function errors() {
  describe('500 Server Error', function classes() {
    it('sets the correct defaults', function behavior() {
      const error = new Errors();

      expect(error.code).to.equal(500);
      expect(error.name).to.equal('InternalServerError');
      expect(error.message).to.equal('Internal Server Error');
      expect(error.metadata).to.eql({});

      expect(error.toJSON()).to.eql({
        code: 500,
        name: 'InternalServerError',
        message: 'Internal Server Error',
        metadata: {}
      });
    });

    it('sets `name` and `message` correctly from a status code', function behavior() {
      const error = new Errors(404);

      expect(error.code).to.equal(404);
      expect(error.name).to.equal('NotFound');
      expect(error.message).to.equal('Not Found');
    });
  });

  describe('400 Request Error', function classes() {
    it('has the correct response code and sets a reason string', function behavior() {
      const REASON = 'Stray Alpha Particles from memory packaging caused Hard Memory Error on Server.';
      const error = new Errors.RequestError(REASON);

      expect(error.code).to.equal(400);
      expect(error.name).to.equal('BadRequest');
      expect(error.message).to.equal('Bad Request');
      expect(error.metadata).to.eql({
        reason: REASON
      });
    });
  });

  describe('401 Authorization Error', function classes() {
    it('has the correct response code and sets a reason string', function behavior() {
      const REASON = 'static from plastic slide rules';
      const error = new Errors.AuthorizationError(REASON);

      expect(error.code).to.equal(401);
      expect(error.name).to.equal('Unauthorized');
      expect(error.message).to.equal('Unauthorized');
      expect(error.metadata).to.eql({
        reason: REASON
      });
    });
  });

  describe('404 Not Found Error', function classes() {
    it('has the correct response code and sets method and path strings', function behavior() {
      const error = new Errors.NotFoundError('GET', '/after/it');

      expect(error.code).to.equal(404);
      expect(error.name).to.equal('NotFound');
      expect(error.message).to.equal('Not Found');
      expect(error.metadata).to.eql({
        method: 'GET',
        path: '/after/it'
      });
    });
  });
});
