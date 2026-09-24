<script setup lang="ts">
import type { Project } from '~/data/site'
defineProps<{ project: Project; delay?: number }>()
</script>

<template>
  <article v-reveal="{ delay }" class="tile lazy-block" :class="{ featured: project.featured }">
    <div class="meta">
      <span v-if="project.featured" class="tag">★ featured</span>
      <span v-for="t in project.tags" :key="t" class="muted">#{{ t }}</span>
    </div>
    <h3>{{ project.name }}</h3>
    <p>{{ project.blurb }}</p>
    <div class="actions">
      <a v-if="project.live" :href="project.live" class="btn sm" target="_blank" rel="noopener">live demo ↗</a>
      <a v-if="project.repo" :href="project.repo" class="btn sm ghost" target="_blank" rel="noopener">source ↗</a>
    </div>
  </article>
</template>

<style scoped>
.actions { display: flex; gap: 0.6rem; margin-top: 0.5rem; flex-wrap: wrap; }
</style>
