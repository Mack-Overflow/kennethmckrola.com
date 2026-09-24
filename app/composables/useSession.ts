const KEY = 'kmk.gh.token'

export interface GhUser { login: string; avatar_url: string; name: string | null }

export function useSession() {
  const token = useState<string | null>('gh-token', () => null)
  const user = useState<GhUser | null>('gh-user', () => null)

  const load = () => {
    if (!import.meta.client) return null
    try { token.value = localStorage.getItem(KEY) || sessionStorage.getItem(KEY) } catch { token.value = null }
    return token.value
  }
  const save = (t: string, remember: boolean) => {
    token.value = t
    try {
      ;(remember ? localStorage : sessionStorage).setItem(KEY, t)
      ;(remember ? sessionStorage : localStorage).removeItem(KEY)
    } catch {}
  }
  const clear = () => {
    token.value = null
    user.value = null
    try { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY) } catch {}
  }
  return { token, user, load, save, clear }
}
