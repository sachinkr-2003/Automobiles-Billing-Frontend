import { useState, useEffect } from 'react'
import { Car, Fuel, Search, Plus, History, Pencil, Trash2 } from 'lucide-react'
import Select from 'react-select'
import Swal from 'sweetalert2'

const fuelColors = {
  Petrol: 'bg-blue-100 text-blue-700',
  Diesel: 'bg-orange-100 text-orange-700',
  CNG: 'bg-green-100 text-green-700',
  Electric: 'bg-purple-100 text-purple-700',
}

const empty = { owner: '', brand: '', model: '', year: '', plate: '', fuel: 'Petrol', color: '' }

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)

  const loadData = () => {
    fetch('http://localhost:5000/api/vehicles')
      .then(res => res.json())
      .then(data => {
        const mapped = data.map(v => ({
          id: v._id.slice(-6).toUpperCase(),
          _id: v._id,
          owner: v.customer ? v.customer.name : 'Unknown',
          ownerId: v.customer ? v.customer._id : null,
          brand: v.make,
          model: v.model,
          year: v.year || '-',
          plate: v.licensePlate,
          fuel: 'Petrol', // Backend doesn't have fuel/color yet, default it
          color: '-',
          services: 0,
          totalSpent: 0
        }))
        setVehicles(mapped)
      })
      .catch(console.error)

    fetch('http://localhost:5000/api/customers')
      .then(res => res.json())
      .then(setCustomers)
      .catch(console.error)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = vehicles.filter(v =>
    v.owner.toLowerCase().includes(search.toLowerCase()) ||
    v.plate.toLowerCase().includes(search.toLowerCase()) ||
    v.brand.toLowerCase().includes(search.toLowerCase()) ||
    v.model.toLowerCase().includes(search.toLowerCase())
  )

  function handleAdd(e) {
    e.preventDefault()

    const url = editingId ? `http://localhost:5000/api/vehicles/${editingId}` : 'http://localhost:5000/api/vehicles'
    const method = editingId ? 'PUT' : 'POST'

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: form.owner, // ID from dropdown
        make: form.brand,
        model: form.model,
        licensePlate: form.plate,
        year: form.year
      })
    })
    .then(() => {
      setForm(empty)
      setEditingId(null)
      setShowModal(false)
      Swal.fire({ title: 'Success', text: `Vehicle ${editingId ? 'updated' : 'registered'} successfully`, icon: 'success', timer: 1500, showConfirmButton: false })
      loadData()
    })
    .catch(err => {
      console.error(err)
      Swal.fire({ title: 'Error', text: 'Failed to save vehicle', icon: 'error' })
    })
  }

  const handleEdit = (v) => {
    setEditingId(v._id)
    setForm({
      owner: v.ownerId,
      brand: v.brand,
      model: v.model,
      year: v.year !== '-' ? v.year : '',
      plate: v.plate,
      fuel: v.fuel,
      color: v.color !== '-' ? v.color : ''
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
        fetch(`http://localhost:5000/api/vehicles/${id}`, { method: 'DELETE' })
          .then(() => {
            Swal.fire('Deleted!', 'Vehicle has been deleted.', 'success')
            loadData()
          })
          .catch(() => Swal.fire('Error!', 'Failed to delete vehicle.', 'error'))
      }
    })
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-4 md:gap-6">

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Vehicles', value: vehicles.length, icon: Car, color: 'bg-blue-100 text-blue-600' },
          { label: 'Petrol Vehicles', value: vehicles.filter(v => v.fuel === 'Petrol').length, icon: Fuel, color: 'bg-green-100 text-green-600' },
          { label: 'Diesel Vehicles', value: vehicles.filter(v => v.fuel === 'Diesel').length, icon: Fuel, color: 'bg-orange-100 text-orange-600' },
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
            placeholder="Search by owner, plate, brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-sm pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-400 w-full sm:w-72"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-sm transition-colors cursor-pointer"
        >
          <Plus size={16} /> Register Vehicle
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID', 'Owner', 'Vehicle', 'Plate', 'Fuel', 'Color', 'Services', 'Total Spent', 'Action'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No vehicles found.</td></tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-blue-600">{v.id}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800">{v.owner}</td>
                  <td className="py-3 px-4 text-gray-700">{v.brand} {v.model} <span className="text-gray-400 text-xs">({v.year})</span></td>
                  <td className="py-3 px-4 text-gray-600">{v.plate}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold ${fuelColors[v.fuel]}`}>{v.fuel}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{v.color}</td>
                  <td className="py-3 px-4 text-center text-gray-700 font-semibold">{v.services}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">₹{v.totalSpent ? v.totalSpent.toLocaleString() : '0'}</td>
                  <td className="py-3 px-4 flex gap-3">
                    <button onClick={() => handleEdit(v)} className="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer" title="Edit Vehicle">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(v._id)} className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer" title="Delete Vehicle">
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">{editingId ? 'Edit Vehicle' : 'Register New Vehicle'}</h2>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Owner (Customer)</label>
                <Select
                  options={customers.map(c => ({ value: c._id, label: `${c.name} (${c.phone})` }))}
                  value={form.owner ? { value: form.owner, label: customers.find(c => c._id === form.owner)?.name } : null}
                  onChange={opt => setForm({ ...form, owner: opt ? opt.value : '' })}
                  placeholder="Type to search customer..."
                  isClearable
                  className="text-sm"
                  styles={{ control: base => ({ ...base, borderColor: '#e5e7eb', borderRadius: '0.125rem' }) }}
                />
              </div>
              {[
                { label: 'Brand', key: 'brand' },
                { label: 'Model', key: 'model' },
                { label: 'Year', key: 'year' },
                { label: 'Number Plate', key: 'plate' },
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
              <div className="flex gap-3 mt-2">
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
