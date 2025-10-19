import type { ImagenProducto } from '../types/api'

export const FALLBACK_IMAGE = 'https://placehold.co/400x300/FBE7F5/8C4FB9?text=Sin+imagen'

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
  if (img.url) {
    return img.url
  }
  return FALLBACK_IMAGE
}

export async function mapearProductosConImagenes<
  T extends { imagenes?: ImagenProducto[] }
>(items: T[]): Promise<Array<T & { _thumb: string }>> {
  return items.map((producto) => {
    const principal = obtenerImagenPrincipal(producto.imagenes)
    const thumb = principal?.url ?? FALLBACK_IMAGE

    return {
      ...producto,
      _thumb: thumb,
    }
  })
}
