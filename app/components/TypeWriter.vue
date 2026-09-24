<script setup lang="ts">
const props = defineProps<{ text: string; speed?: number; delay?: number }>()
const shown = ref('')
const done = ref(false)
onMounted(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) { shown.value = props.text; done.value = true; return }
  let i = 0
  setTimeout(() => {
    const tick = () => {
      shown.value = props.text.slice(0, ++i)
      if (i < props.text.length) setTimeout(tick, props.speed ?? 28 + Math.random() * 30)
      else done.value = true
    }
    tick()
  }, props.delay ?? 200)
})
</script>

<template>
  <span :class="{ cursor: !done }"><slot name="prefix" />{{ shown }}<span v-if="!shown" class="ssr-text">{{ text }}</span></span>
</template>

<style scoped>
/* Text is present for SSR/crawlers, hidden visually until typed on the client. */
.ssr-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
