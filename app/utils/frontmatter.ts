// Tiny frontmatter codec for the flat schema this site uses (strings, numbers, booleans, string arrays).
// Kept dependency-free so it runs in the browser editor without Buffer polyfills.
export type Meta = Record<string, string | number | boolean | string[] | undefined>

const unquote = (s: string) => {
  const t = s.trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    try { return t.startsWith('"') ? JSON.parse(t) : t.slice(1, -1) } catch { return t.slice(1, -1) }
  }
  return t
}

const parseValue = (raw: string): Meta[string] => {
  const v = raw.trim()
  if (v === '') return ''
  if (v === 'true') return true
  if (v === 'false') return false
  if (v.startsWith('[') && v.endsWith(']')) {
    return v.slice(1, -1).split(',').map((x) => unquote(x)).filter((x) => x !== '')
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v)
  return unquote(v)
}

export function parseFrontmatter(src: string): { meta: Meta; body: string } {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { meta: {}, body: src }
  const meta: Meta = {}
  const lines = m[1].split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!kv) continue
    const [, key, rest] = kv
    if (rest.trim() === '' && lines[i + 1]?.match(/^\s+-\s/)) {
      const arr: string[] = []
      while (lines[i + 1]?.match(/^\s+-\s/)) arr.push(unquote(lines[++i].replace(/^\s+-\s/, '')))
      meta[key] = arr
    } else {
      meta[key] = parseValue(rest)
    }
  }
  return { meta, body: m[2].replace(/^\r?\n/, '') }
}

const yamlScalar = (v: string | number | boolean) => {
  if (typeof v !== 'string') return String(v)
  // Dates and plain slugs can stay bare; anything else gets JSON-quoted (valid YAML double-quoted string).
  if (/^[A-Za-z0-9_./-]+$/.test(v) && !/^(true|false|null|yes|no|on|off)$/i.test(v) && !/^\d+$/.test(v)) return v
  return JSON.stringify(v)
}

export function stringifyFrontmatter(meta: Meta, body: string): string {
  const lines = ['---']
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v)) lines.push(`${k}: [${v.map(yamlScalar).join(', ')}]`)
    else lines.push(`${k}: ${yamlScalar(v)}`)
  }
  lines.push('---', '')
  return lines.join('\n') + body.replace(/\s+$/, '') + '\n'
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
