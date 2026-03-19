import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import CustomerPage from './pages/CustomerPage'
import KitchenPage from './pages/KitchenPage'

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{
        background: '#4a3728', color: '#fff', padding: '0 24px',
        display: 'flex', alignItems: 'center', gap: 24, height: 48,
      }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>☕ Customer</Link>
        <Link to="/kitchen" style={{ color: '#d4b896', textDecoration: 'none', fontSize: 14 }}>Kitchen Display</Link>
      </nav>
      <Routes>
        <Route path="/" element={<CustomerPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />
      </Routes>
    </BrowserRouter>
  )
}
