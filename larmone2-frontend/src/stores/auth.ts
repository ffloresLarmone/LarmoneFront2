import { defineStore } from 'pinia'

interface UserProfile {
  email: string
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
      user: parsed.user && typeof parsed.user.email === 'string' ? { email: parsed.user.email } : null,
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
    login(email: string) {
      this.isAuthenticated = true
      this.user = { email }
      persistState(this.$state)
    },
    logout() {
      this.isAuthenticated = false
      this.user = null
      persistState(this.$state)
    },
  },
})
