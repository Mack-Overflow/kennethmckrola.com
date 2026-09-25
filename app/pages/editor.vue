<script setup lang="ts">
import { parseFrontmatter, stringifyFrontmatter, slugify, type Meta } from '~/utils/frontmatter'
import { fileToB64, GhError } from '~/composables/useGithub'

definePageMeta({ layout: 'bare' })
useSeoMeta({ title: 'editor', robots: 'noindex, nofollow' })
useHead({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] })

const config = useRuntimeConfig()
const session = useSession()
const gh = useGithub()

const DIR = 'content/articles'
const KINDS = ['challenge', 'project', 'note']

interface PostRef { name: string; path: string; sha: string }
const posts = ref<PostRef[]>([])
const loadingPosts = ref(false)

// Current document
const meta = reactive({
  title: '', description: '', date: today(), kind: 'challenge', tags: '' as string, cover: '', draft: false, devto: false,
  devto_id: undefined as number | undefined, devto_url: undefined as string | undefined,
})
const body = ref('')
const slug = ref('')
const slugTouched = ref(false)
const currentSha = ref<string | undefined>()
const isExisting = computed(() => !!currentSha.value)
const dirty = ref(false)
const commitMsg = ref('')
const busy = ref(false)
const preview = ref(false)
const log = ref<Array<{ t: string; m: string; cls?: string }>>([])
const ready = ref(false)

function today() { return new Date().toISOString().slice(0, 10) }
function say(m: string, cls?: string) {
  log.value.push({ t: new Date().toLocaleTimeString([], { hour12: false }), m, cls })
  if (log.value.length > 200) log.value.shift()
  nextTick(() => { const el = document.querySelector('.log .body'); if (el) el.scrollTop = el.scrollHeight })
}

watch(() => meta.title, (t) => { if (!slugTouched.value && !isExisting.value) slug.value = slugify(t) })
watch([meta, body, slug], () => { if (ready.value) dirty.value = true }, { deep: true })

onMounted(async () => {
  if (!session.load()) return navigateTo('/login', { replace: true })
  try {
    const u = await gh.me()
    if (u.login.toLowerCase() !== config.public.ownerLogin.toLowerCase()) throw new Error('wrong account')
    session.user.value = u
  } catch {
    session.clear()
    return navigateTo('/login', { replace: true })
  }
  say(`hello @${session.user.value?.login}. connected to ${config.public.repo}.`)
  await refreshPosts()
  window.addEventListener('keydown', onKey)
  window.addEventListener('beforeunload', onLeave)
  ready.value = true
})
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', onLeave) })
function onLeave(e: BeforeUnloadEvent) { if (dirty.value) { e.preventDefault(); e.returnValue = '' } }
function onKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); commit() }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p' && e.shiftKey) { e.preventDefault(); preview.value = !preview.value }
}

async function refreshPosts() {
  loadingPosts.value = true
  try {
    posts.value = (await gh.listDir(DIR)).filter((f) => f.name.endsWith('.md')).map((f) => ({ name: f.name.replace(/\.md$/, ''), path: f.path, sha: f.sha })).sort((a, b) => a.name.localeCompare(b.name))
    say(`${posts.value.length} post(s) in ${DIR}/`)
  } catch (e: any) { say(`✗ could not list posts: ${e.message}`, 'err') }
  loadingPosts.value = false
}

function newPost() {
  if (dirty.value && !confirm('discard unsaved changes?')) return
  ready.value = false
  Object.assign(meta, { title: '', description: '', date: today(), kind: 'challenge', tags: '', cover: '', draft: false, devto: false, devto_id: undefined, devto_url: undefined })
  body.value = ''
  slug.value = ''
  slugTouched.value = false
  currentSha.value = undefined
  commitMsg.value = ''
  dirty.value = false
  say('new post. go.')
  nextTick(() => (ready.value = true))
}

