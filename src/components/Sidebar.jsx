import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, Car, Wrench, BarChart2, Settings, Car as CarLogo, UserCircle, Package, LogOut, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Wrench, label: 'Products', id: 'products' },
  { icon: Users, label: 'Customers', id: 'customers' },
  { icon: FileText, label: 'Billing', id: 'billing' },
  { icon: BarChart2, label: 'Sales History', id: 'sales-history' },
  { icon: Package, label: 'Inventory', id: 'inventory' },
  { icon: BarChart2, label: 'Reports', id: 'reports' },
  { icon: Settings, label: 'Settings', id: 'settings' },
]

export default function Sidebar({ open, setOpen, setAuth }) {
  const location = useLocation();
  const active = location.pathname.substring(1) || 'dashboard';
  const [user, setUser] = useState({ name: 'Admin User', email: 'admin@autobill.com' })

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (saved) setUser(JSON.parse(saved))
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuth(false)
  }

  return (
    <aside 
      className={`fixed md:sticky top-0 left-0 h-screen z-50 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 shadow-xl md:shadow-sm
        ${open ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'} 
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <CarLogo size={20} className="text-white" />
          </div>
          {open && (
            <span className="text-white font-extrabold text-xl tracking-tight whitespace-nowrap block">
              AutoBill
            </span>
          )}
        </div>
        {/* Mobile Close Button */}
        {open && (
          <button onClick={() => setOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1.5 p-3 overflow-y-auto mt-2">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <Link
              key={item.id}
              to={`/${item.id}`}
              className={`flex items-center gap-3 px-3 py-3 rounded text-sm transition-all w-full text-left cursor-pointer group
                ${isActive
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 font-medium hover:bg-slate-800 hover:text-white'}`}
            >
              <Icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span className={`whitespace-nowrap ${open ? 'block' : 'hidden'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-slate-800 p-3 flex flex-col gap-2">
        <div className={`flex items-center gap-3 p-2 rounded hover:bg-slate-800 transition-colors cursor-pointer ${open ? 'justify-start' : 'justify-center md:justify-center'}`}>
          <UserCircle size={24} className="text-slate-400 shrink-0" />
          <div className={`flex-col overflow-hidden flex ${open ? 'block' : 'hidden'}`}>
            <span className="text-sm font-bold text-white truncate">{user.name}</span>
            <span className="text-xs text-slate-400 truncate">{user.email}</span>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className={`w-full py-2 flex items-center justify-center gap-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer text-sm font-bold`}
          title="Logout"
        >
          <LogOut size={16} />
          <span className={`${open ? 'block' : 'hidden'}`}>Logout</span>
        </button>
      </div>
    </aside>
  )
}
