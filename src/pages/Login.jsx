import { useState } from 'react'
import { Car, Lock, Mail } from 'lucide-react'
import bgCar from '../assets/bg-car.png'

export default function Login({ setAuth }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message || 'Something went wrong')
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setAuth(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bgCar})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-0"></div>

      <div className="relative z-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-10 w-full max-w-md shadow-2xl">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Car size={34} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">AutoBill</h1>
          <p className="text-sm text-gray-300 font-medium">Sign in to your dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/20 backdrop-blur-md text-red-200 text-sm p-3 rounded-lg mb-5 font-semibold border border-red-500/30 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-xs font-bold text-gray-300 mb-1.5 block uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="email"
                placeholder="admin@autobill.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-300 mb-1.5 block uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                required
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-lg mt-3 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Secure Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
