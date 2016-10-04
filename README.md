Turnstile
=========

_An HTTP proxy service to add role-based access control to any REST-like API._

[![Build Status](https://travis-ci.org/rapid7/turnstile.svg?branch=master)](https://travis-ci.org/rapid7/turnstile)
[![Coverage Status](https://coveralls.io/repos/github/rapid7/turnstile/badge.svg?branch=master)](https://coveralls.io/github/rapid7/turnstile?branch=master)

Turnstile is a minimalistic middleware server that applies consistent access control policies to any HTTP service with path-based routing. The goal of the project is to support pluggable providers for authentication, authorization-policy, rate-limiting, and logging/reporting.

## Documentation

* Code API: [https://rapid7.github.io/turnstile](http://rapid7.github.io/turnstile/jsdoc/)

## Releasing
To cut a release do the following:

* [Bump the version][npm-version]
* Build and upload a package
* Create a new release on github.com

This can be accomplished by running the following commands:
~~~bash
$ npm version minor
$ bundle exec rake default
~~~
To be able to create a new release on [github.com], you must have the following environment variables set:
 * `GITHUB_CLIENT_ID`
 * `GITHUB_CLIENT_TOKEN`

and the user and token must have the appropriate permissions in this repository.

[npm-version]: https://docs.npmjs.com/cli/version
[github.com]: https://www.github.com
