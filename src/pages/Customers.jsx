import { useState, useEffect } from 'react'
import { Users, Car, FileText, Search, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'

const empty = { name: '', phone: '', email: '', city: '', brand: '', model: '', year: '', plate: '' }

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)

  const loadCustomers = () => {
    fetch(`${import.meta.env.VITE_API_URL}/customers`)
      .then(res => res.json())
      .then(data => {
         const mapped = data.map(c => ({
           id: c._id.slice(-6).toUpperCase(),
           _id: c._id,
           name: c.name,
           phone: c.phone,
           email: c.email || '-',
           city: c.address || '-',
           vehicles: 0,
           totalBills: 0
         }))
         setCustomers(mapped)
      })
      .catch(err => console.error(err))
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAdd(e) {
    e.preventDefault()
    try {
      const url = editingId ? `${import.meta.env.VITE_API_URL}/customers/${editingId}` : `${import.meta.env.VITE_API_URL}/customers`
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, email: form.email, address: form.city })
      })
      const dataOrError = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(dataOrError.message || 'Failed to save customer')
      
      const customer = dataOrError
      
      if (!editingId && form.plate) {
        const vRes = await fetch(`${import.meta.env.VITE_API_URL}/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: customer._id,
            make: form.brand || 'Unknown',
            model: form.model || 'Unknown',
            licensePlate: form.plate,
            year: form.year || new Date().getFullYear()
          })
        })
        if (!vRes.ok) {
          const vData = await vRes.json().catch(() => ({}))
          throw new Error(vData.message || 'Failed to add vehicle')
        }
      }

      setForm(empty)
      setEditingId(null)
      setShowModal(false)
      Swal.fire({ title: 'Success', text: `Customer ${editingId ? 'updated' : 'added'} successfully`, icon: 'success', timer: 1500, showConfirmButton: false })
      loadCustomers()
    } catch (err) {
      console.error(err)
      Swal.fire({ title: 'Error', text: err.message || 'Failed to save customer', icon: 'error' })
    }
  }

  const handleEdit = (c) => {
    setEditingId(c._id)
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email !== '-' ? c.email : '',
      city: c.city !== '-' ? c.city : '',
      brand: '', model: '', year: '', plate: ''
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
        fetch(`${import.meta.env.VITE_API_URL}/customers/${id}`, { method: 'DELETE' })
          .then(() => {
            Swal.fire('Deleted!', 'Customer has been deleted.', 'success')
            loadCustomers()
          })
          .catch(() => Swal.fire('Error!', 'Failed to delete customer.', 'error'))
      }
    })
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-4 md:gap-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Customers', value: customers.length, icon: Users, color: 'bg-purple-100 text-purple-600' },
          { label: 'Total Vehicles', value: customers.reduce((a, c) => a + c.vehicles, 0), icon: Car, color: 'bg-blue-100 text-blue-600' },
          { label: 'Total Bills', value: customers.reduce((a, c) => a + c.totalBills, 0), icon: FileText, color: 'bg-green-100 text-green-600' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-white rounded-sm p-5 border border-gray-200  flex items-center gap-4">
              <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${s.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                <div className="text-sm text-gray-400">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-sm pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400 w-full sm:w-72"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-sm transition-colors cursor-pointer"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200  overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID', 'Name', 'Phone', 'Email', 'City', 'Vehicles', 'Bills', 'Action'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No customers found.</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-blue-600">{c.id}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800">{c.name}</td>
                  <td className="py-3 px-4 text-gray-600">{c.phone}</td>
                  <td className="py-3 px-4 text-gray-500">{c.email}</td>
                  <td className="py-3 px-4 text-gray-600">{c.city}</td>
                  <td className="py-3 px-4 text-center text-gray-700 font-semibold">{c.vehicles}</td>
                  <td className="py-3 px-4 text-center text-gray-700 font-semibold">{c.totalBills}</td>
                  <td className="py-3 px-4 flex gap-3">
                    <button onClick={() => handleEdit(c)} className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Edit Customer">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer" title="Delete Customer">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm p-6 w-full max-w-md shadow max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Full Name*', key: 'name', req: true },
                  { label: 'Phone Number*', key: 'phone', req: true },
                  { label: 'Email', key: 'email', req: false },
                  { label: 'City', key: 'city', req: false },
                ].map(f => (
                  <div key={f.key} className={(f.key === 'name' || f.key === 'phone') ? 'col-span-2' : ''}>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                    <input
                      required={f.req}
                      value={form[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                ))}
              </div>

              {!editingId && (
                <div className="mt-2 pt-3 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Car size={16} /> Vehicle Details (Optional)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Brand', key: 'brand' },
                      { label: 'Model', key: 'model' },
                      { label: 'Year', key: 'year' },
                      { label: 'Number Plate*', key: 'plate' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                        <input
                          value={form[f.key]}
                          onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                          className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400"
                          placeholder={f.key === 'plate' ? 'e.g. MH12AB1234' : ''}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-sm transition-colors cursor-pointer">{editingId ? 'Save Changes' : 'Register'}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setForm(empty); }} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2 rounded-sm hover:bg-gray-50 cursor-pointer">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
