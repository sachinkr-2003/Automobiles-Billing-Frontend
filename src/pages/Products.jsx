import { useState, useEffect } from 'react'
import { Wrench, ShieldCheck, Circle, Zap, Search, Plus, Pencil, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'

const categoryConfig = {
  Maintenance: { color: 'bg-blue-100 text-blue-700', icon: ShieldCheck },
  Repair: { color: 'bg-red-100 text-red-700', icon: Wrench },
  Tyres: { color: 'bg-green-100 text-green-700', icon: Circle },
  Electrical: { color: 'bg-yellow-100 text-yellow-700', icon: Zap },
  Service: { color: 'bg-blue-100 text-blue-700', icon: ShieldCheck },
  Part: { color: 'bg-purple-100 text-purple-700', icon: Wrench },
}

const categories = ['All', 'Service', 'Part', 'Maintenance', 'Repair', 'Tyres', 'Electrical']
const empty = { name: '', category: 'Service', price: '', duration: '' }

export default function Products() {
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)

  const loadServices = () => {
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(s => ({
          id: s._id.slice(-6).toUpperCase(),
          _id: s._id,
          name: s.itemName,
          category: s.type || 'Service',
          price: s.price,
          duration: s.description || '-',
          timesUsed: 0
        }))
        setProducts(mapped)
      })
      .catch(console.error)
  }

  useEffect(() => { loadServices() }, [])

  const filtered = products.filter(s => {
    const matchCat = filter === 'All' || s.category === filter
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  function handleAdd(e) {
    e.preventDefault()

    const url = editingId ? `http://localhost:5000/api/products/${editingId}` : 'http://localhost:5000/api/products'
    const method = editingId ? 'PUT' : 'POST'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemName: form.name,
        type: form.category,
        price: Number(form.price),
        description: form.duration
      })
    })
    .then(() => {
      setForm(empty)
      setEditingId(null)
      setShowModal(false)
      Swal.fire({ title: 'Success', text: `Item ${editingId ? 'updated' : 'added'} successfully`, icon: 'success', timer: 1500, showConfirmButton: false })
      loadServices()
    })
    .catch(err => {
      console.error(err)
      Swal.fire({ title: 'Error', text: 'Failed to save item', icon: 'error' })
    })
  }

  const handleEdit = (s) => {
    setEditingId(s._id)
    setForm({
      name: s.name,
      category: s.category,
      price: s.price,
      duration: s.duration !== '-' ? s.duration : ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' })
          .then(() => {
            Swal.fire('Deleted!', 'Item has been deleted.', 'success')
            loadServices()
          })
          .catch(() => Swal.fire('Error!', 'Failed to delete item.', 'error'))
      }
    })
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-4 md:gap-6">

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {['Service', 'Part'].map((cat, i) => {
          const Icon = categoryConfig[cat].icon
          return (
            <div key={i} className="bg-white rounded-sm p-4 border border-gray-200  flex items-center gap-3">
              <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${categoryConfig[cat].color}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-800">{products.filter(s => s.category === cat).length}</div>
                <div className="text-xs text-gray-400">{cat}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {categories.slice(0, 3).map(c => (
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
              placeholder="Search service..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-sm pl-9 pr-3 py-1.5 text-sm outline-none focus:border-blue-400 w-full sm:w-52"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-sm transition-colors cursor-pointer"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID', 'Name', 'Type', 'Price', 'Description', 'Times Used', 'Action'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No items found.</td></tr>
              ) : filtered.map(s => {
                const Icon = categoryConfig[s.category]?.icon || Circle
                const color = categoryConfig[s.category]?.color || 'bg-gray-100 text-gray-700'
                return (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-600">{s.id}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{s.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${color}`}>
                        <Icon size={12} /> {s.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">₹{s.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-600">{s.duration}</td>
                    <td className="py-3 px-4 text-center text-gray-700 font-semibold">{s.timesUsed}</td>
                    <td className="py-3 px-4 flex gap-3">
                      <button onClick={() => handleEdit(s)} className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Edit Item">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(s._id)} className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer" title="Delete Item">
                        <Trash2 size={16} />
                      </button>
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              {[
                { label: 'Item Name', key: 'name' },
                { label: 'Price (₹)', key: 'price' },
                { label: 'Description', key: 'duration' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                  <input
                    required
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  <option value="Service">Service</option>
                  <option value="Part">Part</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-sm transition-colors cursor-pointer">{editingId ? 'Save Changes' : 'Add'}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setForm(empty); }} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-sm hover:bg-gray-50 cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
