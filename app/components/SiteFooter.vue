<script setup lang="ts">
import { links } from '~/data/site'
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container row">
      <span class="muted">© {{ year }} Kenneth McKrola · built with Nuxt, deployed on GitHub Pages</span>
      <span class="links">
        <a v-for="l in links" :key="l.href" :href="l.href" target="_blank" rel="me noopener">{{ l.label }}</a>
      </span>
    </div>
  </footer>
</template>

<style scoped>
.footer { border-top: 1px solid var(--line); padding: 1.5rem 0; font-size: 0.8rem; }
.row { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.links { display: flex; gap: 1rem; }
</style>
