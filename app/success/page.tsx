'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()
  const email = params.get('email') || ''
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    async function sendMagicLink() {
      if (!email) { router.push('/'); return }
      const { data: existing } = await supabase.auth.getUser()
      if (existing.user) { router.push('/member/deals'); return }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/member/deals`, shouldCreateUser: true }
      })
      setStatus(error ? 'error' : 'done')
    }
    sendMagicLink()
  }, [email, router])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/member/deals" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          {status === 'loading' && (
            <div className="display pulse" style={{ fontSize: '32px', color: 'var(--green)' }}>
              Setting up your account...
            </div>
          )}

          {status === 'done' && (
            <div className="fade-up">
              <div style={{
                display: 'inline-block',
                background: 'var(--green-lt)', color: 'var(--green-dk)',
                padding: '4px 12px', borderRadius: '4px',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '13px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginBottom: '20px',
              }}>
                Payment confirmed
              </div>

              <h1 className="display" style={{ fontSize: 'clamp(52px, 12vw, 80px)', marginBottom: '16px' }}>
                You're in.
              </h1>

              <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px', lineHeight: 1.55 }}>
                Welcome to PerkPass. Your membership is active.
              </p>

              {/* Email instruction */}
              <div style={{
                background: 'var(--forest)', borderRadius: '10px',
                padding: '24px', marginBottom: '24px',
                border: '2px solid var(--green)',
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '13px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--green)', marginBottom: '8px',
                }}>
                  One step to get started
                </div>
                <p style={{ fontSize: '15px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
                  We sent a magic link to{' '}
                  <strong style={{ color: '#ffffff' }}>{email}</strong>.
                  {' '}Tap it — you'll land straight on your deals. No password ever.
                </p>
              </div>

              {/* What's included */}
              <div style={{
                background: 'var(--bg-2)', borderRadius: '10px',
                padding: '20px', marginBottom: '28px',
                border: '1px solid var(--border-2)',
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '13px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: 'var(--ink-3)', marginBottom: '12px',
                }}>
                  Your membership includes
                </div>
                {[
                  'Restaurants & cafes across Philly',
                  'Barbers, nail salons & fitness',
                  '2-minute redemption codes',
                  'New deals added every week',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <span style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700, color: 'var(--green)',
                      fontSize: '15px', flexShrink: 0,
                    }}>+</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-2)' }}>{item}</span>
                  </div>
                ))}
              </div>

              <Link href="/member/login" className="btn btn-primary" style={{ width: '100%', fontSize: '18px', padding: '16px', marginBottom: '12px', display: 'flex' }}>
                Go to my deals
              </Link>
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500 }}>
                Can't find the email? Check spam or{' '}
                <Link href="/member/login" style={{ color: 'var(--green-dk)', fontWeight: 700, textDecoration: 'none' }}>
                  request a new link
                </Link>
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="fade-up">
              <h1 className="display" style={{ fontSize: 'clamp(48px, 12vw, 72px)', marginBottom: '16px' }}>
                Payment done.
              </h1>
              <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>
                Your payment went through but we had trouble sending your login link. Use the button below.
              </p>
              <Link href="/member/login" className="btn btn-primary" style={{ width: '100%', fontSize: '18px', padding: '16px', display: 'flex' }}>
                Log in to my account
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="display pulse" style={{ fontSize: '28px', color: 'var(--green)' }}>Loading...</div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  )
}