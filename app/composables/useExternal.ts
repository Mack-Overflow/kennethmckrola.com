// Fetched at build time (prerender) so the static site carries a snapshot; refreshed on every deploy.
export interface DevtoArticle {
  id: number
  title: string
  description: string
  url: string
  published_at: string
  tag_list: string[]
  canonical_url: string
}
export interface GhRepo {
  name: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  pushed_at: string
  fork: boolean
  topics?: string[]
}

export function useDevtoArticles() {
  const { devtoUser } = useRuntimeConfig().public
  return useFetch<DevtoArticle[]>(`https://dev.to/api/articles?username=${devtoUser}&per_page=12`, {
    key: 'devto-articles',
    default: () => [],
    server: true,
    lazy: false,
  })
}

export function useGithubRepos() {
  const { ownerLogin } = useRuntimeConfig().public
  return useFetch<GhRepo[]>(`https://api.github.com/users/${ownerLogin}/repos?sort=pushed&per_page=30`, {
    key: 'gh-repos',
    default: () => [],
    server: true,
    transform: (repos) => repos.filter((r) => !r.fork).slice(0, 6),
  })
}
