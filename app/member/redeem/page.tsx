'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function RedeemContent() {
  const params = useSearchParams()
  const router = useRouter()
  const biz = params.get('biz') || 'this business'
  const deal = params.get('deal') || 'your deal'
  const dealId = params.get('id') || ''

  const [timeLeft, setTimeLeft] = useState(120)
  const [code, setCode] = useState('')
  const [expired, setExpired] = useState(false)
  const [cooldown, setCooldown] = useState<number | null>(null)
  const [cooldownType, setCooldownType] = useState<'15min' | '24hr'>('15min')
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)

  function makeCode() {
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', N = '23456789'
    let c = ''
    for (let i = 0; i < 3; i++) c += L[Math.floor(Math.random() * L.length)]
    for (let i = 0; i < 3; i++) c += N[Math.floor(Math.random() * N.length)]
    return c
  }

  function startTimer(newCode: string) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setExpired(false); setTimeLeft(120); setCode(newCode)
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { if (intervalRef.current) clearInterval(intervalRef.current); setExpired(true); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function startCooldownTimer(secs: number, type: '15min' | '24hr') {
    const capped = Math.min(secs, type === '24hr' ? 86400 : 900)
    setCooldown(capped)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev === null || prev <= 1) { if (cooldownRef.current) clearInterval(cooldownRef.current); return null }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    async function run() {
      const { data: ud } = await supabase.auth.getUser()
      if (!ud.user) { router.push('/member/login'); return }
      const email = ud.user.email!

      const { data: d1 } = await supabase.from('redemptions').select('redeemed_at')
        .eq('member_email', email).eq('deal_id', dealId)
        .gte('redeemed_at', new Date(Date.now() - 86400000).toISOString())
        .order('redeemed_at', { ascending: false }).limit(1)

      if (d1 && d1.length > 0) {
        const s = Math.ceil((new Date(d1[0].redeemed_at).getTime() + 86400000 - Date.now()) / 1000)
        if (s > 0) { setCooldownType('24hr'); startCooldownTimer(s, '24hr'); setLoading(false); return }
      }

      const { data: d2 } = await supabase.from('redemptions').select('redeemed_at')
        .eq('member_email', email).eq('deal_id', dealId)
        .gte('redeemed_at', new Date(Date.now() - 900000).toISOString())
        .order('redeemed_at', { ascending: false }).limit(1)

      if (d2 && d2.length > 0) {
        const s = Math.ceil((new Date(d2[0].redeemed_at).getTime() + 900000 - Date.now()) / 1000)
        if (s > 0) { setCooldownType('15min'); startCooldownTimer(s, '15min'); setLoading(false); return }
      }

      const newCode = makeCode()
      await supabase.from('redemptions').insert({
        member_email: email, business_name: biz, deal_description: deal,
        deal_id: dealId, code: newCode, redeemed_at: new Date().toISOString()
      })
      startTimer(newCode)
      setLoading(false)
    }
    run()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  function fmtCooldown(s: number) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60
  const pct = (timeLeft / 120) * 100
  const isUrgent = timeLeft <= 30

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

  if (cooldown !== null) {
    const is24 = cooldownType === '24hr'
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <h2 className="display" style={{ fontSize: 'clamp(40px, 10vw, 64px)', marginBottom: '12px' }}>
            {is24 ? 'Come back tomorrow.' : 'Hold tight.'}
          </h2>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>
            {is24 ? 'You already used this deal today. Each deal resets every 24 hours.' : 'Wait a moment before generating a new code.'}
          </p>
          <div style={{
            background: 'var(--forest)', borderRadius: '10px',
            padding: '32px', marginBottom: '24px', textAlign: 'center',
          }}>
            <div className="display" style={{ fontSize: '64px', color: 'var(--green)', lineHeight: 1 }}>
              {fmtCooldown(cooldown)}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {is24 ? 'Hours remaining' : 'Minutes remaining'}
            </div>
            <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '4px' }}>
              <div style={{
                height: '100%', background: 'var(--green)', borderRadius: '4px',
                width: `${(cooldown / (is24 ? 86400 : 900)) * 100}%`,
                transition: 'width 1s linear',
              }} />
            </div>
          </div>
          <button onClick={() => router.push('/member/deals')} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px' }}>
            Browse other deals
          </button>
        </div>
      </main>
    )
  }

  if (expired) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="display" style={{ fontSize: 'clamp(40px, 10vw, 64px)', marginBottom: '12px' }}>
          Code expired.
        </h2>
        <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>
          Your 2-minute window passed. A cooldown is now active.
        </p>
        <button onClick={() => router.push('/member/deals')} className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px' }}>
          Back to deals
        </button>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>

        {/* Nav line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }} className="fade-up">
          <a href="/" className="pp-logo">Perk<span>Pass</span></a>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Show cashier
          </div>
        </div>

        {/* Business */}
        <div style={{ marginBottom: '24px' }} className="fade-up-2">
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            Redeeming at
          </div>
          <div className="display" style={{ fontSize: '28px', marginBottom: '2px' }}>{biz}</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-dk)' }}>{deal}</div>
        </div>

        {/* Code card */}
        <div className="fade-up-3" style={{
          background: 'var(--forest)', borderRadius: '10px',
          padding: '32px 24px', textAlign: 'center',
          marginBottom: '16px', border: '2px solid var(--green)',
        }}>
          <div style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--green)',
            marginBottom: '12px',
          }}>
            One-time code
          </div>
          <div className="display" style={{
            fontSize: '72px', letterSpacing: '0.06em',
            color: '#ffffff', lineHeight: 1, marginBottom: '8px',
          }}>
            {code}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
            Valid 2 min — single use — 24hr cooldown
          </div>
        </div>

        {/* Timer */}
        <div className="fade-up-4" style={{
          background: isUrgent ? 'var(--red-lt)' : 'var(--bg-2)',
          border: `2px solid ${isUrgent ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: '10px', padding: '16px', marginBottom: '16px',
          transition: 'all 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '12px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: isUrgent ? 'var(--red)' : 'var(--ink-3)',
            }}>
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

        <div style={{
          background: 'var(--bg-2)', borderRadius: '8px', padding: '14px 16px',
          marginBottom: '20px', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Read your code aloud or show this screen. The cashier enters it to apply your discount.
          </p>
        </div>

        <button
          onClick={() => router.push('/member/deals')}
          style={{
            width: '100%', background: 'none', border: 'none',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '14px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            color: 'var(--ink-4)', cursor: 'pointer', padding: '8px',
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