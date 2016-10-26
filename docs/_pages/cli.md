---
layout: default
title: CLI
---

# {{ page.title }}

Turnstile includes a simple CLI to make signed HTTP requests against its public interface.

```bash
turnstile $ ./bin/turnt -h
Options:
  --method, -X    HTTP request method                           [default: "GET"]
  --payload, -d   HTTP request payload                          [default: false]
  --digest        Digest signing scheme                      [default: "sha256"]
  --header, -H    HTTP request headers                                   [array]
  --output, -o    Write output to a file                        [default: false]
  --identity, -u  Identity key for the request                        [required]
  --secret, -p    Secret key for the request                          [required]
```

A request payload can be passed in several ways:

* `-d 'request content'` will use the option's value as the request body.
* `-d @path/to/file.json` will read from a file on disk
* `-d -` will read from STDIN, e.g.

  ```
  foo_command | jq '.query.to.get.stuff' | turnt 'http://localhost:9300/path' -d -
  ```
