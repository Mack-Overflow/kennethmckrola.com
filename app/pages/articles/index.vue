<script setup lang="ts">
useSeoMeta({ title: 'Articles', description: 'Write-ups on technical challenges and projects.' })
const { data: articles } = await useAsyncData('all-articles', () =>
  queryCollection('articles').where('draft', '=', false).order('date', 'DESC').all(),
)
const filter = ref<string>('all')
const kinds = computed(() => ['all', ...new Set((articles.value || []).map((a) => a.kind))])
const shown = computed(() => (articles.value || []).filter((a) => filter.value === 'all' || a.kind === filter.value))
</script>

<template>
  <div class="container section">
    <h1 v-reveal>articles</h1>
    <div v-reveal class="filters">
      <button v-for="k in kinds" :key="k" class="btn sm" :class="{ ghost: filter !== k }" @click="filter = k">{{ k }}</button>
    </div>
    <div v-if="shown.length" class="tiles">
      <ArticleTile v-for="(a, i) in shown" :key="a.path" :to="a.path" :title="a.title" :description="a.description"
        :date="a.date" :tags="a.tags" :kind="a.kind" :delay="(i % 6) * 60" />
    </div>
    <p v-else class="muted">nothing here yet.</p>
  </div>
</template>

<style scoped>
.filters { display: flex; gap: 0.5rem; margin: 1rem 0 2rem; flex-wrap: wrap; }
</style>
