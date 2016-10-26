---
layout: default
title: Documentation
---

# {{ page.title }}

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

and navigate a browser to [http://127.0.0.1:4000/](http://127.0.0.1:4000/)

## Adding Documentation

Add markdown files to `docs/_pages`. Files must have a frontmatter header like

```
---
layout: default
title: Documentation
---
```

Pages are rendered by Jekyll and can include [Liquid template](https://jekyllrb.com/docs/templates/) tags and filters.
