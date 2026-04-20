'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MemberLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [noAccount, setNoAccount] = useState(false)
  const router = useRouter()

  // Silently redirect if already logged in — no loading screen
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/member/deals')
    })
  }, [router])

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/member/deals`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      }
    })
  }

  async function handleMagicLink() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/member/deals`,
        shouldCreateUser: false,
      }
    })
    if (!error) {
      setSent(true)
    } else if (error.status === 422) {
      setNoAccount(true)
    }
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
        <Link href="/signup" style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em',
          color: 'var(--green-dk)', textDecoration: 'none',
        }}>Get PerkPass</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {noAccount ? (
            <div className="fade-up">
              <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '16px' }}>No account found.</h1>
              <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--ink)' }}>{email}</strong> isn&apos;t associated with a PerkPass account.
              </p>
              <Link href="/signup" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', fontSize: '17px', padding: '15px', marginBottom: '16px' }}>
                Create an account
              </Link>
              <button
                onClick={() => { setNoAccount(false); setEmail('') }}
                style={{ background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', cursor: 'pointer', padding: 0 }}
              >
                Try a different email
              </button>
            </div>
          ) : sent ? (
            <div className="fade-up">
              <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '16px' }}>Check your email.</h1>
              <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px', lineHeight: 1.55 }}>
                We sent a login link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. Tap it — you&apos;ll land straight on your deals.
              </p>
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  After tapping the link once, you&apos;ll stay logged in for 7 days automatically.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setShowEmail(false); setEmail('') }}
                style={{ background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', cursor: 'pointer', padding: 0 }}
              >
                Try a different method
              </button>
            </div>
          ) : (
            <div>
              <div className="fade-up" style={{ marginBottom: '32px' }}>
                <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '8px' }}>Welcome back.</h1>
                <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)' }}>Log in to access your deals.</p>
              </div>

              <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  style={{
                    width: '100%', padding: '16px',
                    background: 'var(--bg-2)', border: '2px solid var(--border-2)',
                    borderRadius: '8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                    fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)',
                    transition: 'all 0.12s',
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-2)' }} />
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-2)' }} />
                </div>

                {!showEmail ? (
                  <button
                    onClick={() => setShowEmail(true)}
                    style={{
                      width: '100%', padding: '15px', background: 'transparent',
                      border: '1px solid var(--border-2)', borderRadius: '8px', cursor: 'pointer',
                      fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink-3)',
                      transition: 'color 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-3)'}
                  >
                    Continue with email
                  </button>
                ) : (
                  <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                      type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="pp-input" autoFocus
                      autoComplete="email" inputMode="email"
                      onKeyDown={e => e.key === 'Enter' && email && handleMagicLink()}
                    />
                    <button
                      onClick={handleMagicLink}
                      disabled={loading || !email}
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '17px', padding: '15px' }}
                    >
                      {loading ? 'Sending...' : 'Send login link'}
                    </button>
                  </div>
                )}

                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-2)', textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', color: 'var(--ink-3)', fontWeight: 500 }}>
                    Not a member?{' '}
                    <Link href="/signup" style={{ color: 'var(--green-dk)', fontWeight: 700, textDecoration: 'none' }}>
                      Get PerkPass — from $3/month
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
