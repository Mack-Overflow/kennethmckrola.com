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

Or use the editor at `/login` (type the secret word on that page to reveal the token prompt).
It needs a GitHub fine-grained personal access token scoped to this repo with **Contents: read and write**.
Every save is a commit to `main`, which triggers the deploy workflow. Images pasted or dropped into the editor
are committed to `public/images/posts/<slug>/`.

## Deploy (GitHub Pages)

1. Repo → Settings → Pages → Source: **GitHub Actions**.
2. Settings → Pages → Custom domain: `kennethmckrola.com` (the `public/CNAME` file is already in place).
3. DNS at your registrar:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` for `www` → `mack-overflow.github.io`
4. Tick "Enforce HTTPS" once the cert issues.

## dev.to syndication

1. dev.to → Settings → Extensions → generate an API key.
2. Repo → Settings → Secrets → Actions → `DEVTO_API_KEY`.
3. Set `devto: true` on a post. On the next deploy, `scripts/publish-devto.mjs` creates the article on dev.to
   with `canonical_url` pointing here, then commits `devto_id` / `devto_url` / `devto_hash` back into the frontmatter.
   Later edits update the dev.to copy when the content changes.

Dry run locally: `npm run devto:dry`.
