import { defineStore } from 'pinia'
import { setAuthToken } from '../services/apiClient'

interface UserProfile {
  id?: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  role?: string | null
  roles?: string[]
}

interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  token: string | null
}

const STORAGE_KEY = 'larmone-auth'

const loadStoredState = (): AuthState => {
  const defaultState: AuthState = { isAuthenticated: false, user: null, token: null }

  if (typeof window === 'undefined') {
    return defaultState
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return defaultState
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthState>
    if (!parsed || typeof parsed !== 'object') {
      return defaultState
    }

    const token =
      typeof parsed.token === 'string' && parsed.token.trim().length > 0
        ? parsed.token.trim()
        : null

    const state: AuthState = {
      isAuthenticated: Boolean(parsed.isAuthenticated && token),
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

              const role =
                typeof rawUser.role === 'string'
                  ? rawUser.role
                  : typeof rawUser.rol === 'string'
                    ? rawUser.rol
                    : undefined

              const roles = Array.isArray(rawUser.roles)
                ? rawUser.roles.filter((value): value is string => typeof value === 'string' && value.length > 0)
                : undefined

              return {
                email,
                id: typeof rawUser.id === 'string' ? rawUser.id : undefined,
                firstName,
                lastName,
                phone,
                role: role ?? undefined,
                roles,
              }
            })()
          : null,
      token,
    }

    if (!state.token) {
      state.user = null
      state.isAuthenticated = false
    }

    setAuthToken(state.token)

    return state
  } catch (error) {
    console.warn('No fue posible recuperar la sesión almacenada', error)
    return defaultState
  }
}

const persistState = (state: AuthState) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const hasAdminRole = (candidate: Pick<UserProfile, 'role' | 'roles'> | null | undefined): boolean => {
  if (!candidate) {
    return false
  }

  const roles: string[] = []

  if (candidate.role && typeof candidate.role === 'string') {
    roles.push(candidate.role)
  }

  if (Array.isArray(candidate.roles)) {
    roles.push(
      ...candidate.roles.filter((value): value is string => typeof value === 'string' && value.length > 0),
    )
  }

  return roles.some((role) => {
    const normalized = role.toLowerCase()
    return normalized === 'admin' || normalized === 'administrador'
  })
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => loadStoredState(),
  getters: {
    isAdmin(state): boolean {
      return hasAdminRole(state.user)
    },
  },
  actions: {
    login(user: UserProfile, token?: string | null) {
      const resolvedToken = token ?? null
      this.user = resolvedToken ? user : null
      this.token = resolvedToken
      this.isAuthenticated = Boolean(this.user && resolvedToken)
      setAuthToken(this.token)
      persistState(this.$state)
    },
    logout() {
      this.isAuthenticated = false
      this.user = null
      this.token = null
      setAuthToken(null)
      persistState(this.$state)
    },
    hasAdminAccess(candidate?: Pick<UserProfile, 'role' | 'roles'> | null) {
      if (candidate) {
        return hasAdminRole(candidate)
      }

      return hasAdminRole(this.user)
    },
  },
})
