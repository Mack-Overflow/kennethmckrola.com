// Dev only: returns one article's raw markdown from disk (see index.get.ts).
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  const name = String(getRouterParam(event, 'name') || '')
  if (!/^[a-z0-9-]+$/.test(name)) throw createError({ statusCode: 400, statusMessage: 'Bad slug' })
  try {
    return { text: await readFile(join(process.cwd(), 'content/articles', `${name}.md`), 'utf8') }
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
})
