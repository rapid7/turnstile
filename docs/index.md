---
layout: default
title: Home
---

# Turnstile

Turnstile is an HTTP(S) proxy that implements authentication and authorization controls for any HTTP API service. The goal of the project is to support pluggable providers for authentication, authorization-policy, rate-limiting, and logging/audit enforcement.

## Configuration


```javascript
{
  listen: {
    port: 9300,
    bind: '0.0.0.0'
  },
  log: {
    level: 'info'
  },
  correlation: {
    enable: true,
    header: 'X-Request-Identifier'
  },
  local: {
    db: {
      path: 'data/keys.json',
      signal: 'SIGHUP'
    },
    algorithm: 'sha256',
    skew: 1000
  },
  service: {
    port: 9301,
    hostname: 'localhost'
  }
}
```
