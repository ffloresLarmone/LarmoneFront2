const DEFAULT_BASE_URL = 'http://localhost:3000/api'

function getBaseUrl(): string {
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
  const response = await fetch(buildUrl(url), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  })

  if (!response.ok) {
    const message = await safeParseError(response)
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function safeParseError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    return data?.message ?? response.statusText
  } catch (error) {
    return response.statusText
  }
}
