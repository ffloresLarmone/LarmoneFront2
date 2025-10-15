import { defineStore } from 'pinia'

export type PurchaseMode = 'guest' | 'customer'

export type PaymentStatus = 'success' | 'failure' | null

export type ShippingOptionId = 'express' | 'standard' | 'pickup' | string

export interface ShippingAddress {
  regionId: string
  regionName: string
  cityId: string
  cityName: string
  communeId: string
  communeName: string
  street: string
  number: string
  apartment?: string
  instructions?: string
}

interface CheckoutState {
  purchaseMode: PurchaseMode | null
  shippingAddress: ShippingAddress | null
  shippingOptionId: ShippingOptionId | null
  paymentStatus: PaymentStatus
}

const INITIAL_STATE: CheckoutState = {
  purchaseMode: null,
  shippingAddress: null,
  shippingOptionId: null,
  paymentStatus: null,
}

export const useCheckoutStore = defineStore('checkout', {
  state: (): CheckoutState => ({ ...INITIAL_STATE }),
  getters: {
    isReadyForShipping(state): boolean {
      return state.purchaseMode !== null
    },
    isReadyForPayment(state): boolean {
      return state.purchaseMode !== null && state.shippingAddress !== null && state.shippingOptionId !== null
    },
  },
  actions: {
    setPurchaseMode(mode: PurchaseMode) {
      this.purchaseMode = mode
    },
    setShippingDetails(address: ShippingAddress, optionId: ShippingOptionId) {
      this.shippingAddress = address
      this.shippingOptionId = optionId
    },
    resetShipping() {
      this.shippingAddress = null
      this.shippingOptionId = null
    },
    async processPayment(forcedStatus?: Exclude<PaymentStatus, null>) {
      this.paymentStatus = null
      await new Promise((resolve) => setTimeout(resolve, 1200))

      if (forcedStatus) {
        this.paymentStatus = forcedStatus
        return forcedStatus
      }

      const status: Exclude<PaymentStatus, null> = Math.random() > 0.2 ? 'success' : 'failure'
      this.paymentStatus = status
      return status
    },
    clear() {
      this.purchaseMode = null
      this.shippingAddress = null
      this.shippingOptionId = null
      this.paymentStatus = null
    },
  },
})
