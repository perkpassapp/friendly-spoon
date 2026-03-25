'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    if (!email || !email.includes('@')) { setError('Enter a valid email address'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else { setError('Something went wrong. Try again.'); setLoading(false) }
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px',
        borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
        <Link href="/member/login" style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em',
          color: 'var(--ink-3)', textDecoration: 'none',
        }}>
          Already a member
        </Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          <div className="fade-up" style={{ marginBottom: '40px' }}>
            <h1 className="display" style={{ fontSize: 'clamp(52px, 12vw, 72px)', marginBottom: '8px' }}>
              Get PerkPass.
            </h1>
            <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)' }}>
              Every Philly deal, one low price.
            </p>
          </div>

          {/* Pricing card */}
          <div className="fade-up-2" style={{
            background: 'var(--forest)', borderRadius: '10px',
            padding: '28px', marginBottom: '24px',
            border: '2px solid var(--green)',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
              <span className="display" style={{ fontSize: '64px', color: '#ffffff' }}>$3</span>
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>/month</span>
              <span style={{
                marginLeft: 'auto',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '12px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                background: 'var(--green)', color: '#ffffff',
                padding: '4px 10px', borderRadius: '4px',
              }}>
                All Access
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Unlimited deal redemptions',
                'All categories — food, fitness, beauty',
                'Instant codes at checkout',
                'New Philly deals every week',
                'Cancel anytime, no questions',
              ].map(f => (
                <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px' }}>+</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="fade-up-3">
            <label style={{
              display: 'block', marginBottom: '6px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '13px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--ink-3)',
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="pp-input"
              style={{ marginBottom: '10px' }}
              onKeyDown={e => e.key === 'Enter' && handleCheckout()}
            />
            {error && (
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '10px' }}>{error}</p>
            )}
            <button
              onClick={handleCheckout}
              disabled={loading || !email}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '18px', padding: '16px', marginBottom: '12px' }}
            >
              {loading ? 'Redirecting...' : 'Continue to payment'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500 }}>
              Secured by Stripe · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}