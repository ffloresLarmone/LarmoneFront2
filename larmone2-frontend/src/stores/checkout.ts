import { defineStore } from 'pinia'
import type { Venta } from '../types/api'

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
}

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
  customerInfo: CustomerInfo | null
  shippingAddress: ShippingAddress | null
  shippingOptionId: ShippingOptionId | null
  paymentStatus: PaymentStatus
  sale: Venta | null
}

const INITIAL_STATE: CheckoutState = {
  purchaseMode: null,
  customerInfo: null,
  shippingAddress: null,
  shippingOptionId: null,
  paymentStatus: null,
  sale: null,
}

export const useCheckoutStore = defineStore('checkout', {
  state: (): CheckoutState => ({ ...INITIAL_STATE }),
  getters: {
    isReadyForShipping(state): boolean {
      return state.purchaseMode !== null
    },
    isReadyForPayment(state): boolean {
      return (
        state.purchaseMode !== null &&
        state.customerInfo !== null &&
        state.shippingAddress !== null &&
        state.shippingOptionId !== null
      )
    },
    hasSale(state): boolean {
      return state.sale !== null
    },
  },
  actions: {
    setPurchaseMode(mode: PurchaseMode) {
      this.purchaseMode = mode
    },
    setCustomerInfo(info: CustomerInfo) {
      this.customerInfo = info
    },
    setShippingDetails(address: ShippingAddress, optionId: ShippingOptionId) {
      this.shippingAddress = address
      this.shippingOptionId = optionId
    },
    setSale(sale: Venta | null) {
      this.sale = sale
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
      this.customerInfo = null
      this.shippingAddress = null
      this.shippingOptionId = null
      this.paymentStatus = null
      this.sale = null
    },
  },
})