async function openPost(p: PostRef) {
  if (dirty.value && !confirm('discard unsaved changes?')) return
  busy.value = true
  try {
    const { text, sha } = await gh.getFile(p.path)
    const { meta: m, body: b } = parseFrontmatter(text)
    ready.value = false
    Object.assign(meta, {
      title: String(m.title ?? ''), description: String(m.description ?? ''), date: String(m.date ?? today()),
      kind: String(m.kind ?? 'challenge'), tags: Array.isArray(m.tags) ? m.tags.join(', ') : String(m.tags ?? ''),
      cover: String(m.cover ?? ''), draft: m.draft === true, devto: m.devto === true,
      devto_id: typeof m.devto_id === 'number' ? m.devto_id : undefined, devto_url: m.devto_url ? String(m.devto_url) : undefined,
    })
    body.value = b
    slug.value = p.name
    slugTouched.value = true
    currentSha.value = sha
    commitMsg.value = ''
    dirty.value = false
    say(`opened ${p.path} (${text.length} chars)`)
    nextTick(() => (ready.value = true))
  } catch (e: any) { say(`✗ ${e.message}`, 'err') }
  busy.value = false
}

function compose(): string {
  const m: Meta = {
    title: meta.title.trim(),
    description: meta.description.trim(),
    date: meta.date,
    kind: meta.kind,
    tags: meta.tags.split(',').map((t) => t.trim()).filter(Boolean),
    cover: meta.cover.trim() || undefined,
    draft: meta.draft,
    devto: meta.devto,
    devto_id: meta.devto_id,
    devto_url: meta.devto_url,
  }
  return stringifyFrontmatter(m, body.value)
}

async function commit(asDraft?: boolean) {
  if (busy.value) return
  if (!meta.title.trim()) return say('✗ needs a title', 'err')
  if (!slug.value) return say('✗ needs a slug', 'err')
  if (asDraft !== undefined) meta.draft = asDraft
  busy.value = true
  const path = `${DIR}/${slug.value}.md`
  const msg = commitMsg.value.trim() || `${isExisting.value ? 'post: update' : 'post: add'} "${meta.title.trim()}"`
  say(`$ git commit -m "${msg}"`)
  try {
    const res = await gh.putFile(path, compose(), msg, currentSha.value)
    currentSha.value = res.content.sha
    dirty.value = false
    commitMsg.value = ''
    say(`✓ ${res.commit.sha.slice(0, 7)} pushed → ${path}`, 'ok')
    if (meta.draft) say('draft: true → hidden from the site until you publish')
    if (meta.devto && !meta.devto_id) say('devto: true → CI will publish to dev.to with this site as canonical, then write the id back here')
    if (!meta.draft) say(`live in ~2 min at ${config.public.siteUrl}/articles/${slug.value}`)
    await refreshPosts()
    watchDeploy(res.commit.sha)
  } catch (e: any) {
    if (e instanceof GhError && e.status === 409) say('✗ conflict: file changed on GitHub since you opened it. reopen it and re-apply.', 'err')
    else if (e instanceof GhError && e.status === 422 && !currentSha.value) say(`✗ ${slug.value}.md already exists. open it from the list instead.`, 'err')
    else say(`✗ ${e.message}`, 'err')
  }
  busy.value = false
}

async function remove() {
  const p = posts.value.find((x) => x.name === slug.value)
  if (!p || !currentSha.value) return
  if (!confirm(`delete ${p.path} from the repo? this commits a deletion.`)) return
  busy.value = true
  try {
    await gh.deleteFile(p.path, currentSha.value, `post: remove "${meta.title}"`)
    say(`✓ deleted ${p.path}`, 'ok')
    newPost()
    await refreshPosts()
  } catch (e: any) { say(`✗ ${e.message}`, 'err') }
  busy.value = false
}

async function upload(file: File): Promise<string> {
  const folder = slug.value || 'misc'
  const name = `${Date.now().toString(36)}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${(file.name.split('.').pop() || 'png').toLowerCase()}`
  const path = `public/images/posts/${folder}/${name}`
  await gh.putFile(path, { base64: await fileToB64(file) }, `img: ${name} for ${folder}`)
  return `${config.public.siteUrl}/images/posts/${folder}/${name}`
}

async function uploadCover(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  say(`uploading cover ${f.name}…`)
  try { meta.cover = await upload(f); say('✓ cover committed', 'ok') } catch (err: any) { say(`✗ ${err.message}`, 'err') }
}

