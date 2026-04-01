'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Step = 'method' | 'phone-only' | 'manual' | 'pay'

export default function SignupPage() {
  const [step, setStep] = useState<Step>('method')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if returning from Google OAuth with a session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const user = data.session.user
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name || ''
        const googleEmail = user.email || ''
        if (googleName) setName(googleName)
        if (googleEmail) setEmail(googleEmail)
        // They came from Google — just need phone
        setStep('phone-only')
      }
    })
  }, [])

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  function validatePhone() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) { setError('Please enter a valid 10-digit phone number'); return false }
    setError(''); return true
  }

  function validateManual() {
    if (!name.trim()) { setError('Please enter your name'); return false }
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) { setError('Please enter a valid 10-digit phone number'); return false }
    if (!email || !email.includes('@')) { setError('Please enter a valid email'); return false }
    setError(''); return true
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/signup`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      }
    })
  }

  async function handleContinueManual() {
    if (!validateManual()) return
    setLoading(true)
    const res = await fetch(`/api/check-email?email=${encodeURIComponent(email)}`)
    const { exists } = await res.json()
    setLoading(false)
    if (exists) {
      setError('An account with this email already exists. Please log in instead.')
      return
    }
    setStep('pay')
  }

  async function handleCheckout() {
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
      else if (res.status === 409) { setError(data.error); setLoading(false) }
      else { setError('Something went wrong. Try again.'); setLoading(false) }
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const STEPS = ['Your info', 'Payment']
  const stepIndex = step === 'method' ? 0 : step === 'phone-only' ? 0 : step === 'manual' ? 0 : 1

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

          {/* Progress bar */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{
                  height: '3px', borderRadius: '2px', marginBottom: '6px',
                  background: i <= stepIndex ? 'var(--ink)' : 'var(--bg-3)',
                  transition: 'background 0.2s',
                }} />
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: i <= stepIndex ? 'var(--ink-3)' : 'var(--ink-4)',
                }}>{s}</div>
              </div>
            ))}
          </div>

          {/* ── STEP: METHOD ── */}
          {step === 'method' && (
            <div>
              <div className="fade-up" style={{ marginBottom: '32px' }}>
                <h1 className="display" style={{ fontSize: 'clamp(44px, 10vw, 64px)', marginBottom: '8px' }}>
                  Create account.
                </h1>
                <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)' }}>
                  Takes 30 seconds. No password ever.
                </p>
              </div>

              <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  style={{
                    width: '100%', padding: '16px',
                    background: 'var(--bg-2)', border: '2px solid var(--border-2)',
                    borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '17px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.03em',
                    color: 'var(--ink)', transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.background = 'var(--bg-2)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-2)' }} />
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-2)' }} />
                </div>

                {/* Manual */}
                <button
                  onClick={() => setStep('manual')}
                  style={{
                    width: '100%', padding: '15px',
                    background: 'transparent', border: '1px solid var(--border-2)',
                    borderRadius: '8px', cursor: 'pointer',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '16px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.03em',
                    color: 'var(--ink-3)', transition: 'color 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}
                >
                  Sign up with email
                </button>

                <div style={{ paddingTop: '8px', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: 'var(--ink-3)', fontWeight: 500 }}>
                    Already a member?{' '}
                    <Link href="/member/login" style={{ color: 'var(--green-dk)', fontWeight: 700, textDecoration: 'none' }}>
                      Log in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: PHONE ONLY (after Google) ── */}
          {step === 'phone-only' && (
            <div>
              <div className="fade-up" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '4px 12px', borderRadius: '4px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                  Google connected
                </div>
                <h1 className="display" style={{ fontSize: 'clamp(44px, 10vw, 64px)', marginBottom: '8px' }}>
                  One more thing.
                </h1>
                <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  We use your phone number to keep your account secure — one account per person.
                </p>
              </div>

              {/* Show what Google gave us */}
              <div style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '14px 16px', border: '1px solid var(--border-2)', marginBottom: '20px' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '8px' }}>
                  From Google
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[{ l: 'Name', v: name }, { l: 'Email', v: email }].map(f => (
                    <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500 }}>{f.l}</span>
                      <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 700 }}>{f.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    autoFocus
                    inputMode="tel"
                    autoComplete="tel"
                    onKeyDown={e => e.key === 'Enter' && validatePhone() && setStep('pay')}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>
                    One account per phone number.
                  </p>
                </div>

                {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>{error}</p>}

                <button
                  onClick={() => validatePhone() && setStep('pay')}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '18px', padding: '16px' }}
                >
                  Continue to payment
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: MANUAL ── */}
          {step === 'manual' && (
            <div>
              <div className="fade-up" style={{ marginBottom: '28px' }}>
                <h1 className="display" style={{ fontSize: 'clamp(44px, 10vw, 64px)', marginBottom: '8px' }}>
                  Create account.
                </h1>
                <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)' }}>
                  Takes 30 seconds.
                </p>
              </div>

              <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Full name', value: name, setter: setName, type: 'text', placeholder: 'Jane Smith', complete: 'name', mode: 'text' },
                  { label: 'Phone number', value: phone, setter: (v: string) => setPhone(formatPhone(v)), type: 'tel', placeholder: '(215) 555-0100', complete: 'tel', mode: 'tel' },
                  { label: 'Email address', value: email, setter: setEmail, type: 'email', placeholder: 'you@email.com', complete: 'email', mode: 'email' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', marginBottom: '6px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={f.value}
                      onChange={e => f.setter(e.target.value)}
                      placeholder={f.placeholder}
                      className="pp-input"
                      autoComplete={f.complete}
                      inputMode={f.mode as any}
                    />
                    {f.label === 'Phone number' && (
                      <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>One account per phone number.</p>
                    )}
                    {f.label === 'Email address' && (
                      <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>We send your login link here. Tap once — stay logged in 7 days.</p>
                    )}
                  </div>
                ))}

                {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>{error}</p>}

                <button
                  onClick={handleContinueManual}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '18px', padding: '16px' }}
                >
                  {loading ? 'Checking...' : 'Continue'}
                </button>

                <button
                  onClick={() => setStep('method')}
                  style={{ background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', cursor: 'pointer', padding: '4px' }}
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: PAY ── */}
          {step === 'pay' && (
            <div>
              <div className="fade-up" style={{ marginBottom: '24px' }}>
                <h1 className="display" style={{ fontSize: 'clamp(44px, 10vw, 64px)', marginBottom: '8px' }}>
                  Almost there.
                </h1>
                <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)' }}>
                  One tap to unlock every Philly deal.
                </p>
              </div>

              {/* Pricing card */}
              <div className="fade-up-2" style={{ background: 'var(--forest)', borderRadius: '10px', padding: '20px 24px', marginBottom: '20px', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green)', marginBottom: '4px' }}>All Access</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>Unlimited deals · Cancel anytime</div>
                </div>
                <div className="display" style={{ fontSize: '40px', color: '#ffffff' }}>
                  $3<span style={{ fontSize: '16px', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                </div>
              </div>

              {/* Account summary */}
              <div className="fade-up-3" style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-2)', marginBottom: '16px' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>Account details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { l: 'Name', v: name },
                    { l: 'Phone', v: phone },
                    { l: 'Email', v: email },
                  ].filter(f => f.v).map(f => (
                    <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500 }}>{f.l}</span>
                      <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 700 }}>{f.v}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep(name && !phone ? 'phone-only' : 'manual')}
                  style={{ marginTop: '10px', background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', cursor: 'pointer', padding: 0 }}
                >
                  Edit
                </button>
              </div>

              {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)', marginBottom: '12px' }}>{error}</p>}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '18px', padding: '16px', marginBottom: '10px' }}
              >
                {loading ? 'Redirecting to checkout...' : 'Pay $3/month — Get access'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500 }}>
                Secured by Stripe · Cancel anytime
              </p>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}