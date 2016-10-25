---
layout: default
title: Releasing
---

# {{ page.title }}

To perform a release do the following:

* [Bump the version][npm-version]
* Build and upload a package
* Create a new release on github.com

This can be accomplished by running the following commands:

```bash
$ npm version minor
$ bundle exec rake default
```

To create new releases and artifacts on [github.com], you must set the following environment variables set with a valid user ID and token with the appropriate repository permissions:

* `GITHUB_CLIENT_ID`
* `GITHUB_CLIENT_TOKEN`

[npm-version]: https://docs.npmjs.com/cli/version
[github.com]: https://www.github.com
