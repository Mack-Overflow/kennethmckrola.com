# kennethmckrola.com

Static Nuxt 4 site, deployed to GitHub Pages, with an in-browser editor that commits posts to this repo.

## Local

```bash
nvm use            # node 22
npm install
npm run dev        # http://localhost:3000
npm run generate   # static build → .output/public
```

## Writing

Posts are markdown files in `content/articles/`. Frontmatter:

```yaml
title: "…"
description: "…"
date: 2026-09-24
kind: challenge | project | note
tags: [a, b]
cover: https://…            # optional
draft: false                # true hides it from the site
devto: false                # true → CI publishes to dev.to with this site as canonical
```
