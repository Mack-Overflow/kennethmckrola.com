<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const { data: article } = await useAsyncData(`article-${route.path}`, () => queryCollection('articles').path(route.path).first())
if (!article.value) throw createError({ statusCode: 404, statusMessage: 'Article not found', fatal: true })

const { data: surround } = await useAsyncData(`surround-${route.path}`, () =>
  queryCollectionItemSurroundings('articles', route.path, { fields: ['title', 'path'] }).where('draft', '=', false).order('date', 'DESC'),
)

useSeoMeta({
  title: article.value.title,
  description: article.value.description,
  ogTitle: article.value.title,
  ogDescription: article.value.description,
  ogImage: article.value.cover ? new URL(article.value.cover, config.public.siteUrl).href : undefined,
  articlePublishedTime: article.value.date,
})
const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <article v-if="article" class="container section">
    <header v-reveal class="head">
      <p class="prompt muted">cat articles/{{ route.params.slug }}.md</p>
      <div class="meta">
        <span class="tag">{{ article.kind }}</span>
        <span class="muted">{{ fmt(article.date) }}</span>
        <span v-for="t in article.tags" :key="t" class="muted">#{{ t }}</span>
      </div>
      <h1>{{ article.title }}</h1>
      <p v-if="article.description" class="lede">{{ article.description }}</p>
      <img v-if="article.cover" :src="article.cover" :alt="article.title" class="cover" loading="lazy" />
    </header>

    <ContentRenderer :value="article" class="prose" />

    <footer class="foot">
      <p v-if="article.devto_url" class="muted">
        also published on <a :href="article.devto_url" target="_blank" rel="noopener">dev.to ↗</a> (this page is the canonical version)
      </p>
      <nav class="surround">
        <NuxtLink v-if="surround?.[0]" :to="surround[0].path" class="tile">
          <span class="muted">← older</span><h3>{{ surround[0].title }}</h3>
        </NuxtLink>
        <span v-else />
        <NuxtLink v-if="surround?.[1]" :to="surround[1].path" class="tile right">
          <span class="muted">newer →</span><h3>{{ surround[1].title }}</h3>
        </NuxtLink>
      </nav>
    </footer>
  </article>
</template>

<style scoped>
.head { max-width: 760px; margin-bottom: 2.5rem; }
.meta { display: flex; gap: 0.7rem; flex-wrap: wrap; align-items: center; font-size: 0.8rem; margin-bottom: 0.8rem; }
.lede { color: var(--green); font-size: 1.05rem; }
.cover { margin-top: 1.5rem; border: 1px solid var(--line); }
.foot { max-width: 760px; margin-top: 3.5rem; border-top: 1px dashed var(--line-strong); padding-top: 1.5rem; }
.surround { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
.surround .right { text-align: right; }
@media (max-width: 640px) { .surround { grid-template-columns: 1fr; } }
</style>
