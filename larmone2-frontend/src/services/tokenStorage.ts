const TOKEN_STORAGE_KEY = 'larmone:auth:token'
const LEGACY_STORAGE_KEY = 'larmone-auth'

const isBrowser = () => typeof window !== 'undefined'

const getLocalStorage = (): Storage | null => {
  if (!isBrowser()) {
    return null
  }

  try {
    return window.localStorage
  } catch (error) {
    console.warn('No es posible acceder a localStorage.', error)
    return null
  }
}

const sanitizeToken = (token: unknown): string | null => {
  if (typeof token !== 'string') {
    return null
  }

  const trimmed = token.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const loadAuthTokenFromStorage = (): string | null => {
  const storage = getLocalStorage()
  if (!storage) {
    return null
  }

  const directToken = sanitizeToken(storage.getItem(TOKEN_STORAGE_KEY))
  if (directToken) {
    return directToken
  }

  const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY)
  if (!legacyRaw) {
    return null
  }

  try {
    const parsed = JSON.parse(legacyRaw) as { token?: unknown }
    return sanitizeToken(parsed?.token)
  } catch (error) {
    console.warn('No fue posible interpretar el token almacenado previamente.', error)
    return null
  }
}

export const persistAuthToken = (token: string | null) => {
  const storage = getLocalStorage()
  if (!storage) {
    return
  }

  if (token) {
    storage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    storage.removeItem(TOKEN_STORAGE_KEY)
  }
}
