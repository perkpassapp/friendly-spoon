'use client'
import { useState } from 'react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-white tracking-tight">
            Perk<span className="text-amber-400">Pass</span>
          </h1>
          <p className="text-gray-400 mt-2">Philadelphia&apos;s local deal membership</p>
        </div>

        {/* Pricing card */}
        <div className="bg-gray-900 rounded-3xl p-6 border border-amber-400 mb-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-xs font-black px-4 py-1 rounded-full">
            ALL ACCESS
          </div>
          <div className="text-center mb-6 mt-2">
            <div className="flex items-end justify-center gap-1">
              <span className="text-6xl font-black text-white">$3</span>
              <span className="text-gray-400 mb-2">/month</span>
            </div>
            <p className="text-gray-400 text-sm">Cancel anytime</p>
          </div>

          <div className="space-y-3 mb-6">
            {[
              '✓ Unlimited deal redemptions',
              '✓ Restaurants, cafes & barbers',
              '✓ Fitness & nail salons',
              '✓ New deals added weekly',
              '✓ Works on any phone',
              '✓ Cancel anytime',
            ].map(f => (
              <p key={f} className="text-gray-300 text-sm">{f}</p>
            ))}
          </div>
        </div>

        {/* Email input */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-2 block">Your email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full bg-gray-900 text-white border border-gray-700 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-amber-400"
            onKeyDown={e => e.key === 'Enter' && handleCheckout()}
          />
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={handleCheckout}
          disabled={loading || !email}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black py-4 rounded-xl text-xl transition-all active:scale-95 mb-4"
        >
          {loading ? 'Redirecting to checkout...' : 'Get Perk Pass — $3/mo'}
        </button>

        <p className="text-gray-600 text-xs text-center mb-6">
          Secured by Stripe. Cancel anytime from your account.
        </p>

        <div className="text-center">
          <p className="text-gray-500 text-sm">Already a member?{' '}
            <a href="/member/login" className="text-amber-400 hover:underline">Log in</a>
          </p>
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-gray-700 text-sm hover:text-gray-500">← Back</a>
        </div>
      </div>
    </main>
  )
}