'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [active, setActive] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/member/login'); return }
      const userEmail = userData.user.email!
      setEmail(userEmail)

      const res = await fetch('/api/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })
      const { active } = await res.json()
      setActive(active)
      setLoading(false)
    }
    init()
  }, [router])

  async function handleManageBilling() {
    setCancelLoading(true)
    try {
      const res = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const { url, error } = await res.json()
      if (url) window.location.href = url
      else alert(error || 'Something went wrong. Please try again.')
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setCancelLoading(false)
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="display pulse" style={{ fontSize: '28px', color: 'var(--green)' }}>Loading...</div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
        <Link href="/member/deals" style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
          fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em',
          color: 'var(--ink-3)', textDecoration: 'none',
        }}>Back to deals</Link>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>

          <h1 className="display fade-up" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '32px' }}>
            Your account.
          </h1>

          {/* Account info */}
          <div className="fade-up-2" style={{
            background: 'var(--bg-2)', borderRadius: '10px',
            padding: '24px', marginBottom: '16px',
            border: '1px solid var(--border-2)',
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--ink-4)', marginBottom: '16px',
            }}>Account details</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-3)' }}>Email</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>{email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-3)' }}>Plan</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>PerkPass All Access</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-3)' }}>Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: active ? 'var(--green)' : 'var(--red)',
                  }} />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: active ? 'var(--green-dk)' : 'var(--red)' }}>
                    {active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing */}
          <div className="fade-up-3" style={{
            background: 'var(--bg-2)', borderRadius: '10px',
            padding: '24px', marginBottom: '24px',
            border: '1px solid var(--border-2)',
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--ink-4)', marginBottom: '12px',
            }}>Billing</div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '16px', lineHeight: 1.5 }}>
              Manage your subscription, update payment method, or cancel through our secure billing portal.
            </p>
            <button
              onClick={handleManageBilling}
              disabled={cancelLoading}
              className="btn btn-outline"
              style={{ width: '100%', fontSize: '16px', padding: '14px' }}
            >
              {cancelLoading ? 'Opening billing portal...' : 'Manage billing'}
            </button>
          </div>

          {/* Sign out */}
          <div className="fade-up-4">
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{
                width: '100%', background: 'none', border: 'none',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '14px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                color: 'var(--ink-4)', cursor: 'pointer', padding: '12px',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}