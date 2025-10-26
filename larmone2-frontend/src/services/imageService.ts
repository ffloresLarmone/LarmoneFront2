import type { ImagenProducto } from '../types/api'

export const FALLBACK_IMAGE = 'https://placehold.co/400x300/FBE7F5/8C4FB9?text=Sin+imagen'

const CDN_BASE_URL = sanitizeBase(import.meta.env.VITE_CDN_BASE_URL)
const STORAGE_DRIVER = normalizeDriver(import.meta.env.VITE_STORAGE_DRIVER)
const S3_PUBLIC_BASE_URL = sanitizeBase(import.meta.env.VITE_S3_PUBLIC_BASE_URL)
const S3_ENDPOINT = sanitizeBase(import.meta.env.VITE_S3_ENDPOINT)
const S3_BUCKET = typeof import.meta.env.VITE_S3_BUCKET === 'string' ? import.meta.env.VITE_S3_BUCKET : ''
const S3_REGION = typeof import.meta.env.VITE_S3_REGION === 'string' ? import.meta.env.VITE_S3_REGION : ''
const S3_USE_SSL = normalizeBoolean(import.meta.env.VITE_S3_USE_SSL)

function sanitizeBase(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  const trimmed = value.trim()
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

function normalizeDriver(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim().toLowerCase()
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') {
    return true
  }
  if (normalized === 'false') {
    return false
  }
  return undefined
}

function buildMinioUrl(path: string): string {
  if (S3_PUBLIC_BASE_URL) {
    return `${S3_PUBLIC_BASE_URL}/${path}`
  }

  if (CDN_BASE_URL) {
    return `${CDN_BASE_URL}/${path}`
  }

  if (S3_ENDPOINT && S3_BUCKET) {
    return `${S3_ENDPOINT}/${S3_BUCKET}/${path}`
  }

  return path
}

function buildS3FallbackUrl(path: string): string {
  if (STORAGE_DRIVER === 'minio') {
    return buildMinioUrl(path)
  }

  if (S3_PUBLIC_BASE_URL) {
    return `${S3_PUBLIC_BASE_URL}/${path}`
  }

  if (CDN_BASE_URL) {
    return `${CDN_BASE_URL}/${path}`
  }

  if (S3_BUCKET && S3_REGION) {
    const protocol = S3_USE_SSL === false ? 'http' : 'https'
    return `${protocol}://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${path}`
  }

  return path
}

function resolverUrlPublica(url?: string | null): string | null {
  if (!url) {
    return null
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return null
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  const sanitizedPath = trimmed.replace(/^\/+/, '')
  return buildS3FallbackUrl(sanitizedPath)
}

export function normalizarImagenes(imagenes?: ImagenProducto[] | null): ImagenProducto[] {
  if (!imagenes?.length) {
    return []
  }

  return imagenes.map((imagen) => ({
    ...imagen,
    url: resolverUrlPublica(imagen.url) ?? FALLBACK_IMAGE,
  }))
}

export function obtenerImagenPrincipal(
  imagenes?: ImagenProducto[],
): ImagenProducto | undefined {
  if (!imagenes?.length) {
    return undefined
  }

  const principal = imagenes.find((img) => img.principal)
  return principal ?? imagenes[0]
}

export async function urlParaVerImagen(img: ImagenProducto): Promise<string> {
  const url = resolverUrlPublica(img.url)
  if (url) {
    return url
  }
  return FALLBACK_IMAGE
}

export async function mapearProductosConImagenes<
  T extends { imagenes?: ImagenProducto[] }
>(items: T[]): Promise<Array<T & { _thumb: string }>> {
  return items.map((producto) => {
    const imagenesNormalizadas = normalizarImagenes(producto.imagenes)
    const principal = obtenerImagenPrincipal(imagenesNormalizadas)
    const thumb = principal?.url ?? FALLBACK_IMAGE

    return {
      ...producto,
      imagenes: imagenesNormalizadas,
      _thumb: thumb,
    }
  })
}
