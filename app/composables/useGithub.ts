// Thin GitHub REST client for the in-browser editor. Everything goes through the Contents API,
// so a "save" is literally a commit to main, which triggers the Pages deploy.
export class GhError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const utf8ToB64 = (s: string) => {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin)
}
const b64ToUtf8 = (b: string) => {
  const bin = atob(b.replace(/\n/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
export const fileToB64 = (file: File) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result).split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })

export function useGithub() {
  const { token } = useSession()
  const { repo } = useRuntimeConfig().public

  const gh = async <T = any>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    })
    if (res.status === 204) return undefined as T
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new GhError(res.status, json.message || res.statusText)
    return json as T
  }

  const me = () => gh<GhUser>('/user')
  const repoInfo = () => gh<{ default_branch: string; html_url: string; private: boolean }>(`/repos/${repo}`)

  const listDir = async (path: string) => {
    try {
      const items = await gh<Array<{ name: string; path: string; sha: string; type: string; size: number }>>(`/repos/${repo}/contents/${path}`)
      return Array.isArray(items) ? items : []
    } catch (e) {
      if (e instanceof GhError && e.status === 404) return []
      throw e
    }
  }

  const getFile = async (path: string) => {
    const f = await gh<{ content: string; sha: string; encoding: string }>(`/repos/${repo}/contents/${path}`)
    return { text: b64ToUtf8(f.content), sha: f.sha }
  }

  const putFile = (path: string, content: string | { base64: string }, message: string, sha?: string) =>
    gh<{ content: { sha: string; path: string; html_url: string }; commit: { sha: string; html_url: string } }>(
      `/repos/${repo}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message,
          content: typeof content === 'string' ? utf8ToB64(content) : content.base64,
          ...(sha ? { sha } : {}),
        }),
      },
    )

  const deleteFile = (path: string, sha: string, message: string) =>
    gh(`/repos/${repo}/contents/${path}`, { method: 'DELETE', body: JSON.stringify({ message, sha }) })

  const latestRuns = () =>
    gh<{ workflow_runs: Array<{ id: number; status: string; conclusion: string | null; html_url: string; head_sha: string; created_at: string }> }>(
      `/repos/${repo}/actions/runs?per_page=5`,
    )

  return { gh, me, repoInfo, listDir, getFile, putFile, deleteFile, latestRuns }
}
