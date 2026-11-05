let renewing: Promise<void> | null = null

export function errMsg(e: any): string {
  const m = e?.data?.message
  return Array.isArray(m) ? m.join(' ') : (m ?? e?.message ?? 'Something went wrong.')
}

export function useAuth() {
  const opts = { maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' as const }
  const access = useCookie<string | null>('ex_access', opts)
  const refresh = useCookie<string | null>('ex_refresh', opts)
  const session = useState<Session | null>('session', () => null)

  const clear = () => {
    access.value = null
    refresh.value = null
    session.value = null
  }
  const apply = (r: AuthResponse) => {
    access.value = r.accessToken
    refresh.value = r.refreshToken
    session.value = { user: r.user, organization: r.organization }
  }

  const call = <T>(path: string, o: any = {}) =>
    $fetch<T>(`/backend/v1${path}`, {
      ...o,
      headers: { ...o.headers, ...(access.value ? { Authorization: `Bearer ${access.value}` } : {}) },
    })

  // Refresh tokens are single-use, so concurrent 401s share one refresh call.
  const renew = () =>
    (renewing ??= call<AuthResponse>('/auth/refresh', { method: 'POST', body: { refreshToken: refresh.value } })
      .then(apply)
      .finally(() => { renewing = null }))

  async function api<T>(path: string, o: any = {}): Promise<T> {
    try {
      return await call<T>(path, o)
    } catch (e: any) {
      if (e?.statusCode !== 401 || !refresh.value) throw e
      try { await renew() } catch { clear(); await navigateTo('/login'); throw e }
      return call<T>(path, o)
    }
  }

  async function signIn(mode: 'login' | 'register', body: Record<string, string>) {
    apply(await call<AuthResponse>(`/auth/${mode}`, { method: 'POST', body }))
  }
  async function load() {
    if (!access.value || session.value) return
    try { session.value = await api<Session>('/auth/me') } catch { clear() }
  }
  async function logout() {
    const token = refresh.value
    clear()
    if (token) await call('/auth/logout', { method: 'POST', body: { refreshToken: token } }).catch(() => {})
    await navigateTo('/login')
  }

  return { session, api, signIn, load, logout, loggedIn: computed(() => !!access.value) }
}
