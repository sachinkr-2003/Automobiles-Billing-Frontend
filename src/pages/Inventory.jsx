import { useState, useEffect } from 'react'
import { Package, Search, Plus, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import Swal from 'sweetalert2'

const categories = ['All', 'Consumables', 'Filters', 'Brakes', 'Electrical', 'Accessories']
const empty = { name: '', category: 'Consumables', stock: '', minStock: '', price: '' }

export default function Inventory() {
  const [inventory, setInventory] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)

  const loadData = () => {
    fetch('http://localhost:5000/api/products')
      .then(r => r.json())
      .then(data => {
        const parts = data.filter(d => d.type === 'Part').map(p => ({
          id: `PRT-${p._id.slice(-6).toUpperCase()}`,
          _id: p._id,
          name: p.itemName,
          category: 'Accessories', 
          stock: p.stock !== undefined ? p.stock : 0,
          minStock: p.minStock !== undefined ? p.minStock : 5,
          price: p.price
        }))
        setInventory(parts)
      }).catch(console.error)
  }

  useEffect(() => { loadData() }, [])

  const filtered = inventory.filter(p => {
    const matchCat = filter === 'All' || p.category === filter
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  function handleAdd(e) {
    e.preventDefault()
    fetch('http://localhost:5000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemName: form.name,
        type: 'Part',
        price: Number(form.price),
        description: 'Added via Inventory',
        stock: Number(form.stock),
        minStock: Number(form.minStock)
      })
    }).then(() => {
      setForm(empty)
      setShowModal(false)
      Swal.fire({ title: 'Success', text: 'Part added successfully', icon: 'success', timer: 1500, showConfirmButton: false })
      loadData()
    }).catch(err => {
      console.error(err)
      Swal.fire({ title: 'Error', text: 'Failed to add part', icon: 'error' })
    })
  }

  function getStatusInfo(stock, minStock) {
    if (stock === 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50', icon: XCircle }
    if (stock <= minStock) return { label: 'Low Stock', color: 'text-orange-600 bg-orange-50', icon: AlertTriangle }
    return { label: 'In Stock', color: 'text-green-600 bg-green-50', icon: CheckCircle }
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-4 md:gap-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        <div className="bg-white rounded-sm p-4 border border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-blue-100 text-blue-600">
            <Package size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">{inventory.length}</div>
            <div className="text-xs text-gray-400">Total Parts</div>
          </div>
        </div>
        <div className="bg-white rounded-sm p-4 border border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-green-100 text-green-600">
            <CheckCircle size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">{inventory.filter(p => p.stock > p.minStock).length}</div>
            <div className="text-xs text-gray-400">In Stock</div>
          </div>
        </div>
        <div className="bg-white rounded-sm p-4 border border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-orange-100 text-orange-600">
            <AlertTriangle size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">{inventory.filter(p => p.stock > 0 && p.stock <= p.minStock).length}</div>
            <div className="text-xs text-gray-400">Low Stock</div>
          </div>
        </div>
        <div className="bg-white rounded-sm p-4 border border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-red-100 text-red-600">
            <XCircle size={18} />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-800">{inventory.filter(p => p.stock === 0).length}</div>
            <div className="text-xs text-gray-400">Out of Stock</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-sm text-sm font-semibold border transition-all cursor-pointer
                ${filter === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search parts by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-sm pl-9 pr-3 py-1.5 text-sm outline-none focus:border-blue-400 w-full sm:w-56"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-sm transition-colors cursor-pointer"
          >
            <Plus size={16} /> Add Part
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Part ID', 'Part Name', 'Category', 'Stock Available', 'Min Stock', 'Price (₹)', 'Status'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No parts found in inventory.</td></tr>
              ) : filtered.map(p => {
                const status = getStatusInfo(p.stock, p.minStock)
                const StatusIcon = status.icon
                return (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-600">{p.id}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{p.name}</td>
                    <td className="py-3 px-4 text-gray-600">{p.category}</td>
                    <td className="py-3 px-4 font-bold text-gray-800">{p.stock}</td>
                    <td className="py-3 px-4 text-gray-500">{p.minStock}</td>
                    <td className="py-3 px-4 font-bold text-gray-800">₹{p.price.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${status.color}`}>
                        <StatusIcon size={12} /> {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm p-6 w-full max-w-md shadow max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Part</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Part Name</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Initial Stock</label>
                  <input type="number" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Minimum Stock</label>
                  <input type="number" required value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Unit Price (₹)</label>
                <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              
              <div className="flex gap-3 mt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-sm transition-colors cursor-pointer">Add Part</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-sm hover:bg-gray-50 cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
