'use client'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Step = 'method' | 'phone-only' | 'manual' | 'pay' | 'active-member'
type BillingInterval = 'monthly' | 'annual'
type MemberStatus = {
  exists: boolean
  active: boolean
  hasPhone: boolean
  name: string
  phone: string
  subscriptionStatus: string | null
}

type ManualField = {
  label: string
  value: string
  setter: (value: string) => void
  type: 'text' | 'tel' | 'email'
  placeholder: string
  complete: string
  mode: 'text' | 'tel' | 'email'
}

type CreatorAffiliate = {
  id: string
  name: string
  handle: string | null
  referralCode: string
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupContent />
    </Suspense>
  )
}

function SignupLoading() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)' }}>
        Loading signup...
      </div>
    </main>
  )
}

function SignupContent() {
  const [step, setStep] = useState<Step>('method')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [hasActiveMembership, setHasActiveMembership] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly')
  const [creatorAffiliate, setCreatorAffiliate] = useState<CreatorAffiliate | null>(null)
  const [creatorChecked, setCreatorChecked] = useState(false)
  const [creatorError, setCreatorError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const creatorRef = searchParams.get('ref')?.trim().toLowerCase() || ''

  async function getMemberStatus(nextEmail: string): Promise<MemberStatus> {
    const res = await fetch(`/api/member-status?email=${encodeURIComponent(nextEmail)}`)
    if (!res.ok) {
      throw new Error('Unable to load member status.')
    }
    return res.json()
  }

  async function savePhoneProfile(nextName: string, nextEmail: string, nextPhone: string) {
    const res = await fetch('/api/update-member-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nextName, email: nextEmail, phone: nextPhone }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Unable to save profile.')
    }
    return data
  }

  // Check if returning from Google OAuth with a session
  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user
      if (!user?.email) {
        setAuthChecked(true)
        return
      }

      const googleName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      const googleEmail = user.email

      if (googleName) setName(googleName)
      setEmail(googleEmail)

      try {
        const status = await getMemberStatus(googleEmail)
        const effectiveName = status.name || googleName

        if (effectiveName) setName(effectiveName)
        if (status.phone) setPhone(formatPhone(status.phone))
        setHasActiveMembership(status.active)

        if (status.active) {
          setStep('active-member')
          return
        }

        setStep(status.hasPhone ? 'pay' : 'phone-only')
      } catch {
        setError('We had trouble checking your account. Please try again.')
      } finally {
        setAuthChecked(true)
      }
    }

    init()
  }, [router])

  useEffect(() => {
    async function loadCreatorAffiliate() {
      if (!creatorRef) {
        setCreatorChecked(true)
        return
      }

      try {
        const res = await fetch(`/api/creator-affiliate?ref=${encodeURIComponent(creatorRef)}`)
        const data = await res.json()
        if (!res.ok || !data.valid) {
          setCreatorError('This creator link is not active right now. Monthly access is still available.')
          setBillingInterval('monthly')
          return
        }
        setCreatorAffiliate(data.affiliate)
        setBillingInterval('annual')
      } catch {
        setCreatorError('We had trouble checking this creator link. Monthly access is still available.')
        setBillingInterval('monthly')
      } finally {
        setCreatorChecked(true)
      }
    }

    loadCreatorAffiliate()
  }, [creatorRef])

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
    const redirectPath = creatorRef ? `/signup?ref=${encodeURIComponent(creatorRef)}` : '/signup'
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      }
    })
  }

  async function handleContinueManual() {
    if (!validateManual()) return
    setLoading(true)
    setError('')
    try {
      const status = await getMemberStatus(email)
      setHasActiveMembership(status.active)
      if (status.active) {
        setError('This email already has an active membership. Please log in instead.')
        return
      }
      setStep('pay')
    } catch {
      setError('We had trouble checking your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePhoneOnlyContinue() {
    if (!validatePhone()) return
    if (!email) {
      setError('We could not find your email. Please try again.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await savePhoneProfile(name, email, phone.replace(/\D/g, ''))
      if (hasActiveMembership) {
        router.push('/member/deals')
        return
      }
      setStep('pay')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
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
          billingInterval,
          creatorRef: creatorAffiliate?.referralCode || '',
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

  if (!authChecked || !creatorChecked) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="display pulse" style={{ fontSize: '28px', color: 'var(--green)' }}>Loading...</div>
      </main>
    )
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

          {step !== 'active-member' && (
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
          )}

          {step === 'active-member' && (
            <div className="fade-up">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '4px 12px', borderRadius: '999px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                Membership active
              </div>
              <h1 className="display" style={{ fontSize: 'clamp(44px, 10vw, 64px)', marginBottom: '10px' }}>
                You already have PerkPass All Access.
              </h1>
              <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: '24px' }}>
                This account is already subscribed. If you&apos;d like more details about your plan, billing, or account status, head to your account page.
              </p>

              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '10px', padding: '18px 18px 16px', marginBottom: '18px' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>
                  Current account
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500 }}>Email</span>
                    <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 700, textAlign: 'right' }}>{email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500 }}>Plan</span>
                    <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 700, textAlign: 'right' }}>PerkPass All Access</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link href="/account" className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '15px' }}>
                  Go to account
                </Link>
                <Link href="/member/deals" className="btn btn-outline" style={{ width: '100%', fontSize: '16px', padding: '14px' }}>
                  Back to deals
                </Link>
              </div>
            </div>
          )}

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
                    onKeyDown={e => e.key === 'Enter' && handlePhoneOnlyContinue()}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--ink-4)', marginTop: '6px', fontWeight: 500 }}>
                    One account per phone number.
                  </p>
                </div>

                {error && <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--red)' }}>{error}</p>}

                <button
                  onClick={handlePhoneOnlyContinue}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '18px', padding: '16px' }}
                >
                  {loading ? 'Saving...' : hasActiveMembership ? 'Save and continue' : 'Continue to payment'}
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
                {([
                  { label: 'Full name', value: name, setter: setName, type: 'text', placeholder: 'Jane Smith', complete: 'name', mode: 'text' },
                  { label: 'Phone number', value: phone, setter: (v: string) => setPhone(formatPhone(v)), type: 'tel', placeholder: '(215) 555-0100', complete: 'tel', mode: 'tel' },
                  { label: 'Email address', value: email, setter: setEmail, type: 'email', placeholder: 'you@email.com', complete: 'email', mode: 'email' },
                ] as ManualField[]).map(f => (
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
                      inputMode={f.mode}
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
                  {creatorAffiliate ? 'Creator-exclusive annual access is unlocked.' : 'Monthly access is open to everyone.'}
                </p>
              </div>

              {creatorAffiliate && (
                <div className="fade-up-2" style={{ background: 'var(--green-lt)', border: '1px solid rgba(95,160,97,0.25)', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-dk)', marginBottom: '4px' }}>
                    Creator link active
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-3)', lineHeight: 1.45 }}>
                    Annual access is unlocked through {creatorAffiliate.handle || creatorAffiliate.name}. They earn $5 when your annual membership is confirmed.
                  </p>
                </div>
              )}

              {creatorError && (
                <div className="fade-up-2" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-3)', lineHeight: 1.45 }}>{creatorError}</p>
                </div>
              )}

              <div className="fade-up-2" style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                {([
                  {
                    id: 'monthly',
                    label: 'Monthly',
                    price: '$3',
                    suffix: '/mo',
                    note: 'Flexible month-to-month access.',
                  },
                  {
                    id: 'annual',
                    label: 'Annual',
                    price: '$30',
                    suffix: '/yr',
                    note: 'Creator-exclusive yearly access.',
                    badge: 'Creator link',
                  },
                ] as const)
                  .filter((plan) => plan.id === 'monthly' || Boolean(creatorAffiliate))
                  .map((plan) => {
                  const selected = billingInterval === plan.id
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setBillingInterval(plan.id)}
                      style={{
                        width: '100%',
                        background: selected ? 'var(--forest)' : 'var(--bg-2)',
                        border: selected ? '2px solid var(--green)' : '1px solid var(--border-2)',
                        borderRadius: '10px',
                        padding: '18px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        textAlign: 'left',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: selected ? 'var(--green)' : 'var(--ink-4)' }}>
                            {plan.label}
                          </span>
                          {'badge' in plan && (
                            <span style={{ borderRadius: '999px', background: selected ? 'rgba(255,255,255,0.1)' : 'var(--green-lt)', color: selected ? '#ffffff' : 'var(--green-dk)', padding: '3px 8px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: selected ? 'rgba(255,255,255,0.58)' : 'var(--ink-3)' }}>{plan.note}</div>
                      </div>
                      <div className="display" style={{ fontSize: plan.id === 'annual' ? '34px' : '40px', color: selected ? '#ffffff' : 'var(--ink)', whiteSpace: 'nowrap' }}>
                        {plan.price}<span style={{ fontSize: '16px', fontWeight: 400, color: selected ? 'rgba(255,255,255,0.45)' : 'var(--ink-4)' }}>{plan.suffix}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Account summary */}
              <div className="fade-up-3" style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '16px', border: '1px solid var(--border-2)', marginBottom: '16px' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>Account details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { l: 'Name', v: name },
                    { l: 'Phone', v: phone },
                    { l: 'Email', v: email },
                    { l: 'Plan', v: billingInterval === 'annual' ? 'Creator annual · $30/year' : 'Monthly · $3/month' },
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
                {loading
                  ? 'Redirecting to checkout...'
                  : billingInterval === 'annual'
                    ? 'Pay $30/year — Get access'
                    : 'Pay $3/month — Get access'}
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
