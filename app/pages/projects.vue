<script setup lang="ts">
import { projects } from '~/data/site'
import { skills, skillByKey, skillMatches } from '~/data/skills'
useSeoMeta({ title: 'Projects', description: 'Things Kenneth McKrola has built.' })
const { data: repos } = await useGithubRepos()

const route = useRoute()
const router = useRouter()

// Active filter lives in ?lang= so skill logos on the home page can deep-link here.
const active = computed(() => {
  const q = route.query.lang
  return skillByKey(String(Array.isArray(q) ? q[0] : q || '')) ?? null
})
const setLang = (key: string | null) =>
  router.replace({ query: key && key !== active.value?.key ? { lang: key } : {} })

// Only offer skills that actually match at least one repo or curated project.
const repoLabels = (r: { languages: Record<string, number>; topics?: string[]; language: string | null }) =>
  [...Object.keys(r.languages), ...(r.topics || []), r.language || '']
const available = computed(() =>
  skills.filter((k) => (repos.value || []).some((r) => skillMatches(k, repoLabels(r))) || projects.some((p) => skillMatches(k, p.tags))),
)

const shownProjects = computed(() => (active.value ? projects.filter((p) => skillMatches(active.value!, p.tags)) : projects))
const shownRepos = computed(() => {
  const all = repos.value || []
  return active.value ? all.filter((r) => skillMatches(active.value!, repoLabels(r))) : all.slice(0, 6)
})

// Composition tags: top languages by bytes, so the tile shows what a repo is really made of.
const repoTags = (r: { languages: Record<string, number>; language: string | null; topics?: string[] }) => {
  const total = Object.values(r.languages).reduce((a, b) => a + b, 0) || 1
  const langs = Object.entries(r.languages).map(([n, b]) => `${n.toLowerCase()} ${b / total < 0.01 ? "<1" : Math.round((b / total) * 100)}%`)
  return langs.length ? [...langs, ...(r.topics || [])] : [r.language || 'code', ...(r.topics || [])]
}
</script>

<template>
  <div class="container section">
    <h1 v-reveal>projects</h1>

    <div v-reveal class="filters" role="group" aria-label="Filter projects by language or technology">
      <span class="muted">filter:</span>
      <button class="chip" :class="{ on: !active }" @click="setLang(null)">all</button>
      <button v-for="k in available" :key="k.key" class="chip" :class="{ on: active?.key === k.key }" :aria-pressed="active?.key === k.key" @click="setLang(k.key)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="k.path" fill="currentColor" /></svg>{{ k.name }}
      </button>
    </div>

    <div v-if="shownProjects.length" class="tiles">
      <ProjectTile v-for="(p, i) in shownProjects" :key="p.name" :project="p" :delay="i * 70" />
    </div>
    <p v-else class="muted">no curated projects tagged {{ active?.name }} yet.</p>

    <h2 v-reveal class="section-title" style="margin-top: 3.5rem">
      {{ active ? `repos containing ${active.name}` : 'recently pushed' }}
      <small><a href="https://github.com/Mack-Overflow" target="_blank" rel="me noopener">github ↗</a></small>
    </h2>
    <div v-if="shownRepos.length" class="tiles">
      <ArticleTile v-for="(r, i) in shownRepos" :key="r.name" :to="r.html_url" :title="r.name" :description="r.description || ''"
        :date="r.pushed_at" :tags="repoTags(r)" external :delay="i * 60" />
    </div>
    <p v-else-if="active" class="muted">no public repos match {{ active.name }}. it lives in private/client work — ask me about it.</p>
    <p v-else class="muted">could not load repos at build time. see <a href="https://github.com/Mack-Overflow">github</a>.</p>
  </div>
</template>

<style scoped>
.filters { display: flex; flex-wrap: wrap; align-items: center; gap: 0.45rem; margin: -0.5rem 0 1.75rem; font-size: 0.78rem; }
.chip {
  display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.7rem; border: 1px solid var(--line-strong); border-radius: 999px;
  background: transparent; color: var(--green-dim); cursor: pointer; font-size: 0.78rem; line-height: 1.6;
  transition: background 0.2s var(--ease), color 0.2s var(--ease), border-color 0.2s var(--ease);
}
.chip svg { width: 14px; height: 14px; }
.chip:hover { color: var(--green); background: var(--green-faint); }
.chip.on { background: var(--green); border-color: var(--green); color: #000; }
</style>
