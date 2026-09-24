<script setup lang="ts">
defineProps<{
  to: string
  title: string
  description?: string
  date?: string
  tags?: string[]
  kind?: string
  external?: boolean
  delay?: number
}>()
const NuxtLink = resolveComponent('NuxtLink')
const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '')
</script>

<template>
  <a v-if="external" v-reveal="{ delay }" :href="to" target="_blank" rel="noopener" class="tile lazy-block">
    <span class="arrow">↗</span>
    <div class="meta">
      <span v-if="kind" class="tag">{{ kind }}</span>
      <span v-for="t in (tags || []).slice(0, 3)" :key="t" class="muted">#{{ t }}</span>
    </div>
    <h3>{{ title }}</h3>
    <p v-if="description">{{ description }}</p>
    <div class="meta"><span class="date">{{ fmt(date) }}</span></div>
  </a>
  <component :is="NuxtLink" v-else v-reveal="{ delay }" :to="to" class="tile lazy-block">
    <span class="arrow">→</span>
    <div class="meta">
      <span v-if="kind" class="tag">{{ kind }}</span>
      <span v-for="t in (tags || []).slice(0, 3)" :key="t" class="muted">#{{ t }}</span>
    </div>
    <h3>{{ title }}</h3>
    <p v-if="description">{{ description }}</p>
    <div class="meta"><span class="date">{{ fmt(date) }}</span></div>
  </component>
</template>
