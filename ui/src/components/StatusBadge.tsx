import type { OrderStatus } from '../types'

const styles: Record<OrderStatus, { background: string; color: string }> = {
  PENDING:   { background: '#fff3cd', color: '#856404' },
  ACCEPTED:  { background: '#cce5ff', color: '#004085' },
  READY:     { background: '#d4edda', color: '#155724' },
  COLLECTED: { background: '#e2e3e5', color: '#383d41' },
  CANCELLED: { background: '#f8d7da', color: '#721c24' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = styles[status]
  return (
    <span style={{
      ...s,
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 0.5,
    }}>
      {status}
    </span>
  )
}
