'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MemberResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordShell><ResetPasswordLoadingState /></ResetPasswordShell>}>
      <MemberResetPasswordContent />
    </Suspense>
  )
}

function MemberResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const code = useMemo(() => searchParams.get('code'), [searchParams])

  useEffect(() => {
    let active = true

    async function prepareRecovery() {
      setError('')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          if (active) {
            setError('That reset link has expired or is no longer valid. Request a new one to keep going.')
          }
          return
        }
      }

      const { data } = await supabase.auth.getSession()
      if (!active) return

      if (data.session?.user) {
        setReady(true)
        return
      }

      setError('That reset link is no longer active. Request a fresh password reset email and try again.')
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' || session?.user) {
        setReady(true)
        setError('')
      }
    })

    void prepareRecovery()

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [code])

  async function handleSubmit() {
    if (!ready) return

    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.')
      return
    }

    if (password !== confirmPassword) {
      setError('Your passwords do not match yet.')
      return
    }

    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => {
      router.replace('/member/access')
    }, 1200)
  }

  return (
    <ResetPasswordShell>
      <div className="fade-up" style={{ marginBottom: '32px' }}>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '8px' }}>Set a new password.</h1>
        <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          Create a password you can use on both the website and the iPhone app.
        </p>
      </div>

      {success ? (
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '8px', padding: '18px 20px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5 }}>
            Password updated. Taking you back into PerkPass now.
          </p>
        </div>
      ) : (
        <div className="fade-up-2" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className="pp-input"
            autoComplete="new-password"
            disabled={!ready || loading}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            className="pp-input"
            autoComplete="new-password"
            disabled={!ready || loading}
          />

          {error ? (
            <div style={{ background: '#fff1ee', border: '1px solid #f0c5bb', borderRadius: '8px', padding: '14px 16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#7c3f34', lineHeight: 1.5 }}>{error}</p>
            </div>
          ) : null}

          {!ready && !error ? (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '8px', padding: '14px 16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Checking your reset link and preparing a secure session.
              </p>
            </div>
          ) : null}

          <button
            onClick={handleSubmit}
            disabled={!ready || loading || !password || !confirmPassword}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '17px', padding: '15px' }}
          >
            {loading ? 'Saving...' : 'Save new password'}
          </button>

          <Link
            href="/member/login"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--ink-4)',
              textDecoration: 'none',
            }}
          >
            Back to member login
          </Link>
        </div>
      )}
    </ResetPasswordShell>
  )
}

function ResetPasswordShell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/" className="pp-logo"><span className="pp-logo-perk">Perk</span><span className="pp-logo-pass">Pass</span></Link>
        <Link href="/member/login" style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em',
          color: 'var(--green-dk)', textDecoration: 'none',
        }}>Back to login</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {children}
        </div>
      </div>
    </main>
  )
}

function ResetPasswordLoadingState() {
  return (
    <>
      <div className="fade-up" style={{ marginBottom: '32px' }}>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '8px' }}>Set a new password.</h1>
        <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55 }}>
          Creating a secure session for your password reset.
        </p>
      </div>
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '8px', padding: '14px 16px' }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          Loading your reset form now.
        </p>
      </div>
    </>
  )
}
