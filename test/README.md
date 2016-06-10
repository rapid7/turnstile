Tests
=====

## Resources

* `config` and `log` implement the global `Config` and `Log` interfaces that other modules expect in their namespaces.
* `fixtures` exports a number of useful objects for test inputs, verification, etc.
* `http` implements test stubs of `HTTP.IncomingMessage` and `HTTP.ServerResponse` for controller testing. It also exports a wrapper around `HTTP.Server` for HTTP client library testing.
* `keys.json` is a test data file for the storage module.
