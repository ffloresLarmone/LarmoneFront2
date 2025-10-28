import { request } from './apiClient'

export interface UserResponse {
  id?: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  role?: string | null
  roles?: string[]
}

export interface RegisterUserPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}

export interface LoginPayload {
  email: string
  password: string
  nombre?: string
  telefono?: string
}

export interface AuthResult {
  user: UserResponse | null
  token: string | null
}

const extractUser = (payload: unknown): UserResponse | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  if ('user' in payload && payload.user) {
    return extractUser(payload.user)
  }

  if ('data' in payload && payload.data) {
    return extractUser(payload.data)
  }

  const maybeEmail = 'email' in payload ? (payload as Record<string, unknown>).email : null

  if (typeof maybeEmail !== 'string' || maybeEmail.length === 0) {
    return null
  }

  const record = payload as Record<string, unknown>

  const nombre = typeof record.nombre === 'string' ? record.nombre : undefined
  let firstName = typeof record.firstName === 'string' ? record.firstName : undefined
  let lastName = typeof record.lastName === 'string' ? record.lastName : undefined

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

  const role =
    typeof record.role === 'string'
      ? record.role
      : typeof record.rol === 'string'
        ? record.rol
        : undefined

  const roles = Array.isArray(record.roles)
    ? record.roles.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : undefined

  return {
    id: typeof record.id === 'string' ? record.id : undefined,
    email: maybeEmail,
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
    phone:
      typeof record.phone === 'string'
        ? record.phone
        : typeof record.telefono === 'string'
          ? record.telefono
          : undefined,
    role: role ?? undefined,
    roles,
  }
}

const TOKEN_KEYS = ['token', 'accessToken', 'access_token', 'jwt', 'jwtToken']

const extractToken = (payload: unknown): string | null => {
  if (!payload) {
    return null
  }

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload.trim()
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const token = extractToken(item)
      if (token) {
        return token
      }
    }
    return null
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    for (const key of TOKEN_KEYS) {
      const candidate = record[key]
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim()
      }
    }

    const nestedKeys = ['data', 'result', 'response', 'user']
    for (const key of nestedKeys) {
      if (key in record) {
        const token = extractToken(record[key])
        if (token) {
          return token
        }
      }
    }
  }

  return null
}

export const registerUser = async (payload: RegisterUserPayload): Promise<AuthResult> => {
  const nombre = `${payload.firstName ?? ''} ${payload.lastName ?? ''}`.trim() || payload.firstName || payload.lastName || ''
  const response = await request<unknown>('/usuarios', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      nombre,
      telefono: payload.phone ?? '',
    }),
  })

  return {
    user: extractUser(response),
    token: extractToken(response),
  }
}

export const authenticateUser = async (payload: LoginPayload): Promise<AuthResult> => {
  const response = await request<unknown>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      nombre: payload.nombre ?? '',
      telefono: payload.telefono ?? '',
    }),
  })

  return {
    user: extractUser(response),
    token: extractToken(response),
  }
}
