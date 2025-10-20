import { defineStore } from 'pinia'

interface UserProfile {
  id?: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}

interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
}

const STORAGE_KEY = 'larmone-auth'

const loadStoredState = (): AuthState => {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null }
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { isAuthenticated: false, user: null }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthState>
    if (!parsed || typeof parsed !== 'object') {
      return { isAuthenticated: false, user: null }
    }

    return {
      isAuthenticated: Boolean(parsed.isAuthenticated),
      user:
        parsed.user && typeof parsed.user === 'object' && parsed.user !== null
          ? (() => {
              const rawUser = parsed.user as Record<string, unknown>
              const email = typeof rawUser.email === 'string' ? rawUser.email : null
              if (!email) {
                return null
              }
              const nombre = typeof rawUser.nombre === 'string' ? rawUser.nombre : undefined
              let firstName = typeof rawUser.firstName === 'string' ? rawUser.firstName : undefined
              let lastName = typeof rawUser.lastName === 'string' ? rawUser.lastName : undefined

              if (nombre) {
                const [first, ...rest] = nombre
                  .split(/\s+/)
                  .map((segment) => segment.trim())
                  .filter((segment) => segment.length > 0)

                if (first && !firstName) {
                  firstName = first
                }

                if (rest.length > 0 && !lastName) {
                  lastName = rest.join(' ')
                }
              }

              const phone =
                typeof rawUser.phone === 'string'
                  ? rawUser.phone
                  : typeof rawUser.telefono === 'string'
                    ? rawUser.telefono
                    : undefined

              return {
                email,
                id: typeof rawUser.id === 'string' ? rawUser.id : undefined,
                firstName,
                lastName,
                phone,
              }
            })()
          : null,
    }
  } catch (error) {
    console.warn('No fue posible recuperar la sesión almacenada', error)
    return { isAuthenticated: false, user: null }
  }
}

const persistState = (state: AuthState) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => loadStoredState(),
  actions: {
    login(user: UserProfile) {
      this.isAuthenticated = true
      this.user = user
      persistState(this.$state)
    },
    logout() {
      this.isAuthenticated = false
      this.user = null
      persistState(this.$state)
    },
  },
})
