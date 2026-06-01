import { useState, useEffect } from 'react'
import { DollarSign, FileText, Users, Car, FilePlus, UserPlus, CarFront, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const statusStyle = {
  Paid: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Unpaid: 'bg-red-100 text-red-700',
}

const quickActions = [
  { icon: FilePlus, label: 'Create Invoice', page: 'billing' },
  { icon: UserPlus, label: 'Add Customer', page: 'customers' },
  { icon: CarFront, label: 'Register Vehicle', page: 'vehicles' },
  { icon: Wrench, label: 'Add Service', page: 'services' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ revenue: 0, bills: 0, customers: 0, vehicles: 0 })
  const [recentBills, setRecentBills] = useState([])

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/bills`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/customers`).then(r => r.json()),
      fetch(`${import.meta.env.VITE_API_URL}/vehicles`).then(r => r.json()),
    ]).then(([billsData, customersData, vehiclesData]) => {
      
      const totalRevenue = billsData.reduce((acc, b) => acc + b.totalAmount, 0)
      setStats({
        revenue: totalRevenue,
        bills: billsData.length,
        customers: customersData.length,
        vehicles: vehiclesData.length
      })

      const mappedRecent = billsData.slice(-5).reverse().map(b => ({
        id: `INV-${b._id.slice(-6).toUpperCase()}`,
        customer: b.customer?.name || 'Unknown',
        vehicle: b.vehicle?.licensePlate || 'Unknown',
        service: b.items.length + ' Items',
        amount: `₹${b.totalAmount.toLocaleString()}`,
        status: b.status,
        date: new Date(b.date).toLocaleDateString()
      }))
      setRecentBills(mappedRecent)

    }).catch(console.error)
  }, [])

  return (
    <div className="p-4 md:p-7 flex flex-col gap-4 md:gap-6">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-100 text-green-600' },
          { label: 'Total Bills', value: stats.bills, icon: FileText, color: 'bg-blue-100 text-blue-600' },
          { label: 'Customers', value: stats.customers, icon: Users, color: 'bg-purple-100 text-purple-600' },
          { label: 'Vehicles Serviced', value: stats.vehicles, icon: Car, color: 'bg-orange-100 text-orange-600' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-white rounded-sm p-5 border border-gray-200   ">
              <div className={`w-10 h-10 rounded-sm flex items-center justify-center mb-3 ${s.color}`}>
                <Icon size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              <div className="text-sm text-gray-400 mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-sm p-5 border border-gray-200 ">
        <h2 className="text-base font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((a, i) => {
            const Icon = a.icon
            return (
              <button
                key={i}
                onClick={() => navigate(`/${a.page}`)}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-200 px-4 py-2.5 rounded-sm text-sm font-semibold transition-all cursor-pointer"
              >
                <Icon size={16} />
                {a.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent Bills */}
      <div className="bg-white rounded-sm p-5 border border-gray-200 ">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">Recent Bills</h2>
          <button
            onClick={() => navigate('/billing')}
            className="text-sm text-blue-600 border border-blue-200 px-3 py-1.5 rounded-sm hover:bg-blue-50 transition-colors cursor-pointer"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {['Invoice ID', 'Customer', 'Vehicle', 'Service', 'Amount', 'Date', 'Status'].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBills.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-6 text-gray-400">No recent bills.</td></tr>
              ) : recentBills.map(bill => (
                <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-blue-600">{bill.id}</td>
                  <td className="py-3 px-3 text-gray-700">{bill.customer}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{bill.vehicle}</td>
                  <td className="py-3 px-3 text-gray-700">{bill.service}</td>
                  <td className="py-3 px-3 font-bold text-gray-800">{bill.amount}</td>
                  <td className="py-3 px-3 text-gray-500">{bill.date}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold ${statusStyle[bill.status] || statusStyle.Pending}`}>
                      {bill.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
