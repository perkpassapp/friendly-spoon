'use client'
import { useState } from 'react'

const STATS = [
  { label: 'Total Members', value: '0', icon: '👥' },
  { label: 'Active Deals', value: '5', icon: '🎟️' },
  { label: 'Redemptions', value: '0', icon: '✅' },
  { label: 'Monthly Revenue', value: '$0', icon: '💰' },
]

const DEALS = [
  { biz: 'Fishtown Coffee Co.', deal: '20% off any drink', cat: 'Cafe', active: true },
  { biz: 'The Craft Barber', deal: '$10 off first haircut', cat: 'Barber', active: true },
  { biz: 'Iron Body Gym', deal: 'Free 1-week trial', cat: 'Fitness', active: true },
  { biz: 'Bliss Nail Studio', deal: '30% off mani-pedi', cat: 'Nails', active: true },
  { biz: 'Compadre Taqueria', deal: 'Buy 1 get 1 free', cat: 'Restaurant', active: true },
]

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')

  function login() {
    if (password === 'perkpassadmin') setAuthed(true)
    else setError('Wrong password')
  }

  if (!authed) return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white">
            Perk<span className="text-amber-400">Pass</span>
          </h1>
          <p className="text-gray-400 mt-2">Admin access</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Admin password"
          className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-4 mb-4 focus:outline-none focus:border-amber-400"
          onKeyDown={e => e.key === 'Enter' && login()}
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button onClick={login} className="w-full bg-amber-400 text-black font-bold py-4 rounded-xl text-lg">
          Enter Dashboard
        </button>
        <p className="text-gray-700 text-xs text-center mt-4">Default password: perkpassadmin</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-black pb-20">
      <div className="bg-gray-950 border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-white">
          Perk<span className="text-amber-400">Pass</span>
          <span className="text-gray-500 font-normal text-sm ml-2">Admin</span>
        </h1>
        <button onClick={() => setAuthed(false)} className="text-gray-600 text-sm">Sign out</button>
      </div>

      <div className="px-4 pt-6">
        {/* Stats */}
        <h2 className="text-white font-bold text-lg mb-3">Overview</h2>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {STATS.map(s => (
            <div key={s.label} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Deals */}
        <h2 className="text-white font-bold text-lg mb-3">Active Deals</h2>
        <div className="space-y-3 mb-8">
          {DEALS.map((d, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm">{d.biz}</p>
                <p className="text-amber-400 text-sm">{d.deal}</p>
                <p className="text-gray-600 text-xs mt-0.5">{d.cat}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-green-400 text-xs">Live</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <h2 className="text-white font-bold text-lg mb-3">Quick Actions</h2>
        <div className="space-y-3">
          <button className="w-full bg-gray-900 border border-gray-700 text-white font-bold py-4 rounded-xl text-left px-4 hover:border-amber-400 transition-all">
            ➕ Add New Deal
          </button>
          <button className="w-full bg-gray-900 border border-gray-700 text-white font-bold py-4 rounded-xl text-left px-4 hover:border-amber-400 transition-all">
            👥 View All Members
          </button>
          <button className="w-full bg-gray-900 border border-gray-700 text-white font-bold py-4 rounded-xl text-left px-4 hover:border-amber-400 transition-all">
            📊 Export Redemptions
          </button>
        </div>
      </div>
    </main>
  )
}