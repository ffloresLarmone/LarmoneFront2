import { inject, provide, ref, type Ref } from 'vue'

export type ToastVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info'

export interface ToastInput {
  message: string
  title?: string
  variant?: ToastVariant
  duration?: number
}

export interface ToastState extends Required<Pick<ToastInput, 'message'>> {
  id: number
  title?: string
  variant: ToastVariant
}

export interface ToastManager {
  toasts: Ref<ToastState[]>
  showToast: (input: ToastInput) => number
  dismiss: (id: number) => void
}

export interface ToastProviderContext {
  showToast: ToastManager['showToast']
}

export const ToastSymbol = Symbol('ToastSymbol')

export const createToastManager = (): ToastManager => {
  const toasts = ref<ToastState[]>([])
  let counter = 0
  const timers = new Map<number, ReturnType<typeof setTimeout>>()

  const removeToast = (id: number) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  const dismiss = (id: number) => {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    removeToast(id)
  }

  const showToast = ({ message, title, variant = 'primary', duration = 4000 }: ToastInput) => {
    counter += 1
    const id = counter
    toasts.value = [
      ...toasts.value,
      {
        id,
        message,
        title,
        variant,
      },
    ]

    if (duration > 0) {
      const timer = globalThis.setTimeout(() => {
        timers.delete(id)
        removeToast(id)
      }, duration)
      timers.set(id, timer)
    }

    return id
  }

  return {
    toasts,
    showToast,
    dismiss,
  }
}

export const provideToast = (context: ToastProviderContext) => {
  provide(ToastSymbol, context)
}

export const useToast = () => {
  const context = inject<ToastProviderContext | null>(ToastSymbol, null)
  if (!context) {
    throw new Error('useToast debe utilizarse dentro de un proveedor de toast')
  }
  return context
}
