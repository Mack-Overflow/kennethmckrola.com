<script setup lang="ts">
import { projects } from '~/data/site'
useSeoMeta({ title: 'Projects', description: 'Things Kenneth McKrola has built.' })
const { data: repos } = await useGithubRepos()
</script>

<template>
  <div class="container section">
    <h1 v-reveal>projects</h1>
    <div class="tiles">
      <ProjectTile v-for="(p, i) in projects" :key="p.name" :project="p" :delay="i * 70" />
    </div>

    <h2 v-reveal class="section-title" style="margin-top: 3.5rem">recently pushed <small><a href="https://github.com/Mack-Overflow" target="_blank" rel="me noopener">github ↗</a></small></h2>
    <div v-if="repos?.length" class="tiles">
      <ArticleTile v-for="(r, i) in repos" :key="r.name" :to="r.html_url" :title="r.name" :description="r.description || ''"
        :date="r.pushed_at" :tags="[r.language || 'code', ...(r.topics || [])]" external :delay="i * 60" />
    </div>
    <p v-else class="muted">could not load repos at build time. see <a href="https://github.com/Mack-Overflow">github</a>.</p>
  </div>
</template>
