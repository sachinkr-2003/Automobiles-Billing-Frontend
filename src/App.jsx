import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Billing from './pages/Billing'
import Customers from './pages/Customers'
import Vehicles from './pages/Vehicles'
import Products from './pages/Products'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Inventory from './pages/Inventory'
import Login from './pages/Login'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Agar naya session hai toh localStorage clear karo (desktop app restart)
    const sessionActive = sessionStorage.getItem('session_active')
    if (!sessionActive) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.setItem('session_active', 'true')
      return false
    }
    return !!localStorage.getItem('token')
  })
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [location.pathname])

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  if (!isAuthenticated) {
    return <Login setAuth={setIsAuthenticated} />
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} setAuth={setIsAuthenticated} />
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/products" element={<Products />} />
            <Route path="/sales-history" element={<Billing />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
