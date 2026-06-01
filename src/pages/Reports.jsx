import { useState, useEffect } from 'react'

export default function Reports() {
  const [monthlyData, setMonthlyData] = useState([])
  const [topServices, setTopServices] = useState([])
  
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalBills, setTotalBills] = useState(0)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/bills`)
      .then(r => r.json())
      .then(bills => {
        // Compute revenue and bills
        const rev = bills.reduce((acc, b) => acc + b.totalAmount, 0)
        setTotalRevenue(rev)
        setTotalBills(bills.length)

        // For now, we dynamically compute a single month (current) since we don't have historical data
        const monthName = new Date().toLocaleString('default', { month: 'short' })
        setMonthlyData([{ month: monthName, revenue: rev, bills: bills.length }])

        // Top Services logic
        const serviceCounts = {}
        bills.forEach(b => {
          b.items.forEach(item => {
            const name = item.service?.itemName || 'Unknown'
            if (!serviceCounts[name]) serviceCounts[name] = { count: 0, revenue: 0 }
            serviceCounts[name].count += item.quantity
            serviceCounts[name].revenue += item.price * item.quantity
          })
        })

        const top = Object.keys(serviceCounts).map(k => ({
          name: k,
          revenue: serviceCounts[k].revenue,
          count: serviceCounts[k].count
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

        setTopServices(top)
      })
      .catch(console.error)
  }, [])

  const avgBill = totalBills > 0 ? Math.round(totalRevenue / totalBills) : 0
  const maxRevenue = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.revenue)) : 1

  return (
    <div className="p-4 md:p-7 flex flex-col gap-4 md:gap-6">

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Revenue (2025)', value: `₹${totalRevenue.toLocaleString()}`, icon: '💰' },
          { label: 'Total Bills (2025)', value: totalBills, icon: '🧾' },
          { label: 'Avg. Bill Value', value: `₹${avgBill.toLocaleString()}`, icon: '📊' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-sm p-5 border border-gray-200  flex items-center gap-4">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-sm p-6 border border-gray-200 ">
        <h2 className="text-base font-bold text-gray-800 mb-6">Monthly Revenue (2025)</h2>
        <div className="flex items-end gap-4 h-48">
          {monthlyData.length === 0 ? <p className="text-gray-400">No data available yet.</p> : monthlyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">₹{(d.revenue / 1000).toFixed(1)}k</span>
              <div
                className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                style={{ height: `${maxRevenue > 0 ? (d.revenue / maxRevenue) * 160 : 0}px`, minHeight: '10px' }}
              />
              <span className="text-xs text-gray-400">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Table + Top Services */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Monthly Breakdown */}
        <div className="bg-white rounded-sm p-5 border border-gray-200 ">
          <h2 className="text-base font-bold text-gray-800 mb-4">Monthly Breakdown</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {['Month', 'Revenue', 'Bills', 'Avg/Bill'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyData.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-4 text-gray-400">No data.</td></tr>
              ) : monthlyData.map((d, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-semibold text-gray-700">{d.month}</td>
                  <td className="py-2.5 px-3 font-bold text-blue-600">₹{d.revenue.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-gray-600">{d.bills}</td>
                  <td className="py-2.5 px-3 text-gray-600">₹{d.bills > 0 ? Math.round(d.revenue / d.bills).toLocaleString() : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Services */}
        <div className="bg-white rounded-sm p-5 border border-gray-200 ">
          <h2 className="text-base font-bold text-gray-800 mb-4">Top Services by Revenue</h2>
          <div className="flex flex-col gap-4">
            {topServices.length === 0 ? <p className="text-gray-400">No services billed yet.</p> : topServices.map((s, i) => {
              const maxRev = topServices[0].revenue || 1
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-700">{s.name}</span>
                    <span className="text-sm font-bold text-blue-600">₹{s.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded h-2">
                    <div
                      className="bg-blue-500 h-2 rounded transition-all"
                      style={{ width: `${(s.revenue / maxRev) * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.count} times used</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
