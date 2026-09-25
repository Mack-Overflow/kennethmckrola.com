export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/content'],
  ssr: true,
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: (t) => (t ? `${t} · kennethmckrola.com` : 'kennethmckrola.com'),
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#000000' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,600;0,800;1,400&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    // Optional; set NUXT_GITHUB_TOKEN at build time to raise the GitHub API rate limit. Never shipped to the client.
    githubToken: '',
    public: {
      siteUrl: 'https://kennethmckrola.com',
      // The GitHub repo the editor commits to. Fine-grained PAT needs "Contents: read & write" on it.
      repo: 'Mack-Overflow/kennethmckrola.com',
      ownerLogin: 'Mack-Overflow',
      devtoUser: 'mackoverflow',
    },
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: 'vitesse-dark',
          langs: ['js', 'ts', 'vue', 'html', 'css', 'json', 'bash', 'shell', 'go', 'python', 'sql', 'yaml', 'php', 'diff', 'md', 'docker', 'rust', 'c', 'cpp'],
        },
      },
    },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/articles', '/projects', '/login', '/editor', '/robots.txt', '/api/github/repos'],
    },
  },

  routeRules: {
    '/login': { robots: 'noindex, nofollow' },
    '/editor': { robots: 'noindex, nofollow' },
  },
})
