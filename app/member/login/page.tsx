'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px',
        borderBottom: '2px solid var(--ink)',
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
              <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 72px)', marginBottom: '16px' }}>
                Check your email.
              </h1>
              <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px', lineHeight: 1.55 }}>
                We sent a magic link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. Click it to access your deals.
              </p>
              <div style={{
                background: 'var(--bg-2)', border: '2px solid var(--border-2)',
                borderRadius: '8px', padding: '16px',
                fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)',
              }}>
                No password needed — ever. Just click the link in your email.
              </div>
            </div>
          ) : (
            <div>
              <div className="fade-up" style={{ marginBottom: '40px' }}>
                <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 72px)', marginBottom: '8px' }}>
                  Welcome back.
                </h1>
                <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)' }}>
                  Enter your email to log in.
                </p>
              </div>

              <div className="fade-up-2">
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
                  style={{ marginBottom: '12px' }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <button
                  onClick={handleLogin}
                  disabled={loading || !email}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '18px', padding: '16px', marginBottom: '12px' }}
                >
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500 }}>
                  No password needed. We email you a secure login link.
                </p>
              </div>

              <div className="fade-up-3" style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border-2)' }}>
                <p style={{ fontSize: '14px', color: 'var(--ink-3)', fontWeight: 500 }}>
                  Not a member yet?{' '}
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