<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
useSeoMeta({ ogSiteName: 'kennethmckrola.com', ogType: 'website', twitterCard: 'summary_large_image' })
useHead({ link: [{ rel: 'canonical', href: computed(() => config.public.siteUrl + route.path.replace(/\/$/, '') || config.public.siteUrl) }] })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
