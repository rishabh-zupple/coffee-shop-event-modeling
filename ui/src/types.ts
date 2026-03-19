export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'READY' | 'COLLECTED' | 'CANCELLED'

export interface OrderItem {
  itemId: string
  name: string
  quantity: number
  unitPrice: number
}

export interface Order {
  orderId: string
  customerId: string
  customerName: string
  items: OrderItem[]
  status: OrderStatus
  totalAmount: number
  placedAt: string
  acceptedAt?: string
  readyAt?: string
  collectedAt?: string
  cancelledAt?: string
  cancellationReason?: string
}

export interface MenuItem {
  itemId: string
  name: string
  unitPrice: number
  formattedPrice: string
}
