import type { Order } from '../types'
import { StatusBadge } from './StatusBadge'

function formatKES(cents: number) {
  return `KES ${(cents / 100).toFixed(2)}`
}

function elapsed(placedAt: string) {
  const secs = Math.floor((Date.now() - new Date(placedAt).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  return `${mins}m ago`
}

interface Props {
  order: Order
  onAccept?: () => void
  onReady?: () => void
  onCancel?: () => void
}

export function OrderCard({ order, onAccept, onReady, onCancel }: Props) {
  const isReady = order.status === 'READY'
  return (
    <div style={{
      background: isReady ? '#d4edda' : '#fff',
      border: '1px solid',
      borderColor: isReady ? '#a2d9b1' : '#e0d8d0',
      borderRadius: 10,
      padding: '16px 20px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 16 }}>{order.customerName}</strong>
        <StatusBadge status={order.status} />
      </div>
      <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
        #{order.orderId.slice(0, 8)} · {elapsed(order.placedAt)}
      </div>
      <ul style={{ listStyle: 'none', margin: '8px 0', paddingLeft: 0 }}>
        {order.items.map((item) => (
          <li key={item.itemId} style={{ fontSize: 14 }}>
            {item.quantity}× {item.name} <span style={{ color: '#888' }}>({formatKES(item.unitPrice)} each)</span>
          </li>
        ))}
      </ul>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>{formatKES(order.totalAmount)}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {order.status === 'PENDING' && onAccept && (
          <button onClick={onAccept} style={btnStyle('#007bff')}>Accept</button>
        )}
        {order.status === 'ACCEPTED' && onReady && (
          <button onClick={onReady} style={btnStyle('#28a745')}>Mark Ready</button>
        )}
        {(order.status === 'PENDING' || order.status === 'ACCEPTED') && onCancel && (
          <button onClick={onCancel} style={btnStyle('#dc3545')}>Cancel</button>
        )}
      </div>
    </div>
  )
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
  }
}
