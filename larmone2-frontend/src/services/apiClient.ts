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

const GENERIC_ERROR_MESSAGE = 'No pudimos procesar tu solicitud. Inténtalo nuevamente en unos minutos.'

function extractMessage(payload: unknown): string | null {
  if (!payload) {
    return null
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (Array.isArray(payload)) {
    const messages = payload
      .map((item) => extractMessage(item))
      .filter((message): message is string => typeof message === 'string' && message.length > 0)
    if (messages.length > 0) {
      return messages.join(' ')
    }
    return null
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const candidates = ['message', 'msg', 'error', 'detail', 'title', 'descripcion', 'description']

    for (const key of candidates) {
      if (key in record) {
        const message = extractMessage(record[key])
        if (message) {
          return message
        }
      }
    }
  }

  return null
}

async function safeParseError(response: Response): Promise<string> {
  let raw = ''

  try {
    raw = await response.text()
  } catch (error) {
    return response.statusText || GENERIC_ERROR_MESSAGE
  }

  if (raw.length === 0) {
    return response.statusText || GENERIC_ERROR_MESSAGE
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      const data = JSON.parse(raw)
      const message = extractMessage(data)
      if (message) {
        return message
      }
    } catch (error) {
      // Continuamos con el texto plano
    }
  }

  const fallback = raw.trim()
  if (fallback.length > 0) {
    if (/<\/?[a-z][\s\S]*>/i.test(fallback)) {
      const preMatch = fallback.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i)
      const extracted = preMatch ? preMatch[1] : fallback.replace(/<[^>]+>/g, ' ')
      const decoded = extracted.replace(/&(?:quot|apos|amp|lt|gt);/gi, (entity) => {
        const map: Record<string, string> = {
          '&quot;': '"',
          '&apos;': "'",
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
        }
        return map[entity.toLowerCase()] ?? ' '
      })
      const sanitized = decoded.replace(/\s+/g, ' ').trim()
      if (sanitized.length > 0) {
        return sanitized
      }
      return GENERIC_ERROR_MESSAGE
    }
    return fallback
  }

  return response.statusText || GENERIC_ERROR_MESSAGE
}
