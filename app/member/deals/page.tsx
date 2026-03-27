'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Deal = {
  id: string
  business_name: string
  deal_description: string
  category: string
  address: string
  emoji: string
}

export default function MemberDeals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [filter, setFilter] = useState('All')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/member/login'); return }

      const email = userData.user.email!

      // Check active Stripe subscription
      const res = await fetch('/api/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const { active } = await res.json()

      if (!active) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      const { data: dealsData } = await supabase
        .from('deals').select('*').eq('active', true).order('created_at')
      if (dealsData) setDeals(dealsData)

      const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
      const { data: redemptions } = await supabase
        .from('redemptions').select('deal_id, redeemed_at')
        .eq('member_email', email).gte('redeemed_at', oneDayAgo)

      if (redemptions) {
        const cdMap: Record<string, number> = {}
        redemptions.forEach(r => {
          if (!r.deal_id) return
          const secsLeft = Math.ceil((new Date(r.redeemed_at).getTime() + 86400000 - Date.now()) / 1000)
          if (secsLeft > 0) cdMap[r.deal_id] = secsLeft
        })
        setCooldowns(cdMap)
      }
      setLoading(false)
    }
    init()
  }, [router])

  function formatCooldown(secs: number) {
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const categories = ['All', ...Array.from(new Set(deals.map(d => d.category)))]
  const filtered = filter === 'All' ? deals : deals.filter(d => d.category === filter)

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="display pulse" style={{ fontSize: '28px', color: 'var(--green)' }}>Loading your deals...</div>
    </main>
  )

  if (accessDenied) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        display: 'flex', alignItems: 'center', padding: '0 24px',
        height: '56px', borderBottom: '2px solid var(--ink)',
      }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <h1 className="display fade-up" style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '12px' }}>
            No active plan.
          </h1>
          <p className="fade-up-2" style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px', lineHeight: 1.55 }}>
            Your subscription isn't active. Sign up to unlock all Philly deals.
          </p>
          <Link href="/signup" className="btn btn-primary fade-up-3" style={{ width: '100%', fontSize: '18px', padding: '16px', display: 'flex', marginBottom: '12px' }}>
            Get PerkPass — $3/month
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{
              width: '100%', background: 'none', border: 'none',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '14px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              color: 'var(--ink-4)', cursor: 'pointer', padding: '8px',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '80px' }}>

      {/* Confirm overlay */}
      {selectedDeal && (
        <div className="fade-in" style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg-2)', borderRadius: '10px',
            padding: '28px', width: '100%', maxWidth: '440px',
            border: '2px solid var(--ink)',
          }}>
            <div style={{ marginBottom: '20px' }}>
              <div className="display" style={{ fontSize: '28px', marginBottom: '4px' }}>
                {selectedDeal.business_name}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green-dk)' }}>
                {selectedDeal.deal_description}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ink-4)', marginTop: '4px', fontWeight: 500 }}>
                {selectedDeal.address}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-3)', borderRadius: '8px', padding: '16px',
              marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              {[
                { label: '2-minute window', desc: 'Code expires 2 minutes after confirming.' },
                { label: '24-hour cooldown', desc: 'This deal resets every 24 hours.' },
                { label: 'Single use only', desc: 'Each code works once, for you only.' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', gap: '10px' }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '11px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: 'var(--green)', flexShrink: 0, paddingTop: '2px', width: '120px',
                  }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500 }}>{r.desc}</div>
                </div>
              ))}
            </div>

            <div className="display" style={{ fontSize: '18px', marginBottom: '16px' }}>
              Are you at {selectedDeal.business_name} right now?
            </div>

            <button
              onClick={() => {
                router.push(`/member/redeem?id=${selectedDeal.id}&biz=${encodeURIComponent(selectedDeal.business_name)}&deal=${encodeURIComponent(selectedDeal.deal_description)}`)
                setSelectedDeal(null)
              }}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '18px', padding: '16px', marginBottom: '8px' }}
            >
              Yes — show my code
            </button>
            <button
              onClick={() => setSelectedDeal(null)}
              className="btn btn-outline"
              style={{ width: '100%', fontSize: '16px', padding: '14px' }}
            >
              Not yet — go back
            </button>
          </div>
        </div>
      )}

      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', borderBottom: '2px solid var(--ink)',
        padding: '0 20px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" className="pp-logo">Perk<span>Pass</span></a>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/account" style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em',
            color: 'var(--ink-3)', textDecoration: 'none',
          }}>Account</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em',
              color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <div style={{ padding: '28px 20px', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 className="display" style={{ fontSize: 'clamp(36px, 8vw, 56px)', marginBottom: '4px' }}>
            Your deals.
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {deals.length} active in Philadelphia
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              flexShrink: 0,
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '7px 14px', borderRadius: '4px', border: 'none',
              cursor: 'pointer', transition: 'all 0.12s',
              background: filter === cat ? 'var(--ink)' : 'var(--bg-3)',
              color: filter === cat ? 'var(--bg)' : 'var(--ink-3)',
            }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((deal, i) => {
            const onCooldown = cooldowns[deal.id] !== undefined
            return (
              <div key={deal.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '18px 0', borderBottom: '1px solid var(--border)',
                opacity: onCooldown ? 0.45 : 1, transition: 'opacity 0.15s',
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '12px', fontWeight: 700,
                  color: 'var(--ink-4)', width: '24px', flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '20px', fontWeight: 800,
                    color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: '2px',
                  }}>
                    {deal.business_name}
                    {onCooldown && (
                      <span style={{ marginLeft: '10px', fontSize: '13px', fontWeight: 700, color: 'var(--ink-4)' }}>
                        {formatCooldown(cooldowns[deal.id])}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--green-dk)' }}>
                    {deal.deal_description}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500, marginTop: '2px' }}>
                    {deal.address}
                  </div>
                </div>
                <button
                  onClick={() => !onCooldown && setSelectedDeal(deal)}
                  disabled={onCooldown}
                  className={onCooldown ? '' : 'btn btn-primary'}
                  style={onCooldown ? {
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '13px', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    padding: '8px 14px', borderRadius: '4px',
                    background: 'var(--bg-3)', color: 'var(--ink-4)',
                    border: 'none', cursor: 'not-allowed', flexShrink: 0,
                  } : { fontSize: '14px', padding: '10px 18px', flexShrink: 0 }}
                >
                  {onCooldown ? 'Used' : 'Redeem'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}