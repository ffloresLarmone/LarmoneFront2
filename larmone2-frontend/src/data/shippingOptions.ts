export interface ShippingOption {
  id: string
  name: string
  description: string
  eta: string
  price: number
}

export const shippingOptions: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Envío estándar',
    description: 'Entrega en domicilio con cobertura nacional.',
    eta: '3 a 5 días hábiles',
    price: 3990,
  },
  {
    id: 'express',
    name: 'Envío express',
    description: 'Prioridad en preparación y transporte para entregas urgentes.',
    eta: '24 a 48 horas hábiles',
    price: 6990,
  },
  {
    id: 'pickup',
    name: 'Retiro en tienda',
    description: 'Retira tu pedido en nuestro showroom de Santiago sin costo adicional.',
    eta: 'Disponible en 24 horas hábiles',
    price: 0,
  },
]
