import axios, {
  AxiosError,
  type AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type Method,
} from 'axios'
import { reactive } from 'vue'

const DEFAULT_BASE_URL = 'http://localhost:3000/api'
const GENERIC_ERROR_MESSAGE =
  'No pudimos procesar tu solicitud. Inténtalo nuevamente en unos minutos.'

interface ApiStatusState {
  isReachable: boolean
  lastCheckedAt: string | null
  lastError: string | null
}

type TokenProvider = () => string | null | undefined

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

function normalizeHeaders(headersInit: unknown): Record<string, string> {
  if (!headersInit) {
    return {}
  }

  if (typeof Headers !== 'undefined' && headersInit instanceof Headers) {
    const result: Record<string, string> = {}
    headersInit.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  if (Array.isArray(headersInit)) {
    return headersInit.reduce<Record<string, string>>((acc, current) => {
      if (Array.isArray(current) && current.length === 2) {
        const [key, value] = current
        if (typeof key === 'string' && typeof value === 'string') {
          acc[key] = value
        }
      }
      return acc
    }, {})
  }

  if (typeof headersInit === 'object') {
    return { ...(headersInit as Record<string, string>) }
  }

  return {}
}

function hasHeader(headers: Record<string, string>, headerName: string): boolean {
  const target = headerName.toLowerCase()
  return Object.keys(headers).some((key) => key.toLowerCase() === target)
}

function ensureContentType(headers: Record<string, string>) {
  if (!hasHeader(headers, 'content-type')) {
    headers['Content-Type'] = 'application/json'
  }
}

class ApiHttpClient {
  private instance: AxiosInstance
  private tokenProvider?: TokenProvider

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      withCredentials: true,
    })

    this.instance.interceptors.request.use((config) => {
      const headers = normalizeHeaders(config.headers)
      ensureContentType(headers)

      const token = this.tokenProvider?.()
      if (token && !hasHeader(headers, 'authorization')) {
        headers.Authorization = `Bearer ${token}`
      }

      config.headers = headers
      return config
    })
  }

  setTokenProvider(provider?: TokenProvider) {
    this.tokenProvider = provider
  }

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await this.requestResponse<T>(url, options)

      if (response.status === 204) {
        return undefined as T
      }

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = extractErrorMessage(error)
        throw new Error(message)
      }

      if (error instanceof Error) {
        throw error
      }

      throw new Error(GENERIC_ERROR_MESSAGE)
    }
  }

  async requestResponse<T>(url: string, options: RequestInit = {}): Promise<AxiosResponse<T>> {
    const config = this.toAxiosConfig(url, options)

    try {
      const response = await this.instance.request<T>(config)
      updateStatus(true)
      return response
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          const message = buildNetworkErrorMessage(error)
          updateStatus(false, message)
          throw new Error(message)
        }

        updateStatus(true)
        throw error
      }

      const fallbackMessage = GENERIC_ERROR_MESSAGE
      updateStatus(false, fallbackMessage)
      throw new Error(fallbackMessage)
    }
  }

  private toAxiosConfig(url: string, options: RequestInit): AxiosRequestConfig {
    const method = (options.method ?? 'GET').toUpperCase() as Method
    const headers = normalizeHeaders(options.headers)
    ensureContentType(headers)

    const config: AxiosRequestConfig = {
      url,
      method,
      headers,
      data: options.body,
      signal: options.signal,
    }

    return config
  }
}

const client = new ApiHttpClient(getBaseUrl())

let staticToken: string | null = null
client.setTokenProvider(() => staticToken)

export function setAuthToken(token: string | null) {
  staticToken = token
}

export function setTokenProvider(provider?: TokenProvider) {
  if (provider) {
    client.setTokenProvider(provider)
  } else {
    client.setTokenProvider(() => staticToken)
  }
}

const ADMIN_ROLE_HEADER = 'X-User-Role'
const ADMIN_ROLE_VALUE = 'ADMIN'

export function withAdminRole(options: RequestInit = {}): RequestInit {
  const headers = normalizeHeaders(options.headers)
  headers[ADMIN_ROLE_HEADER] = ADMIN_ROLE_VALUE
  return { ...options, headers }
}

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  return client.request<T>(url, options)
}

export async function pingBackend(): Promise<boolean> {
  const candidates = ['/health', '/status', '/productos?page=1&pageSize=1']

  for (const path of candidates) {
    try {
      const response = await client.requestResponse(path, {
        headers: { Accept: 'application/json' },
      })

      if (response.status < 500) {
        updateStatus(true)
        return response.status >= 200 && response.status < 300
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status < 500) {
          updateStatus(true)
          return error.response.status >= 200 && error.response.status < 300
        }
      }

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

function getContentType(
  headers: AxiosHeaders | (Record<string, unknown> & Partial<AxiosHeaders>) | undefined,
): string {
  if (!headers) {
    return ''
  }

  const candidate =
    typeof (headers as AxiosHeaders).get === 'function'
      ? (headers as AxiosHeaders).get('content-type')
      : (() => {
          const entries = Object.entries(headers as Record<string, unknown>)
          const match = entries.find(([key]) => key.toLowerCase() === 'content-type')
          if (!match) {
            return undefined
          }
          const [, value] = match
          return value
        })()

  if (!candidate) {
    return ''
  }

  if (Array.isArray(candidate)) {
    return candidate.join(', ')
  }

  return String(candidate)
}

function sanitizeHtmlPayload(raw: string): string {
  const preMatch = raw.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i)
  const extracted = preMatch ? preMatch[1] : raw.replace(/<[^>]+>/g, ' ')
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
  return decoded.replace(/\s+/g, ' ').trim()
}

function extractErrorMessage(error: AxiosError): string {
  const response = error.response
  if (!response) {
    return buildNetworkErrorMessage(error)
  }

  const { data, statusText } = response
  const contentType = getContentType(response.headers)

  if (data === null || typeof data === 'undefined' || data === '') {
    return statusText || GENERIC_ERROR_MESSAGE
  }

  if (typeof data === 'string') {
    const trimmed = data.trim()
    if (trimmed.length === 0) {
      return statusText || GENERIC_ERROR_MESSAGE
    }

    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(trimmed)
        const message = extractMessage(parsed)
        if (message) {
          return message
        }
      } catch (error) {
        // Continuamos con el texto plano
      }
    }

    if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
      const sanitized = sanitizeHtmlPayload(trimmed)
      return sanitized.length > 0 ? sanitized : GENERIC_ERROR_MESSAGE
    }

    return trimmed
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data.toString()
  }

  const message = extractMessage(data)
  if (message) {
    return message
  }

  return statusText || GENERIC_ERROR_MESSAGE
}

function buildNetworkErrorMessage(error: AxiosError): string {
  if (error.message) {
    console.error('[apiClient] request failed:', error.message)
  }

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  return offline
    ? 'Parece que estás sin conexión. Revisa tu red e intenta nuevamente.'
    : 'No fue posible contactar al servidor de Larmone. Inténtalo nuevamente en unos minutos.'
}
