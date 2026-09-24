// One unified feed: markdown posts in content/articles plus posts on dev.to, newest first.
// dev.to posts whose canonical URL already points here are dropped (they're the same article).
export interface FeedItem {
  key: string
  to: string
  title: string
  description: string
  date: string
  tags: string[]
  kind: string
  external: boolean
}

export async function useArticleFeed(limit?: number) {
  const config = useRuntimeConfig()
  const [{ data: local }, { data: devto }] = await Promise.all([
    useAsyncData('feed-local', () => queryCollection('articles').where('draft', '=', false).order('date', 'DESC').all()),
    useDevtoArticles(),
  ])

  const feed = computed<FeedItem[]>(() => {
    const a: FeedItem[] = (local.value || []).map((p) => ({
      key: p.path, to: p.path, title: p.title, description: p.description || '', date: p.date, tags: p.tags || [], kind: p.kind, external: false,
    }))
    const b: FeedItem[] = (devto.value || [])
      .filter((d) => !d.canonical_url?.startsWith(config.public.siteUrl))
      .map((d) => ({
        key: `devto-${d.id}`, to: d.url, title: d.title, description: d.description || '', date: d.published_at, tags: d.tag_list || [], kind: 'dev.to', external: true,
      }))
    const all = [...a, ...b].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())
    return limit ? all.slice(0, limit) : all
  })
  return feed
}