let deployTimer: any
async function watchDeploy(sha: string) {
  clearTimeout(deployTimer)
  let tries = 0
  const poll = async () => {
    try {
      const { workflow_runs } = await gh.latestRuns()
      const run = workflow_runs.find((r) => r.head_sha === sha)
      if (run?.status === 'completed') {
        say(run.conclusion === 'success' ? `✓ deployed → ${config.public.siteUrl}/articles/${slug.value}` : `✗ deploy ${run.conclusion}: ${run.html_url}`, run.conclusion === 'success' ? 'ok' : 'err')
        return
      }
      if (run && tries === 0) say(`⏳ deploy running: ${run.html_url}`)
    } catch {}
    if (++tries < 40) deployTimer = setTimeout(poll, 10000)
  }
  deployTimer = setTimeout(poll, 8000)
}

function logout() { session.clear(); navigateTo('/login') }
</script>

<template>
  <ClientOnly>
    <div class="ed">
      <header class="top">
        <NuxtLink to="/" class="brand"><span class="muted">~/</span>kennethmckrola<span class="muted">/editor</span></NuxtLink>
        <div class="spacer" />
        <span v-if="session.user.value" class="muted small">
          <img v-if="session.user.value.avatar_url" :src="session.user.value.avatar_url" class="avatar" alt="" /> @{{ session.user.value.login }}
        </span>
        <button class="btn ghost sm" @click="preview = !preview">{{ preview ? 'edit' : 'preview' }} <kbd>⌘⇧P</kbd></button>
        <button class="btn ghost sm" @click="logout">logout</button>
      </header>

      <div class="grid">
        <aside class="side">
          <div class="terminal">
            <div class="bar"><i /><i /><i /><span>ls {{ DIR }}</span><button class="mini" title="refresh" @click="refreshPosts">↻</button></div>
            <div class="body list">
              <button class="post new" @click="newPost">+ new post</button>
              <button v-for="p in posts" :key="p.path" class="post" :class="{ on: p.name === slug }" @click="openPost(p)">{{ p.name }}.md</button>
              <p v-if="!posts.length && !loadingPosts" class="muted small">no posts yet</p>
            </div>
          </div>

          <div class="terminal log">
            <div class="bar"><i /><i /><i /><span>log</span></div>
            <div class="body">
              <div v-for="(l, i) in log" :key="i" class="line" :class="l.cls"><span class="muted">{{ l.t }}</span> {{ l.m }}</div>
            </div>
          </div>
        </aside>

        <section class="main">
          <div class="meta">
            <div class="field span2">
              <label>title</label>
              <input v-model="meta.title" class="input title" placeholder="what did you wrestle with?" />
            </div>
            <div class="field span2">
              <label>description <span class="muted">(tile + meta description)</span></label>
              <input v-model="meta.description" class="input" placeholder="one or two sentences" />
            </div>
            <div class="field">
              <label>slug</label>
              <input v-model="slug" class="input" :disabled="isExisting" @input="slugTouched = true" />
            </div>
            <div class="field">
              <label>date</label>
              <input v-model="meta.date" class="input" type="date" />
            </div>
            <div class="field">
              <label>kind</label>
              <select v-model="meta.kind" class="input"><option v-for="k in KINDS" :key="k" :value="k">{{ k }}</option></select>
            </div>
            <div class="field">
              <label>tags <span class="muted">(comma separated)</span></label>
              <input v-model="meta.tags" class="input" placeholder="nuxt, performance, postgres" />
            </div>
            <div class="field span2">
              <label>cover image url <span class="muted">(optional)</span></label>
              <div class="row">
                <input v-model="meta.cover" class="input" placeholder="https://kennethmckrola.com/images/…" />
                <label class="btn ghost sm">upload<input type="file" accept="image/*" hidden @change="uploadCover" /></label>
              </div>
            </div>
            <div class="field span2 toggles">
              <label class="check"><input v-model="meta.draft" type="checkbox" /> draft (hidden on site)</label>
              <label class="check"><input v-model="meta.devto" type="checkbox" /> syndicate to dev.to (canonical → this site)</label>
              <a v-if="meta.devto_url" :href="meta.devto_url" target="_blank" class="small">on dev.to ↗ (#{{ meta.devto_id }})</a>
            </div>
          </div>

          <EditorPostEditor v-show="!preview" v-model="body" :upload="upload" @log="say" />
          <div v-if="preview" class="terminal">
            <div class="bar"><i /><i /><i /><span>preview · {{ slug || 'untitled' }}.md</span></div>
            <div class="body">
              <NuxtErrorBoundary>
                <MDC :value="body" tag="article" class="prose" :parser-options="{ highlight: false }" />
                <template #error="{ error }"><p class="err">preview failed: {{ error }}</p></template>
              </NuxtErrorBoundary>
            </div>
          </div>

          <div class="actions">
            <input v-model="commitMsg" class="input msg" :placeholder="`commit message (default: post: ${isExisting ? 'update' : 'add'} &quot;${meta.title || '…'}&quot;)`" @keydown.enter="commit()" />
            <button class="btn" :disabled="busy || !meta.title" @click="commit(false)">{{ busy ? 'working…' : 'commit & publish' }} <kbd>⌘S</kbd></button>
            <button class="btn ghost" :disabled="busy || !meta.title" @click="commit(true)">save as draft</button>
            <button v-if="isExisting" class="btn danger sm" :disabled="busy" @click="remove">delete</button>
            <span v-if="dirty" class="muted small">● unsaved</span>
          </div>
        </section>
      </div>
    </div>
    <template #fallback>
      <div class="container section"><p class="prompt cursor">loading editor</p></div>
    </template>
  </ClientOnly>
</template>

<style scoped>
.ed { min-height: 100vh; display: flex; flex-direction: column; }
.top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 0.75rem; height: 56px; padding: 0 20px; border-bottom: 1px solid var(--line); background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px); }
.brand { font-weight: 600; color: var(--green-light); text-decoration: none !important; }
.spacer { flex: 1; }
.avatar { width: 18px; height: 18px; border-radius: 50%; display: inline-block; vertical-align: middle; border: 1px solid var(--line-strong); }
.small { font-size: 0.78rem; }
kbd { font-size: 0.65rem; opacity: 0.6; border: 1px solid currentColor; border-radius: 3px; padding: 0 3px; margin-left: 2px; }
.grid { display: grid; grid-template-columns: 260px 1fr; gap: 1.2rem; padding: 1.2rem 20px 3rem; flex: 1; max-width: 1400px; width: 100%; margin: 0 auto; }
.side { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 72px; align-self: start; max-height: calc(100vh - 90px); }
.list { display: flex; flex-direction: column; gap: 2px; max-height: 40vh; overflow: auto; padding: 0.5rem; }
.post { text-align: left; background: transparent; border: 1px solid transparent; border-radius: 4px; padding: 0.3rem 0.6rem; color: var(--green-dim); cursor: pointer; font-size: 0.82rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post:hover { color: var(--green); background: var(--green-faint); }
.post.on { color: #000; background: var(--green); }
.post.new { color: var(--green); border-color: var(--line-strong); border-style: dashed; margin-bottom: 0.4rem; }
.mini { margin-left: auto; background: transparent; border: 0; color: var(--green-dim); cursor: pointer; }
.mini:hover { color: var(--green); }
.log { flex: 1; min-height: 160px; display: flex; flex-direction: column; }
.log .body { overflow: auto; flex: 1; font-size: 0.75rem; line-height: 1.5; }
.line { white-space: pre-wrap; word-break: break-word; }
.line.ok { color: var(--green-light); }
.line.err { color: var(--danger); }
.main { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; }
.span2 { grid-column: span 2; }
.title { font-size: 1.2rem; font-weight: 600; }
.row { display: flex; gap: 0.5rem; align-items: center; }
.toggles { flex-direction: row; flex-wrap: wrap; gap: 1.5rem; align-items: center; }
.actions { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; position: sticky; bottom: 0; padding: 0.8rem 0; background: linear-gradient(transparent, #000 30%); }
.msg { flex: 1; min-width: 220px; }
.err { color: var(--danger); }
@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
  .side { position: static; max-height: none; }
  .meta { grid-template-columns: 1fr 1fr; }
  .list { max-height: 24vh; }
}
</style>
