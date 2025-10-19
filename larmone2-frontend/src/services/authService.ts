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

  return {
    id: typeof record.id === 'string' ? record.id : undefined,
    email: maybeEmail,
    firstName: typeof record.firstName === 'string' ? record.firstName : undefined,
    lastName: typeof record.lastName === 'string' ? record.lastName : undefined,
    phone: typeof record.phone === 'string' ? record.phone : undefined,
  }
}

export const registerUser = async (payload: RegisterUserPayload): Promise<UserResponse | null> => {
  const response = await request<unknown>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return extractUser(response)
}

export const authenticateUser = async (payload: LoginPayload): Promise<UserResponse | null> => {
  const response = await request<unknown>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return extractUser(response)
}
