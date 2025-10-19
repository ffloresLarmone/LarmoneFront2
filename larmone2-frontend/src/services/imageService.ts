import type {
  ConfirmImagenReq,
  ImagenProducto,
  PresignUploadReq,
  PresignUploadRes,
} from '../types/api'

const API = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000/api'
const IMAGE_API = (import.meta.env.VITE_IMAGE_API_BASE_URL || API).replace(/\/$/, '')
const CDN = (import.meta.env.VITE_CDN_BASE_URL || '').replace(/\/$/, '')
const STRATEGY = (import.meta.env.VITE_IMAGE_UPLOAD_STRATEGY || 'presigned').toLowerCase()

export type PresignGetResponse = {
  url: string
  expiresIn: number
}

export type UploadImagenResponse = {
  id_imagen: number
  url_publica?: string | null
  object_key?: string | null
  bucket?: string
  mime_type?: string
  principal?: boolean
}

async function parseError(response: Response, fallback: string): Promise<never> {
  try {
    const data = await response.json()
    const message = data?.message || fallback
    throw new Error(message)
  } catch (error) {
    if (error instanceof Error && error.message !== fallback) {
      throw error
    }
    throw new Error(fallback)
  }
}

export async function presignUpload(body: PresignUploadReq) {
  const response = await fetch(`${IMAGE_API}/imagenes/presign-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  })
  if (!response.ok) {
    await parseError(response, 'No se pudo presignar upload')
  }
  return (await response.json()) as PresignUploadRes
}

export async function presignGet(key: string) {
  const response = await fetch(`${IMAGE_API}/imagenes/presign-get?key=${encodeURIComponent(key)}`, {
    credentials: 'include',
  })
  if (!response.ok) {
    await parseError(response, 'No se pudo presignar GET')
  }
  return (await response.json()) as PresignGetResponse
}

export async function putSigned(url: string, file: File, onProgress?: (p: number) => void) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`PUT failed ${xhr.status}`))
      }
    }
    xhr.onerror = () => reject(new Error('PUT network error'))
    xhr.send(file)
  })
}

export function publicUrlOrPresign(objectKey?: string | null, url_publica?: string | null) {
  if (url_publica) return url_publica
  if (objectKey && CDN) return `${CDN}/${objectKey}`
  return null
}

export async function uploadMultipartProducto(
  idProducto: number,
  file: File,
  keyPrefix = 'public/productos',
  principal = false,
) {
  const formData = new FormData()
  formData.append('archivo', file)
  formData.append('keyPrefix', keyPrefix)
  formData.append('principal', String(principal))

  const response = await fetch(`${API}/productos/${idProducto}/imagenes`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  if (!response.ok) {
    await parseError(response, 'Error en upload multipart')
  }

  return (await response.json()) as UploadImagenResponse
}

export async function subirImagenProducto({
  idProducto,
  file,
  keyPrefix = 'public/productos',
  principal = false,
  onProgress,
}: {
  idProducto: number
  file: File
  keyPrefix?: string
  principal?: boolean
  onProgress?: (p: number) => void
}) {
  if (STRATEGY === 'multipart') {
    return uploadMultipartProducto(idProducto, file, keyPrefix, principal)
  }

  const { key, url, bucket } = await presignUpload({
    filename: file.name,
    contentType: file.type,
    keyPrefix,
  })

  await putSigned(url, file, onProgress)

  const confirmBody: ConfirmImagenReq = {
    bucket,
    object_key: key,
    mime_type: file.type,
    bytes_size: file.size,
    principal,
    url_publica: CDN ? `${CDN}/${key}` : null,
  }

  const response = await fetch(`${API}/productos/${idProducto}/imagenes/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(confirmBody),
    credentials: 'include',
  })

  if (!response.ok) {
    await parseError(response, 'Error confirmando metadatos')
  }

  return (await response.json()) as UploadImagenResponse
}

export async function urlParaVerImagen(img: {
  url_publica?: string | null
  object_key?: string | null
}) {
  const direct = publicUrlOrPresign(img.object_key ?? null, img.url_publica ?? null)
  if (direct) return direct
  if (img.object_key) {
    const { url } = await presignGet(img.object_key)
    return url
  }
  return ''
}

export async function mapearProductosConImagenes<T extends { imagenes?: ImagenProducto[] }>(
  items: T[],
): Promise<Array<T & { _thumb: string }>> {
  return Promise.all(
    items.map(async (producto) => {
      const principal = producto.imagenes?.find((img) => img.principal) ?? producto.imagenes?.[0]
      if (!principal) {
        return { ...producto, _thumb: '' }
      }
      const resolvedUrl = await urlParaVerImagen(principal)
      const imagenes = producto.imagenes?.map((img) =>
        img.id_imagen === principal.id_imagen ? { ...img, resolvedUrl } : img,
      )
      return {
        ...producto,
        imagenes,
        _thumb: resolvedUrl,
      }
    }),
  )
}
