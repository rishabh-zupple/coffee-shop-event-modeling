import { useEffect, useState, useRef } from 'react'
import type { MenuItem, Order } from '../types'
import { api } from '../api'
import { StatusBadge } from '../components/StatusBadge'

function formatKES(cents: number) {
  return `KES ${(cents / 100).toFixed(2)}`
}

const STATUS_MESSAGES: Record<string, string> = {
  PENDING:   'Order received — waiting for barista',
  ACCEPTED:  'Being prepared by our team',
  READY:     'Ready for collection!',
  COLLECTED: 'Collected — enjoy your order!',
}

export default function CustomerPage() {
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [name, setName] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    api.getMenu().then(setMenu).catch(() => setError('Failed to load menu'))
  }, [])

  useEffect(() => {
    if (!order) return
    if (order.status === 'COLLECTED' || order.status === 'CANCELLED') {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    pollRef.current = setInterval(() => {
      api.getOrder(order.orderId)
        .then(setOrder)
        .catch(() => {})
    }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [order?.orderId, order?.status])

  function setQty(itemId: string, delta: number) {
    setQuantities(prev => {
      const next = Math.max(0, (prev[itemId] ?? 0) + delta)
      return { ...prev, [itemId]: next }
    })
  }

  async function placeOrder() {
    setError('')
    if (!name.trim()) { setError('Please enter your name'); return }
    const items = menu
      .filter(m => (quantities[m.itemId] ?? 0) > 0)
      .map(m => ({ itemId: m.itemId, name: m.name, quantity: quantities[m.itemId], unitPrice: m.unitPrice }))
    if (items.length === 0) { setError('Please select at least one item'); return }
    try {
      const placed = await api.placeOrder({ customerId: 'customer-1', customerName: name.trim(), items })
      setOrder(placed)
      setQuantities({})
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to place order')
    }
  }

  async function collect() {
    if (!order) return
    try {
      setOrder(await api.collectOrder(order.orderId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to collect order')
    }
  }

  async function cancelOrder() {
    if (!order) return
    const reason = window.prompt('Reason for cancelling?')
    if (!reason) return
    try {
      setOrder(await api.cancelOrder(order.orderId, reason))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to cancel order')
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>☕ Coffee Shop</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Order your favourite drinks and snacks</p>

      {error && (
        <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!order && (
        <>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Menu</h2>
            {menu.map(item => (
              <div key={item.itemId} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '1px solid #eee',
              }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                  <div style={{ color: '#888', fontSize: 13 }}>{item.formattedPrice}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setQty(item.itemId, -1)} style={qtyBtn}>−</button>
                  <span style={{ minWidth: 20, textAlign: 'center' }}>{quantities[item.itemId] ?? 0}</span>
                  <button onClick={() => setQty(item.itemId, 1)} style={qtyBtn}>+</button>
                </div>
              </div>
            ))}
          </section>

          <section>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Your Details</h2>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 15, marginBottom: 12 }}
            />
            <button onClick={placeOrder} style={{ background: '#4a3728', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 15, cursor: 'pointer', width: '100%' }}>
              Place Order
            </button>
          </section>
        </>
      )}

      {order && (
        <section style={{ background: '#fff', border: '1px solid #e0d8d0', borderRadius: 10, padding: '24px' }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Your Order</h2>
          <div style={{ marginBottom: 8, fontSize: 13, color: '#888' }}>Order #{order.orderId.slice(0, 8)}</div>

          <ul style={{ listStyle: 'none', paddingLeft: 0, marginBottom: 12 }}>
            {order.items.map(item => (
              <li key={item.itemId} style={{ fontSize: 14, marginBottom: 4 }}>
                {item.quantity}× {item.name}
              </li>
            ))}
          </ul>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Total: {formatKES(order.totalAmount)}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <StatusBadge status={order.status} />
            <span style={{ fontSize: 14 }}>
              {order.status === 'CANCELLED'
                ? `Order cancelled: ${order.cancellationReason}`
                : STATUS_MESSAGES[order.status]}
            </span>
          </div>

          {order.status === 'READY' && (
            <button onClick={collect} style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', marginRight: 8 }}>
              I've collected my order
            </button>
          )}
          {(order.status === 'PENDING' || order.status === 'ACCEPTED') && (
            <button onClick={cancelOrder} style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>
              Cancel Order
            </button>
          )}
          {(order.status === 'COLLECTED' || order.status === 'CANCELLED') && (
            <button onClick={() => { setOrder(null); setName('') }} style={{ background: '#6c757d', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}>
              Place a new order
            </button>
          )}
        </section>
      )}
    </div>
  )
}

const qtyBtn: React.CSSProperties = {
  width: 28, height: 28, border: '1px solid #ccc', borderRadius: 6,
  background: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1,
}
