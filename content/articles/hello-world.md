---
title: "Hello, world (again)"
description: "A new home for write-ups on the technical problems I've hit, and the projects that came out of them."
date: 2026-09-24
kind: note
tags: [meta, nuxt]
draft: false
devto: false
---

This site is a static Nuxt build on GitHub Pages. Posts are markdown files in the repo, and the editor I write them in is on this very site: it commits straight to `main` through the GitHub API, and a workflow rebuilds and redeploys.

Some posts are also syndicated to [dev.to](https://dev.to/mackoverflow). When they are, this site is the canonical URL.

```ts
// the whole publishing pipeline, roughly
const post = await editor.compose()
await github.putFile(`content/articles/${slug}.md`, post, 'post: add "…"')
// → GitHub Actions → nuxt generate → Pages → (optionally) dev.to
```

More soon.
