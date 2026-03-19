import { useEffect, useState } from 'react'
import type { Order } from '../types'
import { api } from '../api'
import { OrderCard } from '../components/OrderCard'

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState('')

  function refresh() {
    api.getOrders()
      .then(setOrders)
      .catch(() => setError('Failed to load orders'))
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [])

  async function handle(action: () => Promise<Order>) {
    try {
      const updated = await action()
      setOrders(prev => prev.map(o => o.orderId === updated.orderId ? updated : o))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Action failed')
    }
  }

  async function cancel(orderId: string) {
    const reason = window.prompt('Reason for cancelling?')
    if (!reason) return
    await handle(() => api.cancelOrder(orderId, reason))
    refresh()
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 2 }}>Kitchen Display</h1>
          <p style={{ color: '#888', fontSize: 13 }}>Auto-refreshes every 3 seconds</p>
        </div>
        <button onClick={refresh} style={{ background: '#f0ebe6', border: '1px solid #ccc', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
          {error} <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', float: 'right' }}>✕</button>
        </div>
      )}

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>☕</div>
          <div style={{ fontSize: 18 }}>No active orders</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Waiting for customers...</div>
        </div>
      ) : (
        orders.map(order => (
          <OrderCard
            key={order.orderId}
            order={order}
            onAccept={order.status === 'PENDING' ? () => handle(() => api.acceptOrder(order.orderId)) : undefined}
            onReady={order.status === 'ACCEPTED' ? () => handle(() => api.markOrderReady(order.orderId)) : undefined}
            onCancel={(order.status === 'PENDING' || order.status === 'ACCEPTED') ? () => cancel(order.orderId) : undefined}
          />
        ))
      )}
    </div>
  )
}
