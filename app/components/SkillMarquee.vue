<script setup lang="ts">
import { skills } from '~/data/skills'
// Track is rendered twice so the -50% translate loops seamlessly.
</script>

<template>
  <div class="band" aria-label="Skills and technologies">
    <p class="centered muted">my go-tos of writing 1s and 0s</p>
    <div class="marquee">
      <div class="track">
        <template v-for="n in 2" :key="n">
          <NuxtLink v-for="k in skills" :key="`${n}-${k.key}`" :to="{ path: '/projects', query: { lang: k.key } }"
            class="skill" :title="`projects using ${k.name}`" :aria-hidden="n === 2 || undefined" :tabindex="n === 2 ? -1 : undefined">
            <svg viewBox="0 0 24 24" role="img" :aria-label="k.name"><path :d="k.path" fill="currentColor" /></svg>
            <span class="label">{{ k.name }}</span>
          </NuxtLink>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Full-bleed black band that sits in front of the page grid. */
.band {
  position: relative; width: 100vw; margin: 2.25rem 0 0 calc(50% - 50vw);
  padding: 1.1rem 0 1.25rem; background: #000;
  border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
}
.centered {
  text-align: center;;
}
.caption { margin: 0 0 0.6rem; padding: 0 20px; font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; text-align: center; }
.caption::before { content: '// '; color: var(--green-dim); }
.more { text-transform: none; letter-spacing: 0; }

.marquee {
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}
.track { display: flex; width: max-content; gap: 2.75rem; padding: 0.25rem 1.375rem; animation: scroll 42s linear infinite; }
.marquee:hover .track, .marquee:focus-within .track { animation-play-state: paused; }
@keyframes scroll { to { transform: translateX(-50%); } }

.skill {
  display: flex; flex-direction: column; align-items: center; gap: 0.45rem; color: var(--green-dim);
  text-decoration: none !important; transition: color 0.25s var(--ease), transform 0.25s var(--ease), filter 0.25s var(--ease);
}
.skill:hover, .skill:focus-visible { color: var(--green-light); transform: translateY(-2px); filter: drop-shadow(0 0 10px rgba(0, 220, 130, 0.5)); outline: none; }
.skill svg { width: 40px; height: 40px; display: block; }
.label { font-size: 0.68rem; letter-spacing: 0.04em; color: var(--muted); white-space: nowrap; transition: color 0.25s; }
.skill:hover .label { color: var(--green); }

@media (prefers-reduced-motion: reduce) {
  .track { animation: none; width: auto; flex-wrap: wrap; justify-content: center; gap: 1.75rem 2rem; }
  .marquee { mask-image: none; -webkit-mask-image: none; }
  .track > :nth-child(n + 16) { display: none; }
}
@media (max-width: 640px) {
  .band { margin-top: 1.5rem; }
  .skill svg { width: 32px; height: 32px; }
  .track { gap: 2rem; }
}
</style>
