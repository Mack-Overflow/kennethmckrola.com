// Repo list + per-repo language composition (GET /repos/{owner}/{repo}/languages, bytes per language).
// Cached so dev reloads don't burn the 60/h anonymous GitHub limit; prerendered into a static JSON in `nuxt generate`.
import type { GhRepo } from '~/composables/useExternal'

export default defineCachedEventHandler(
  async (): Promise<GhRepo[]> => {
    const { githubToken, public: { ownerLogin } } = useRuntimeConfig()
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'kennethmckrola.com',
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
    }
    try {
      const list = await $fetch<Array<Omit<GhRepo, 'languages'> & { languages_url: string }>>(
        `https://api.github.com/users/${ownerLogin}/repos?sort=pushed&per_page=30`, { headers },
      )
      const own = list.filter((r) => !r.fork)
      const langs = await Promise.all(
        own.map((r) => $fetch<Record<string, number>>(r.languages_url, { headers }).catch(() => ({}) as Record<string, number>)),
      )
      return own.map(({ languages_url: _u, ...r }, i) => ({
        ...r,
        languages: Object.fromEntries(Object.entries(langs[i]).sort((a, b) => b[1] - a[1])),
      }))
    } catch (e: any) {
      console.warn(`[github] repo fetch failed (${e?.status ?? e?.message}). Set NUXT_GITHUB_TOKEN in .env to lift the anonymous rate limit.`)
      return []
    }
  },
  { maxAge: 60 * 10, name: 'gh-repos', getKey: () => 'all' },
)
