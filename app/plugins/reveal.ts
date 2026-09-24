// v-reveal: fades/slides an element in the first time it scrolls into view.
// Usage: <div v-reveal> or <div v-reveal="{ delay: 120 }">
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    getSSRProps() {
      return { class: 'reveal' }
    },
    mounted(el: HTMLElement, binding) {
      el.classList.add('reveal')
      const delay = binding.value?.delay ?? 0
      if (delay) el.style.transitionDelay = `${delay}ms`

      if (typeof IntersectionObserver === 'undefined') {
        el.classList.add('is-visible')
        return
      }
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              el.classList.add('is-visible')
              io.unobserve(el)
            }
          }
        },
        { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
      )
      io.observe(el)
      ;(el as any).__reveal = io
    },
    unmounted(el: any) {
      el.__reveal?.disconnect()
    },
  })
})
