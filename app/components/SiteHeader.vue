<script setup lang="ts">
import { links } from '~/data/site'
const route = useRoute()
const nav = [
  { to: '/', label: 'home' },
  { to: '/articles', label: 'articles' },
  { to: '/projects', label: 'projects' },
]
</script>

<template>
  <header class="header">
    <div class="container row">
      <NuxtLink to="/" class="brand"><span class="muted">~/</span>kennethmckrola<span class="cursor" /></NuxtLink>
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
.brand { font-weight: 600; color: var(--green-light); text-decoration: none !important; }
.nav { display: flex; gap: 1rem; font-size: 0.85rem; flex-wrap: wrap; justify-content: flex-end; }
.nav a { color: var(--green-dim); }
.nav a:hover, .nav a.active { color: var(--green); text-decoration: none; }
.nav a.active::before { content: '> '; }
.sep { color: var(--line-strong); }
@media (max-width: 640px) { .sep, .nav a[target] { display: none; } }
</style>
