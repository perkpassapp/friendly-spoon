'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  REDEMPTION_CODE_TTL_SECONDS,
  REDEMPTION_COOLDOWN_SECONDS,
  getCooldownRemainingSeconds,
} from '@/lib/product'

function RedeemContent() {
  const params = useSearchParams()
  const router = useRouter()
  const biz = params.get('biz') || 'this business'
  const deal = params.get('deal') || 'your deal'
  const dealId = params.get('id') || ''

  const [timeLeft, setTimeLeft] = useState(REDEMPTION_CODE_TTL_SECONDS)
  const [code, setCode] = useState('')
  const [expired, setExpired] = useState(false)
  const [cooldown, setCooldown] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [showLeaveWarning, setShowLeaveWarning] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const currentCode = useRef('')

  function makeCode() {
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', N = '23456789'
    let c = ''
    for (let i = 0; i < 3; i++) c += L[Math.floor(Math.random() * L.length)]
    for (let i = 0; i < 3; i++) c += N[Math.floor(Math.random() * N.length)]
    return c
  }

  function startTimer(newCode: string) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setExpired(false); setTimeLeft(REDEMPTION_CODE_TTL_SECONDS); setCode(newCode)
    currentCode.current = newCode
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          if (pollRef.current) clearInterval(pollRef.current)
          setExpired(true); return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function startPolling(memberEmail: string, codeVal: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('redemptions')
        .select('validated_at')
        .eq('member_email', memberEmail)
        .eq('code', codeVal)
        .not('validated_at', 'is', null)
        .limit(1)
      if (data && data.length > 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (pollRef.current) clearInterval(pollRef.current)
        setConfirmed(true)
      }
    }, 2000)
  }

  function startCooldownTimer(secs: number) {
    const capped = Math.min(secs, REDEMPTION_COOLDOWN_SECONDS)
    setCooldown(capped)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev === null || prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current); return null
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    async function run() {
      const { data: ud } = await supabase.auth.getUser()
      if (!ud.user) { router.push('/member/login'); return }
      const email = ud.user.email!

      const cooldownThreshold = new Date(Date.now() - REDEMPTION_COOLDOWN_SECONDS * 1000).toISOString()
      const { data: recentRedemptions } = await supabase.from('redemptions').select('redeemed_at')
        .eq('member_email', email).eq('deal_id', dealId)
        .gte('redeemed_at', cooldownThreshold)
        .order('redeemed_at', { ascending: false }).limit(1)
      if (recentRedemptions && recentRedemptions.length > 0) {
        const s = getCooldownRemainingSeconds(recentRedemptions[0].redeemed_at)
        if (s > 0) { startCooldownTimer(s); setLoading(false); return }
      }

      const newCode = makeCode()
      await supabase.from('redemptions').insert({
        member_email: email,
        business_name: biz,
        deal_description: deal,
        deal_id: dealId,
        code: newCode,
        redeemed_at: new Date().toISOString()
      })
      startTimer(newCode)
      startPolling(email, newCode)
      setLoading(false)
    }
    run()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (cooldownRef.current) clearInterval(cooldownRef.current)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [biz, deal, dealId, router])

  function fmtCooldown(s: number) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60
  const pct = (timeLeft / REDEMPTION_CODE_TTL_SECONDS) * 100
  const isUrgent = timeLeft <= 30

  // ── Loading ──
  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <span className="pp-logo">Perk<span>Pass</span></span>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ width: '140px', height: '16px', background: 'var(--bg-3)', borderRadius: '4px', marginBottom: '16px' }} />
          <div style={{ width: '240px', height: '28px', background: 'var(--bg-3)', borderRadius: '6px', marginBottom: '8px' }} />
          <div style={{ width: '180px', height: '18px', background: 'var(--bg-3)', borderRadius: '4px', marginBottom: '32px' }} />
          <div style={{ background: 'var(--forest)', borderRadius: '10px', padding: '32px 24px', textAlign: 'center', marginBottom: '16px', border: '2px solid var(--green)' }}>
            <div style={{ width: '180px', height: '72px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', margin: '0 auto' }} />
          </div>
          <div style={{ background: 'var(--bg-2)', borderRadius: '10px', height: '64px', border: '1px solid var(--border)' }} />
        </div>
      </div>
    </main>
  )

  // ── Cooldown ──
  if (cooldown !== null) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <h2 className="display" style={{ fontSize: 'clamp(40px, 10vw, 64px)', marginBottom: '12px' }}>
            {'Hold tight.'}
          </h2>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>
            {`Wait ${REDEMPTION_COOLDOWN_SECONDS / 60} minutes before using this deal again.`}
          </p>
          <div style={{ background: 'var(--forest)', borderRadius: '10px', padding: '32px', marginBottom: '24px', textAlign: 'center' }}>
            <div className="display" style={{ fontSize: '64px', color: 'var(--green)', lineHeight: 1 }}>{fmtCooldown(cooldown)}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {'Minutes remaining'}
            </div>
            <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '4px' }}>
              <div style={{ height: '100%', background: 'var(--green)', borderRadius: '4px', width: `${(cooldown / REDEMPTION_COOLDOWN_SECONDS) * 100}%`, transition: 'width 1s linear' }} />
            </div>
          </div>
          <button onClick={() => router.push('/member/deals')} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px' }}>
            Browse other deals
          </button>
        </div>
      </main>
    )
  }

  // ── Expired ──
  if (expired) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="display" style={{ fontSize: 'clamp(40px, 10vw, 64px)', marginBottom: '12px' }}>Code expired.</h2>
        <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>Your 2-minute window passed. A cooldown is now active.</p>
        <button onClick={() => router.push('/member/deals')} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px' }}>
          Back to deals
        </button>
      </div>
    </main>
  )

  // ── Confirmed ──
  if (confirmed) return (
    <main style={{ minHeight: '100vh', background: 'var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div className="fade-up" style={{ marginBottom: '24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--green)', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(44px, 12vw, 68px)', color: '#ffffff', marginBottom: '12px', lineHeight: 1 }}>
            Code confirmed.
          </h1>
          <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--green)', marginBottom: '8px' }}>{deal}</p>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Enjoy your visit at {biz}!</p>
        </div>
        <button
          onClick={() => router.push('/member/deals')}
          style={{
            marginTop: '40px', background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.3)',
            borderRadius: '8px', padding: '14px 28px', cursor: 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)',
          }}
        >
          Back to deals
        </button>
      </div>
    </main>
  )

  // ── Main redeem screen ──
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {showLeaveWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            background: 'var(--bg)', borderRadius: '16px', padding: '28px 24px',
            width: '100%', maxWidth: '380px', border: '2px solid var(--ink)', textAlign: 'center'
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%', background: 'var(--red-lt)',
              margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 className="display" style={{ fontSize: '32px', marginBottom: '8px' }}>Leave this page?</h2>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.5, marginBottom: '24px' }}>
              If you leave now, your code <strong>expires immediately</strong> and the {REDEMPTION_COOLDOWN_SECONDS / 60}-minute cooldown still applies.
            </p>
            <button
              onClick={() => router.push('/member/deals')}
              style={{
                width: '100%', marginBottom: '10px', padding: '14px',
                background: 'var(--red-lt)', border: '1px solid var(--red)', borderRadius: '8px',
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--red)', cursor: 'pointer'
              }}
            >
              Leave anyway
            </button>
            <button
              onClick={() => setShowLeaveWarning(false)}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '16px', padding: '14px' }}
            >
              Stay - keep my code
            </button>
          </div>
        </div>
      )}
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="fade-up">
          <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Show cashier
          </div>
        </div>

        <div style={{ marginBottom: '24px' }} className="fade-up-2">
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            Redeeming at
          </div>
          <div className="display" style={{ fontSize: '28px', marginBottom: '2px' }}>{biz}</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-dk)' }}>{deal}</div>
        </div>

        <div className="fade-up-3" style={{
          background: 'var(--forest)', borderRadius: '10px', padding: '32px 24px',
          textAlign: 'center', marginBottom: '16px', border: '2px solid var(--green)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '12px' }}>
            One-time code
          </div>
          <div className="display" style={{ fontSize: '72px', letterSpacing: '0.06em', color: '#ffffff', lineHeight: 1, marginBottom: '8px' }}>
            {code}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
            {`Valid ${REDEMPTION_CODE_TTL_SECONDS / 60} min - single use - ${REDEMPTION_COOLDOWN_SECONDS / 60} min cooldown`}
          </div>
        </div>

        <div className="fade-up-4" style={{
          background: isUrgent ? 'var(--red-lt)' : 'var(--bg-2)',
          border: `2px solid ${isUrgent ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: '10px', padding: '16px', marginBottom: '16px', transition: 'all 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isUrgent ? 'var(--red)' : 'var(--ink-3)' }}>
              {isUrgent ? 'Expiring soon' : 'Time remaining'}
            </div>
            <div className="display" style={{ fontSize: '32px', color: isUrgent ? 'var(--red)' : 'var(--ink)', lineHeight: 1 }}>
              {mins}:{secs.toString().padStart(2, '0')}
            </div>
          </div>
          <div style={{ background: 'var(--bg-3)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              background: isUrgent ? 'var(--red)' : 'var(--green)',
              width: `${pct}%`, transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
        </div>

        <div style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Read your code aloud or show this screen. The cashier enters it to apply your discount.
          </p>
        </div>

        <button
          onClick={() => setShowLeaveWarning(true)}
          style={{
            width: '100%', background: 'none', border: 'none',
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)',
            cursor: 'pointer', padding: '8px',
          }}
        >
          Back to deals
        </button>
      </div>
    </main>
  )
}

export default function RedeemPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="display pulse" style={{ fontSize: '28px', color: 'var(--green)' }}>Loading...</div>
      </main>
    }>
      <RedeemContent />
    </Suspense>
  )
}
