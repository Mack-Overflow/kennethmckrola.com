#!/usr/bin/env node
// Syndicates content/articles/*.md with `devto: true` to dev.to, with this site as canonical_url.
// Creates the article on first run and writes devto_id / devto_url back into the frontmatter.
// Later runs update the dev.to copy only when the content hash changed.
// Env: DEVTO_API_KEY (required; exits 0 with a notice if missing), NUXT_PUBLIC_SITE_URL, DRY_RUN=1
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import { createHash } from 'node:crypto'
import matter from 'gray-matter'

const API_KEY = process.env.DEVTO_API_KEY
const SITE = (process.env.NUXT_PUBLIC_SITE_URL || 'https://kennethmckrola.com').replace(/\/$/, '')
const DRY = !!process.env.DRY_RUN
const DIR = 'content/articles'

if (!API_KEY && !DRY) {
  console.log('devto: DEVTO_API_KEY not set, skipping syndication')
  process.exit(0)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const absolutize = (md) =>
  md
    .replace(/(!?\[[^\]]*\]\()\/(?!\/)/g, `$1${SITE}/`) // markdown links/images starting with /
    .replace(/(src=["'])\/(?!\/)/g, `$1${SITE}/`) // html img src="/..."
const devtoTag = (t) => String(t).toLowerCase().replace(/[^a-z0-9]/g, '')

async function api(method, path, body) {
  const res = await fetch(`https://dev.to/api${path}`, {
    method,
    headers: { 'api-key': API_KEY, 'Content-Type': 'application/json', Accept: 'application/vnd.forem.api-v1+json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = {}
  try { json = JSON.parse(text) } catch {}
  if (res.status === 429) { await sleep(5000); return api(method, path, body) }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${json.error || text.slice(0, 300)}`)
  return json
}

let changed = 0
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const full = join(DIR, file)
  const raw = readFileSync(full, 'utf8')
  const parsed = matter(raw)
  const { data, content } = parsed
  if (!data.devto || data.draft) continue

  const slug = basename(file, '.md')
  const canonical = `${SITE}/articles/${slug}`
  const body = absolutize(content.trim())
  const tags = [...new Set((data.tags || []).map(devtoTag).filter(Boolean))].slice(0, 4)
  const main_image = data.cover ? new URL(data.cover, SITE).href : undefined
  const article = { title: data.title, body_markdown: body, published: true, canonical_url: canonical, description: data.description || '', tags, ...(main_image ? { main_image } : {}) }
  const hash = createHash('sha1').update(JSON.stringify(article)).digest('hex').slice(0, 12)

  if (data.devto_id && data.devto_hash === hash) { console.log(`devto: ${slug} unchanged`); continue }

  if (DRY) { console.log(`devto: [dry] would ${data.devto_id ? 'update #' + data.devto_id : 'create'} ${slug}`, article); continue }

  try {
    let res
    if (data.devto_id) {
      res = await api('PUT', `/articles/${data.devto_id}`, { article })
      console.log(`devto: updated ${slug} → ${res.url}`)
    } else {
      res = await api('POST', '/articles', { article })
      console.log(`devto: created ${slug} → ${res.url}`)
    }
    data.devto_id = res.id
    data.devto_url = res.url
    data.devto_hash = hash
    writeFileSync(full, matter.stringify(content, data))
    changed++
    await sleep(1500)
  } catch (e) {
    console.error(`devto: FAILED ${slug}: ${e.message}`)
    process.exitCode = 1
  }
}
console.log(`devto: done, ${changed} file(s) updated`)
