---
layout: default
title: Releases

icon: tags
order: 300
---

# {{ page.title }}

Releases are published to [GitHub Releases] with tarball and DEB package artifacts.

## Perform a Releases

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

## Documentation

To generate JSDoc and coverage reports locally, run

```bash
$ npm run doc
$ npm run cover
```

To serve a local version of the GitHub Pages site, run

```bash
$ bundle install
$ cd docs
$ bundle exec jekyll serve
```

and navigate a browser to [http://127.0.0.1:4000/](http://127.0.0.1:4000{{ site.baseurl }}/)

### Adding Documentation Pages

Add markdown files to `docs/_pages`. Files must have a `frontmatter` header with, at least, the following attributes:

```
---
layout: default
title: Documentation
icon: tags
order: 200
---
```

* `icon` is the [Font Awesome] icon that will be used in the generated navigation pane
* `order` defines the sorting behavior of pages in the generated navigation pane

Pages are rendered by Jekyll and can include [Liquid template] tags and filters.

[GitHub Releases]: https://github.com/rapid7/turnstile/releases
[npm-version]: https://docs.npmjs.com/cli/version
[github.com]: https://www.github.com
[Font Awesome]: http://fontawesome.io/icons/
[Liquid template]: https://jekyllrb.com/docs/templates/
