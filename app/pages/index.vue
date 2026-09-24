<script setup lang="ts">
import { profile, links, projects } from '~/data/site'

useSeoMeta({
  title: 'Kenneth McKrola',
  description: 'Technical challenges, write-ups, and projects from Kenneth McKrola.',
})

const feed = await useArticleFeed(6)
</script>

<template>
  <div>
    <section class="hero container">
      <p class="prompt muted">whoami</p>
      <h1><TypeWriter :text="profile.name" :speed="55" /></h1>
      <p class="tagline"><TypeWriter :text="profile.tagline" :speed="18" :delay="1200" /></p>
      <div class="hero-links">
        <a v-for="l in links" :key="l.href" :href="l.href" class="btn ghost sm" target="_blank" rel="me noopener">{{ l.label }} ↗</a>
      </div>
      <p class="scroll-hint muted">scroll ↓</p>
    </section>

    <section class="section container lazy-block">
      <h2 v-reveal class="section-title">technical challenges <small><NuxtLink to="/articles">all articles →</NuxtLink></small></h2>
      <div v-if="feed.length" class="tiles">
        <ArticleTile v-for="(a, i) in feed" :key="a.key" :to="a.to" :title="a.title" :description="a.description"
          :date="a.date" :tags="a.tags" :kind="a.kind" :external="a.external" :delay="i * 70" />
      </div>
      <p v-else v-reveal class="muted">nothing published yet. check back soon.</p>
    </section>

    <section class="section container lazy-block">
      <h2 v-reveal class="section-title">projects <small><NuxtLink to="/projects">more →</NuxtLink></small></h2>
      <div class="tiles">
        <ProjectTile v-for="(p, i) in projects" :key="p.name" :project="p" :delay="i * 70" />
      </div>
    </section>

  </div>
</template>

<style scoped>
.hero { min-height: calc(100vh - 56px); display: flex; flex-direction: column; justify-content: center; padding-top: 4rem; padding-bottom: 4rem; }
.tagline { font-size: clamp(1rem, 1.8vw, 1.2rem); color: var(--green); max-width: 720px; min-height: 2em; }
.hero-links { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 1rem; }
.scroll-hint { margin-top: auto; font-size: 0.75rem; animation: bob 2.4s ease-in-out infinite; }
@keyframes bob { 50% { transform: translateY(6px); } }
</style>
