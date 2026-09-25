// Dev only: lists content/articles from disk so the editor UI can be exercised without a GitHub token.
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async () => {
  if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  const dir = join(process.cwd(), 'content/articles')
  const files = await readdir(dir).catch(() => [] as string[])
  return files.filter((f) => f.endsWith('.md')).sort().map((f) => ({ name: f.replace(/\.md$/, ''), path: `content/articles/${f}` }))
})
