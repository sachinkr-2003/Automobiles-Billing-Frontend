import { Plus, Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const pageTitles = {
  dashboard: { title: 'Dashboard', sub: "Welcome back! Here's what's happening today." },
  billing: { title: 'Billing', sub: 'Manage and create invoices.' },
  customers: { title: 'Customers', sub: 'View and manage your customers.' },
  vehicles: { title: 'Vehicles', sub: 'Track all registered vehicles.' },
  services: { title: 'Services', sub: 'Manage service catalog.' },
  inventory: { title: 'Inventory', sub: 'Manage parts and stock availability.' },
  reports: { title: 'Reports', sub: 'View business analytics and reports.' },
  settings: { title: 'Settings', sub: 'Configure your preferences.' },
}

export default function Topbar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation()
  const navigate = useNavigate()
  const active = location.pathname.substring(1) || 'dashboard'
  const { title, sub } = pageTitles[active] || pageTitles.dashboard
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'))

  useEffect(() => {
    const handleUpdate = () => {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'))
    }
    window.addEventListener('userUpdated', handleUpdate)
    return () => window.removeEventListener('userUpdated', handleUpdate)
  }, [])

  return (
    <header className="flex items-center justify-between py-4 px-4 md:px-7 border-b border-gray-200 bg-white sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button 
          className="p-1 -ml-2 text-gray-500 hover:bg-gray-100 rounded"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">{title}</h1>
          <p className="text-xs md:text-sm text-gray-400 hidden sm:block">{sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={() => navigate('/billing')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-sm transition-colors cursor-pointer"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Bill</span>
          <span className="sm:hidden">Bill</span>
        </button>
        
        <div className="flex items-center gap-2 border-l border-gray-200 pl-3 md:pl-4">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-300 shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="Admin" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-gray-800 leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-gray-500 leading-tight mt-0.5">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}
