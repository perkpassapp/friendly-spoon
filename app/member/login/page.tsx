'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MemberLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  // If already logged in — go straight to deals
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.push('/member/deals')
      else setChecking(false)
    })
  }, [router])

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/member/deals`,
        shouldCreateUser: false,
      }
    })
    if (!error) setSent(true)
    setLoading(false)
  }

  if (checking) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="display pulse" style={{ fontSize: '24px', color: 'var(--green)' }}>Checking your account...</div>
    </main>
  )

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
        }}>
          Get PerkPass
        </Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {sent ? (
            <div className="fade-up">
              <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '16px' }}>
                Check your texts.
              </h1>
              <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px', lineHeight: 1.55 }}>
                We sent a login link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. Tap it — you'll land straight on your deals.
              </p>
              <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '8px' }}>
                  Pro tip
                </div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  After tapping the link once, you'll stay logged in for 7 days automatically. No login needed every time you open the app.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                style={{ background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-4)', cursor: 'pointer', padding: 0 }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div>
              <div className="fade-up" style={{ marginBottom: '32px' }}>
                <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '8px' }}>
                  Welcome back.
                </h1>
                <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)' }}>
                  Enter your email to get a login link.
                </p>
              </div>

              <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    inputMode="email"
                    onKeyDown={e => e.key === 'Enter' && email && handleLogin()}
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading || !email}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '18px', padding: '16px' }}
                >
                  {loading ? 'Sending...' : 'Send login link'}
                </button>

                {/* How it works */}
                <div style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '14px 16px', border: '1px solid var(--border-2)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      'We email you a secure link — no password',
                      'Tap it once — you\'re in instantly',
                      'Stays logged in for 7 days automatically',
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: 'var(--green)', fontSize: '14px', flexShrink: 0 }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="fade-up-3" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-2)' }}>
                <p style={{ fontSize: '14px', color: 'var(--ink-3)', fontWeight: 500 }}>
                  Not a member?{' '}
                  <Link href="/signup" style={{ color: 'var(--green-dk)', fontWeight: 700, textDecoration: 'none' }}>
                    Get PerkPass for $3/month
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}