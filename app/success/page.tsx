'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const email = params.get('email') || ''
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!email) return
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/member/deals` }
    }).then(({ error }) => {
      if (error) setError('Could not send login link. Please try logging in manually.')
      else setSent(true)
    })
  }, [email])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          <div className="fade-up" style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'var(--green)', marginBottom: '20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 72px)', marginBottom: '8px' }}>
              You&apos;re in.
            </h1>
            <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55 }}>
              Welcome to PerkPass. Your subscription is active.
            </p>
          </div>

          {error ? (
            <div className="fade-up-2" style={{
              background: 'var(--bg-2)', border: '2px solid var(--border-2)',
              borderRadius: '8px', padding: '20px', marginBottom: '16px',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--red)', marginBottom: '12px' }}>{error}</p>
              <Link href="/member/login" className="btn btn-primary" style={{ display: 'flex', width: '100%', fontSize: '17px', padding: '14px' }}>
                Go to login
              </Link>
            </div>
          ) : sent ? (
            <div className="fade-up-2">
              <div style={{
                background: 'var(--forest)', border: '2px solid var(--green)',
                borderRadius: '10px', padding: '24px', marginBottom: '16px',
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '13px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--green)', marginBottom: '8px',
                }}>
                  Check your email
                </div>
                <p style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55, marginBottom: '0' }}>
                  We sent a login link to <strong style={{ color: '#fff' }}>{email}</strong>. Click it to access your deals.
                </p>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500, textAlign: 'center' }}>
                Already have the tab open?{' '}
                <Link href="/member/login" style={{ color: 'var(--green-dk)', fontWeight: 700, textDecoration: 'none' }}>
                  Log in manually
                </Link>
              </p>
            </div>
          ) : (
            <div className="fade-up-2" style={{
              background: 'var(--bg-2)', borderRadius: '8px', padding: '20px',
              border: '1px solid var(--border)',
            }}>
              <div className="display pulse" style={{ fontSize: '16px', color: 'var(--green)' }}>
                Sending your login link...
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
