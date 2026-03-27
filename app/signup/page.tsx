'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [step, setStep] = useState<'info' | 'pay'>('info')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  }

  function validateInfo() {
    if (!name.trim()) { setError('Please enter your name'); return false }
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) { setError('Please enter a valid 10-digit phone number'); return false }
    if (!email || !email.includes('@')) { setError('Please enter a valid email address'); return false }
    setError('')
    return true
  }

  async function handleCheckout() {
    if (!validateInfo()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          phone: phone.replace(/\D/g, ''),
        })
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
        padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)',
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

          {/* Progress */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
            {['Your info', 'Payment'].map((s, i) => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{
                  height: '3px', borderRadius: '2px', marginBottom: '6px',
                  background: i === 0 || step === 'pay' ? 'var(--ink)' : 'var(--bg-3)',
                  transition: 'background 0.2s',
                }} />
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: i === 0 || step === 'pay' ? 'var(--ink-3)' : 'var(--ink-4)',
                }}>
                  {s}
                </div>
              </div>
            ))}
          </div>

          <div className="fade-up" style={{ marginBottom: '32px' }}>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 10vw, 64px)', marginBottom: '8px' }}>
              {step === 'info' ? 'Create account.' : 'Get PerkPass.'}
            </h1>
            <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)' }}>
              {step === 'info'
                ? 'Takes 30 seconds. No password ever.'
                : 'Every Philly deal for $3/month.'}
            </p>
          </div>

          {/* Pricing card — show on pay step */}
          {step === 'pay' && (
            <div className="fade-up" style={{
              background: 'var(--forest)', borderRadius: '10px',
              padding: '20px 24px', marginBottom: '24px',
              border: '2px solid var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green)', marginBottom: '4px' }}>All Access</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Unlimited deals · Cancel anytime</div>
              </div>
              <div className="display" style={{ fontSize: '40px', color: '#ffffff' }}>$3<span style={{ fontSize: '16px', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/mo</span></div>
            </div>
          )}

          <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {step === 'info' && (
              <>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Smith"
                    className="pp-input"
                    autoComplete="name"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    placeholder="(215) 555-0100"
                    className="pp-input"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                  <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>
                    Used to verify your account. One account per phone number.
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="pp-input"
                    autoComplete="email"
                    onKeyDown={e => e.key === 'Enter' && validateInfo() && setStep('pay')}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>
                    We send your login link here. Check it once — then you're always logged in.
                  </p>
                </div>

                {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>{error}</p>}

                <button
                  onClick={() => validateInfo() && setStep('pay')}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '18px', padding: '16px' }}
                >
                  Continue
                </button>
              </>
            )}

            {step === 'pay' && (
              <>
                {/* Summary */}
                <div style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-2)' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>Account details</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[{ l: 'Name', v: name }, { l: 'Phone', v: phone }, { l: 'Email', v: email }].map(f => (
                      <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500 }}>{f.l}</span>
                        <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 700 }}>{f.v}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep('info')}
                    style={{ marginTop: '10px', background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', cursor: 'pointer', padding: 0 }}
                  >
                    Edit
                  </button>
                </div>

                {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>{error}</p>}

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '18px', padding: '16px' }}
                >
                  {loading ? 'Redirecting to checkout...' : 'Pay $3/month — Get access'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500 }}>
                  Secured by Stripe · Cancel anytime
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}