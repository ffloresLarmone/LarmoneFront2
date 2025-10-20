import { request } from './apiClient'

export interface UserResponse {
  id?: string
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
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
  }
}

export const registerUser = async (payload: RegisterUserPayload): Promise<UserResponse | null> => {
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

  return extractUser(response)
}

export const authenticateUser = async (payload: LoginPayload): Promise<UserResponse | null> => {
  const response = await request<unknown>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      nombre: payload.nombre ?? '',
      telefono: payload.telefono ?? '',
    }),
  })

  return extractUser(response)
}
