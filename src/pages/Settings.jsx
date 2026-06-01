import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'

export default function Settings() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', role: 'Admin' })
  const [business, setBusiness] = useState({ shopName: '', address: '', gst: '', city: '', state: '' })
  const [notifications, setNotifications] = useState({ emailAlerts: true, smsAlerts: false, paymentReminders: true, weeklyReport: true })
  const [credentials, setCredentials] = useState({ newEmail: '', newPassword: '' })
  const [saved, setSaved] = useState(false)
  const [securityMessage, setSecurityMessage] = useState('')

  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const u = JSON.parse(userStr)
      setProfile(p => ({ ...p, name: u.name || 'Admin User', email: u.email || '' }))
      setAvatar(u.avatar || '')
    }
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return Swal.fire('Error', 'Image must be less than 2MB', 'error')
      }
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('http://localhost:5000/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: profile.name, avatar: avatar })
      })
      const data = await res.json()
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        window.dispatchEvent(new Event("userUpdated"));
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        Swal.fire('Error', data.message, 'error')
      }
    } catch (err) {
      Swal.fire('Error', 'Network error', 'error')
    }
  }

  async function handleUpdateCredentials(e) {
    e.preventDefault()
    setSecurityMessage('')
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const res = await fetch('http://localhost:5000/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: credentials.newEmail, newPassword: credentials.newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        Swal.fire({ title: 'Success', text: 'Credentials updated successfully. Please login again with your new credentials.', icon: 'success' }).then(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/'
        })
      } else {
        setSecurityMessage(data.message || 'Error updating credentials')
      }
    } catch (err) {
      setSecurityMessage('Network error')
    }
  }

  return (
    <div className="p-4 md:p-5 flex flex-col gap-4 max-w-2xl mx-auto w-full">

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-3 rounded-sm">
          ✅ Settings saved successfully!
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-white rounded-sm p-4 border border-gray-200 ">
        <h2 className="text-base font-bold text-gray-800 mb-4">👤 Profile Settings</h2>
        
        {/* Avatar Upload */}
        <div className="mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
            {avatar ? <img src={avatar} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-gray-400 text-xs">No img</span>}
          </div>
          <div>
            <label className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-sm text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors">
              Change Photo
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'Phone', key: 'phone' },
            { label: 'Role', key: 'role' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
              <input
                value={profile[f.key]}
                onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Business Settings */}
      <div className="bg-white rounded-sm p-4 border border-gray-200 ">
        <h2 className="text-base font-bold text-gray-800 mb-4">🏪 Business Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Shop Name', key: 'shopName' },
            { label: 'GST Number', key: 'gst' },
            { label: 'City', key: 'city' },
            { label: 'State', key: 'state' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
              <input
                value={business[f.key]}
                onChange={e => setBusiness({ ...business, [f.key]: e.target.value })}
                className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Address</label>
            <input
              value={business.address}
              onChange={e => setBusiness({ ...business, address: e.target.value })}
              className="w-full border border-gray-200 rounded-sm px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-sm p-4 border border-gray-200 ">
        <h2 className="text-base font-bold text-gray-800 mb-4">🔔 Notification Settings</h2>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Email Alerts', sub: 'Receive billing alerts via email', key: 'emailAlerts' },
            { label: 'SMS Alerts', sub: 'Receive billing alerts via SMS', key: 'smsAlerts' },
            { label: 'Payment Reminders', sub: 'Auto reminders for pending payments', key: 'paymentReminders' },
            { label: 'Weekly Report', sub: 'Get weekly business summary', key: 'weeklyReport' },
          ].map(n => (
            <div key={n.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <div className="text-sm font-semibold text-gray-700">{n.label}</div>
                <div className="text-xs text-gray-400">{n.sub}</div>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, [n.key]: !notifications[n.key] })}
                className={`w-11 h-6 rounded transition-colors cursor-pointer relative ${notifications[n.key] ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded shadow transition-all ${notifications[n.key] ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-sm transition-colors cursor-pointer w-fit"
      >
        Save Settings
      </button>

      {/* Security Settings */}
      <div className="bg-red-50 rounded-sm p-4 border border-red-100 mt-8">
        <h2 className="text-base font-bold text-red-800 mb-2">🔒 Security Settings (Login Credentials)</h2>
        <p className="text-xs text-red-600 mb-4">Change your login email or password. You will be logged out upon success.</p>
        
        {securityMessage && <div className="mb-4 text-sm font-bold text-red-600">{securityMessage}</div>}
        
        <form onSubmit={handleUpdateCredentials} className="flex flex-col gap-4 max-w-sm">
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">New Email (Optional)</label>
            <input
              type="email"
              placeholder="Leave blank to keep current"
              value={credentials.newEmail}
              onChange={e => setCredentials({ ...credentials, newEmail: e.target.value })}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-red-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1 block">New Password (Optional)</label>
            <input
              type="password"
              placeholder="Leave blank to keep current"
              value={credentials.newPassword}
              onChange={e => setCredentials({ ...credentials, newPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm outline-none focus:border-red-400"
            />
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-sm transition-colors cursor-pointer w-fit"
          >
            Update Credentials
          </button>
        </form>
      </div>
    </div>
  )
}
