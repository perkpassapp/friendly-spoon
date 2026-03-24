'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MemberLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/member/deals` }
    })
    if (!error) setSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white">
            Perk<span className="text-amber-400">Pass</span>
          </h1>
          <p className="text-gray-400 mt-2">Member login</p>
        </div>

        {sent ? (
          <div className="bg-green-900 border border-green-500 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="text-white font-bold text-xl mb-2">Check your email!</h2>
            <p className="text-green-300 text-sm">
              We sent a magic link to <strong>{email}</strong>.
              Click it to access your deals.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Your email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-amber-400"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !email}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold py-4 rounded-xl text-lg transition-all active:scale-95"
            >
              {loading ? 'Sending...' : '✉️ Send Magic Link'}
            </button>

            <p className="text-gray-600 text-xs text-center">
              No password needed. We&apos;ll email you a secure login link.
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <a href="/" className="text-gray-600 text-sm hover:text-gray-400">← Back</a>
        </div>
      </div>
    </main>
  )
}
