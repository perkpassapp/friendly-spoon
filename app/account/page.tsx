'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type RedemptionHistory = {
  id: string
  business_name: string
  deal_description: string
  redeemed_at: string
  validated_at: string | null
}

export default function AccountPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [billingLoading, setBillingLoading] = useState(false)
  const [active, setActive] = useState(false)
  const [redemptions, setRedemptions] = useState<RedemptionHistory[]>([])
  const router = useRouter()

  function formatPhone(phoneNumber: string) {
    const digits = phoneNumber.replace(/\D/g, '').slice(0, 10)
    if (digits.length !== 10) return phoneNumber || 'Not added'
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  function formatRedemptionDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/member/login'); return }
      const userEmail = userData.user.email!
      setEmail(userEmail)

      const { data: memberData } = await supabase
        .from('members')
        .select('phone')
        .eq('email', userEmail)
        .maybeSingle()

      if (memberData?.phone) {
        setPhone(memberData.phone)
      }

      const { data: redemptionData } = await supabase
        .from('redemptions')
        .select('id, business_name, deal_description, redeemed_at, validated_at')
        .eq('member_email', userEmail)
        .order('redeemed_at', { ascending: false })
        .limit(10)

      if (redemptionData) {
        setRedemptions(redemptionData as RedemptionHistory[])
      }

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

  async function handleBillingAction() {
    setBillingLoading(true)
    try {
      const endpoint = active ? '/api/cancel-subscription' : '/api/create-checkout'
      const body = active
        ? { email }
        : { email, phone: phone.replace(/\D/g, ''), billingInterval: 'monthly' }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const { url, error } = await res.json()
      if (url) window.location.href = url
      else if (!active) window.location.href = '/signup'
      else alert(error || 'Something went wrong. Please try again.')
    } catch {
      if (!active) window.location.href = '/signup'
      else alert('Something went wrong. Please try again.')
    }
    setBillingLoading(false)
  }

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <span className="pp-logo">Perk<span>Pass</span></span>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ width: '220px', height: '48px', background: 'var(--bg-3)', borderRadius: '6px', marginBottom: '32px' }} />
          {[1,2].map(i => (
            <div key={i} style={{ background: 'var(--bg-2)', borderRadius: '10px', padding: '24px', marginBottom: '16px', border: '1px solid var(--border-2)' }}>
              <div style={{ width: '100px', height: '12px', background: 'var(--bg-3)', borderRadius: '4px', marginBottom: '16px' }} />
              {[1,2,3].map(j => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '60px', height: '13px', background: 'var(--bg-3)', borderRadius: '4px' }} />
                  <div style={{ width: '120px', height: '13px', background: 'var(--bg-3)', borderRadius: '4px' }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/member/deals" className="pp-logo">Perk<span>Pass</span></Link>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-3)' }}>Phone</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>{formatPhone(phone)}</span>
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

          <div className="fade-up-3" style={{
            background: 'var(--bg-2)', borderRadius: '10px',
            padding: '24px', marginBottom: '16px',
            border: '1px solid var(--border-2)',
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--ink-4)', marginBottom: '16px',
            }}>Redemption history</div>

            {redemptions.length === 0 ? (
              <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '16px', border: '1px dashed var(--border-2)' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>No redemptions yet.</div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-4)', lineHeight: 1.5 }}>
                  Once you redeem a deal, your recent activity will show up here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {redemptions.map((redemption) => (
                  <div key={redemption.id} style={{ background: 'var(--bg)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)', marginBottom: '2px' }}>{redemption.business_name}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green-dk)', lineHeight: 1.35 }}>{redemption.deal_description}</div>
                      </div>
                      <span style={{
                        flexShrink: 0,
                        borderRadius: '999px',
                        padding: '4px 8px',
                        background: redemption.validated_at ? '#E8F8EF' : 'var(--bg-3)',
                        color: redemption.validated_at ? 'var(--green-dk)' : 'var(--ink-4)',
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {redemption.validated_at ? 'Confirmed' : 'Code generated'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-4)' }}>
                      {formatRedemptionDate(redemption.redeemed_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="fade-up-3" style={{
            background: 'linear-gradient(135deg, #f7f2e7 0%, #edf4e8 100%)',
            borderRadius: '10px',
            padding: '22px 24px',
            marginBottom: '16px',
            border: '1px solid #decfa2',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: 'rgba(15,15,15,0.08)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--ink)',
              marginBottom: '12px',
            }}>
              Instagram creator offer
            </div>
            <h2 style={{ fontSize: '22px', lineHeight: 1.1, marginBottom: '10px', color: 'var(--ink)' }}>
              Tag us. We will DM your 3-month code.
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '16px', lineHeight: 1.55 }}>
              Have 2,000+ Instagram followers? Share PerkPass in a post or story, tag <strong style={{ color: 'var(--ink)' }}>@GetPerkPass</strong>, and we will review it. If it qualifies, we will DM you a code for 3 months of PerkPass free.
            </p>
            <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
              {[
                'Post or story about PerkPass',
                'Tag @GetPerkPass so we can find it',
                'We DM eligible creators a 3-month code',
              ].map((step, index) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.46)', border: '1px solid rgba(15,15,15,0.08)', borderRadius: '8px', padding: '10px 12px' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--ink)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '12px',
                    fontWeight: 800,
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-3)', lineHeight: 1.35 }}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href="https://www.instagram.com/getperkpass/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '170px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'var(--ink)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '15px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Open Instagram
              </a>
              <Link
                href="/terms"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--ink-3)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Terms apply
              </Link>
            </div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ink-4)', marginTop: '12px', lineHeight: 1.45 }}>
              Tip: keep your profile or story visible long enough for us to review it.
            </p>
          </div>

          {/* Billing */}
          <div className="fade-up-3" style={{
            background: 'var(--bg-2)', borderRadius: '10px',
            padding: '18px 20px', marginBottom: '24px',
            border: '1px solid var(--border-2)',
          }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: 'var(--ink-4)', marginBottom: '8px',
            }}>Billing</div>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '12px', lineHeight: 1.5 }}>
              {active
                ? 'Update payment details or manage your membership.'
                : 'Restart your membership or update payment details.'}
            </p>
            {!active && (
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-4)', marginBottom: '12px', lineHeight: 1.5 }}>
                This opens Stripe&apos;s billing portal. If your old membership cannot be restarted there, use{' '}
                <Link href="/signup" style={{ color: 'var(--green-dk)' }}>
                  the signup page
                </Link>{' '}
                to begin a new one.
              </p>
            )}
            <button
              onClick={handleBillingAction}
              disabled={billingLoading}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--green-dk)',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: billingLoading ? 'default' : 'pointer',
                opacity: billingLoading ? 0.6 : 1,
              }}
            >
              {billingLoading
                ? active
                  ? 'Opening billing portal...'
                  : 'Starting checkout...'
                : active
                  ? 'Manage billing'
                  : 'Reactivate membership'}
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
