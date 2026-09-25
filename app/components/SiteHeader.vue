<script setup lang="ts">
import { links } from '~/data/site'
const route = useRoute()
const router = useRouter()
const nav = [
  { to: '/', label: 'home' },
  { to: '/articles', label: 'articles' },
  { to: '/projects', label: 'projects' },
]

// The brand reads like a shell prompt: `~/kennethmckrola/<current page>`. The page part is an input.
// Type a path and press enter to navigate; clicking `~/kennethmckrola` is the only way back home from here.
const current = () => route.path.replace(/^\/+|\/+$/g, '')
const typed = ref(current())
const bad = ref(false)
const pathInput = ref<HTMLInputElement>()
watch(() => route.path, () => { typed.value = current(); bad.value = false })

async function isPage(path: string) {
  const r = router.resolve(path)
  if (!r.matched.length) return false
  if (r.name === 'articles-slug') {
    // The route matches any slug; make sure the article actually exists before sending someone to a 404.
    // Drafts count: the article page itself serves them when you know the URL.
    const hit = await queryCollection('articles').path(path).select('path').first().catch(() => null)
    return !!hit
  }
  return true
}

async function go() {
  const path = '/' + typed.value.trim().replace(/^(~\/)?(kennethmckrola\.com|kennethmckrola)?\/*/, '').replace(/^\/+|\/+$/g, '')
  if (path === '/') { typed.value = current(); return } // home is a click on the brand, not an empty enter
  if (path === '/' + current()) return pathInput.value?.blur()
  if (await isPage(path)) {
    pathInput.value?.blur()
    return navigateTo(path)
  }
  bad.value = true
  setTimeout(() => { bad.value = false; typed.value = current() }, 600)
}
function reset() { typed.value = current(); bad.value = false }
</script>

<template>
  <header class="header">
    <div class="container row">
      <div class="brand">
        <NuxtLink to="/" class="home"><span class="muted">~/</span>kennethmckrola</NuxtLink><span class="muted">/</span><input
          ref="pathInput" v-model="typed" class="path" :class="{ bad }" :style="{ width: `${Math.max(typed.length, 1)}ch` }"
          type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="path: type a page and press enter"
          @keydown.enter.prevent="go" @keydown.esc="reset(); pathInput?.blur()" @blur="reset" /><span class="cursor" />
      </div>
      <nav class="nav">
        <NuxtLink v-for="n in nav" :key="n.to" :to="n.to" :class="{ active: n.to === '/' ? route.path === '/' : route.path.startsWith(n.to) }">
          {{ n.label }}
        </NuxtLink>
        <span class="sep">|</span>
        <a v-for="l in links" :key="l.href" :href="l.href" target="_blank" rel="me noopener">{{ l.label }}</a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header { position: sticky; top: 0; z-index: 20; backdrop-filter: blur(10px); background: rgba(0, 0, 0, 0.7); border-bottom: 1px solid var(--line); }
.row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; height: 56px; }
.brand { display: inline-flex; align-items: center; font-weight: 600; color: var(--green-light); white-space: nowrap; min-width: 0; }
.home { color: inherit; text-decoration: none !important; }
.path { background: transparent; border: 0; outline: none; padding: 0; margin: 0; color: var(--green-light); font-weight: 600; min-width: 1ch; max-width: 40vw; caret-color: var(--green); transition: color 0.2s; }
.path:focus { color: var(--green); }
.path:focus + .cursor { display: none; } /* the real caret takes over while typing */
.path.bad { color: var(--danger); animation: shake 0.3s; }
@keyframes shake { 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
.nav { display: flex; gap: 1rem; font-size: 0.85rem; flex-wrap: wrap; justify-content: flex-end; }
.nav a { color: var(--green-dim); }
.nav a:hover, .nav a.active { color: var(--green); text-decoration: none; }
.nav a.active::before { content: '> '; }
.sep { color: var(--line-strong); }
@media (max-width: 640px) { .sep, .nav a[target] { display: none; } .path { max-width: 30vw; } }
</style>
