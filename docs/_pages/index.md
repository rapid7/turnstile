---
layout: default
title: Home

permalink: /
icon: home
order: 1
---

# Turnstile

Turnstile is an HTTP(S) proxy that implements authentication and authorization controls for any HTTP API service. The goal of the project is to support pluggable providers for authentication, authorization-policy, rate-limiting, and logging/audit enforcement.

## Getting Started

Turnstile is a NodeJS application. It requires [NodeJS v4, `>= 4.6.1`](https://nodejs.org/dist/v4.6.1/) to be installed.

### Debian/Ubuntu

Fetch a release `deb` package from [GitHub Releases] and install with `dpkg`:

```bash
$ sudo dpkg -l turnstile_VERSION_amd64.deb
```

### Other x86_64 Linux

Fetch and unpack a `tzg` release artifact from [GitHub Releases]

```bash
$ mkdir /opt/turnstile
$ tar -xzf turnstile_VERSION.tgz -C /opt/turnstile
```

**Note** Turnstile depends upon [node-libuuid], which is statically linked to `uuid.c`. The released artifacts were built on `x86_64` Linux platforms, and will likely only run in similar environments.

### From Source

Fetch and unpack a `Source code` release artifact from [GitHub Releases]. This is a tarball/zip of the tagged commit on GitHub that was used to generate the x86_64 artifacts.

**Note** Your system must have `uuid.h` and `uuid.c` in its include path. On Ubuntu 14.04, the `uuid-dev` package provides these sources.

```bash
$ mkdir /opt/turnstile
$ tar -xzf VERSION.tgz --strip-components 1 -C /opt/turnstile
$ cd /opt/turnstile && npm install
```

### Configure

* Create a JSON configuration file. It will require, at least, that the hostname and port of the upstream service be specified. The path to the local key database will likely also need to be specified:

  ```json
  {
    "service": {
      "port": 9301,
      "hostname": "localhost"
    },
    "local": {
      "db": {
        "path": "data/keys.json"
      }
    }
  }
  ```

* Create a local key database file. This is must contain a JSON object of `Key-ID: Secret` key/value pairs:

  ```json
  {
    "1bb4e49e1f516bad2bfee04a5137f8135bebbe69e286c47c": "14lbl1e09f5jtsryAPoPTI32J0uHKi/dFnE1g/t6S8syLoL43C96C9Hn8OwVl2Xd"
  }
  ```

  **Note** Turnstile does not care about the length or format of either the ID or Secret strings, but both should be of suitable length and randomness as to make brute-force attacks unfeasible. Encoding limitations of client consumers should also be considered.

### Run It

```bash
$ /opt/turnstile/bin/server -c PATH/To/config.json
```

:tada:

[GitHub Releases]: https://github.com/rapid7/turnstile/releases
[node-libuuid]: https://www.npmjs.com/package/node-libuuid
