import { describe, expect, it, vi } from 'vitest'
import { createToastManager } from '../useToast'

describe('useToast - createToastManager', () => {
  it('agrega y elimina toasts manualmente', () => {
    const manager = createToastManager()
    const id = manager.showToast({ message: 'Hola' })

    expect(manager.toasts.value).toHaveLength(1)
    expect(manager.toasts.value[0]?.message).toBe('Hola')

    manager.dismiss(id)
    expect(manager.toasts.value).toHaveLength(0)
  })

  it('elimina toasts automáticamente después de la duración', () => {
    vi.useFakeTimers()
    const manager = createToastManager()
    manager.showToast({ message: 'Temporal', duration: 1500 })

    expect(manager.toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1500)
    expect(manager.toasts.value).toHaveLength(0)
    vi.useRealTimers()
  })
})
