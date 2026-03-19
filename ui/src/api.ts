import type { MenuItem, Order } from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
  return body as T
}

export const api = {
  getMenu: () => request<MenuItem[]>('/menu'),

  placeOrder: (data: { customerId: string; customerName: string; items: { itemId: string; name: string; quantity: number; unitPrice: number }[] }) =>
    request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  getOrders: () => request<Order[]>('/orders'),

  getOrder: (id: string) => request<Order>(`/orders/${id}`),

  acceptOrder: (id: string) =>
    request<Order>(`/orders/${id}/accept`, { method: 'POST' }),

  markOrderReady: (id: string) =>
    request<Order>(`/orders/${id}/ready`, { method: 'POST' }),

  collectOrder: (id: string) =>
    request<Order>(`/orders/${id}/collect`, { method: 'POST' }),

  cancelOrder: (id: string, reason: string) =>
    request<Order>(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
}
