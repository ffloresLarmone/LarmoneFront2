import { reactive } from 'vue'

const DEFAULT_BASE_URL = 'http://localhost:3000/api'

interface ApiStatusState {
  isReachable: boolean
  lastCheckedAt: string | null
  lastError: string | null
}

export const apiStatus = reactive<ApiStatusState>({
  isReachable: true,
  lastCheckedAt: null,
  lastError: null,
})

function updateStatus(isReachable: boolean, message?: string) {
  apiStatus.isReachable = isReachable
  apiStatus.lastCheckedAt = new Date().toISOString()
  apiStatus.lastError = isReachable ? null : message ?? null
}

export function getBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.replace(/\/$/, '')
  }
  return DEFAULT_BASE_URL
}

function buildUrl(path: string): string {
  const sanitizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getBaseUrl()}${sanitizedPath}`
}

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response

  try {
    response = await fetch(buildUrl(url), {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'include',
      ...options,
    })
  } catch (error) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false
    const fallbackMessage = offline
      ? 'Parece que estás sin conexión. Revisa tu red e intenta nuevamente.'
      : 'No fue posible contactar al servidor de Larmone. Inténtalo nuevamente en unos minutos.'
    updateStatus(false, fallbackMessage)

    if (error instanceof Error && error.message) {
      console.error('[apiClient] request failed:', error.message)
    }

    throw new Error(fallbackMessage)
  }

  updateStatus(true)

  if (!response.ok) {
    const message = await safeParseError(response)
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function pingBackend(): Promise<boolean> {
  const candidates = ['/health', '/status', '/productos?page=1&pageSize=1']

  for (const path of candidates) {
    try {
      const response = await fetch(buildUrl(path), {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })

      if (response.status < 500) {
        updateStatus(true)
        return response.ok
      }
    } catch (error) {
      // Continuamos con el siguiente candidato
      continue
    }
  }

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  const fallbackMessage = offline
    ? 'Parece que estás sin conexión. Revisa tu red e intenta nuevamente.'
    : 'No pudimos establecer comunicación con el servidor. Inténtalo nuevamente más tarde.'

  updateStatus(false, fallbackMessage)
  return false
}

async function safeParseError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return data?.message ?? response.statusText
  } catch (error) {
    return response.statusText
  }
}
