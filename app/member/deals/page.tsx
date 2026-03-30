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
  photo_url?: string
}

const CAT_EMOJI: Record<string, string> = {
  Cafe: '☕',
  Restaurant: '🍽️',
  Barber: '✂️',
  Fitness: '🏋️',
  Nails: '💅',
  Sport: '🏓',
  Wellness: '🧘',
  Retail: '🛍️',
  Other: '🎟️',
}

const CAT_BG: Record<string, string> = {
  Cafe: '#FFF3E0',
  Restaurant: '#FCE4EC',
  Barber: '#E3F2FD',
  Fitness: '#E8F5E9',
  Nails: '#FCE4EC',
  Sport: '#EDE7F6',
  Wellness: '#E0F7FA',
  Retail: '#FFF8E1',
  Other: '#F3E5F5',
}

export default function MemberDeals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [filter, setFilter] = useState('All')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const [userName, setUserName] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/member/login'); return }
      const email = userData.user.email!

      // Get name from members table
      const { data: memberData } = await supabase
        .from('members').select('name').eq('email', email).limit(1)
      if (memberData?.[0]?.name) {
        setUserName(memberData[0].name.split(' ')[0])
      }

      const res = await fetch('/api/verify-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const { active } = await res.json()
      if (!active) { setAccessDenied(true); setLoading(false); return }

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
          const s = Math.ceil((new Date(r.redeemed_at).getTime() + 86400000 - Date.now()) / 1000)
          if (s > 0) cdMap[r.deal_id] = s
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
  const featured = filtered.slice(0, 3)
  const rest = filtered.slice(3)

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#f8f8f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--green)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>Loading your deals</p>
      </div>
    </main>
  )

  if (accessDenied) return (
    <main style={{ minHeight: '100vh', background: '#f8f8f6', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--green-lt)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>🔒</div>
          <h1 className="display" style={{ fontSize: '48px', marginBottom: '12px' }}>Members only.</h1>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>Sign up to unlock every Philly deal.</p>
          <Link href="/signup" className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px', display: 'flex', marginBottom: '12px' }}>Get PerkPass — $3/month</Link>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} style={{ background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#f8f8f6', paddingBottom: '100px' }}>

      {/* Confirmation overlay */}
      {selectedDeal && (
        <div className="fade-in" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {/* Deal visual */}
            <div style={{ background: CAT_BG[selectedDeal.category] || '#f5f5f5', borderRadius: '12px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', marginBottom: '20px' }}>
              {selectedDeal.emoji || CAT_EMOJI[selectedDeal.category] || '🎟️'}
            </div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: 900, color: '#1a1a1a', marginBottom: '4px' }}>{selectedDeal.business_name}</h3>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '4px' }}>{selectedDeal.deal_description}</p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{selectedDeal.address}</p>

            <div style={{ background: '#f8f8f6', borderRadius: '10px', padding: '14px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {[{ label: 'Window', val: '2 min' }, { label: 'Cooldown', val: '24 hrs' }, { label: 'Uses', val: '1x' }].map(r => (
                <div key={r.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 900, color: '#1a1a1a' }}>{r.val}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{r.label}</div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '14px', fontWeight: 600, color: '#555', textAlign: 'center', marginBottom: '16px' }}>Are you at {selectedDeal.business_name} right now?</p>

            <button
              onClick={() => { router.push(`/member/redeem?id=${selectedDeal.id}&biz=${encodeURIComponent(selectedDeal.business_name)}&deal=${encodeURIComponent(selectedDeal.deal_description)}`); setSelectedDeal(null) }}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '17px', padding: '16px', marginBottom: '10px', borderRadius: '12px' }}
            >
              Yes — show my code
            </button>
            <button onClick={() => setSelectedDeal(null)} style={{ width: '100%', padding: '14px', background: 'transparent', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#888', cursor: 'pointer' }}>
              Not yet
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: '#ffffff', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" className="pp-logo" style={{ fontSize: '20px' }}>Perk<span>Pass</span></Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/account" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--green-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green-dk)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px' }}>

        {/* Greeting */}
        <div style={{ padding: '28px 0 20px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: '32px', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
            {userName ? `Hey ${userName}.` : 'Your deals.'} <span style={{ color: 'var(--green)' }}>{deals.length} active.</span>
          </h1>
        </div>

        {/* Category pills — Uber Eats style */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              flexShrink: 0, padding: '10px 18px',
              borderRadius: '999px',
              border: filter === cat ? '2px solid #1a1a1a' : '1.5px solid rgba(0,0,0,0.12)',
              fontFamily: "'Barlow', sans-serif", fontSize: '14px', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.12s',
              background: filter === cat ? '#1a1a1a' : '#ffffff',
              color: filter === cat ? '#ffffff' : '#1a1a1a',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {cat !== 'All' && <span style={{ fontSize: '14px' }}>{CAT_EMOJI[cat] || '🎟️'}</span>}
              {cat}
            </button>
          ))}
        </div>

        {/* Featured cards — large Airbnb-style */}
        {featured.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '14px' }}>
              {filter === 'All' ? 'Featured deals' : filter}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {featured.map(deal => {
                const onCooldown = cooldowns[deal.id] !== undefined
                return (
                  <div
                    key={deal.id}
                    onClick={() => !onCooldown && setSelectedDeal(deal)}
                    style={{
                      background: '#ffffff', borderRadius: '16px',
                      overflow: 'hidden', cursor: onCooldown ? 'default' : 'pointer',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      opacity: onCooldown ? 0.6 : 1,
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => { if (!onCooldown) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)' }}
                  >
                    {/* Image area */}
                    <div style={{ height: '140px', background: CAT_BG[deal.category] || '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '56px', position: 'relative' }}>
                      {deal.emoji || CAT_EMOJI[deal.category] || '🎟️'}
                      {onCooldown && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Available in {formatCooldown(cooldowns[deal.id])}
                        </div>
                      )}
                      {!onCooldown && (
                        <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--green)', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Available
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div style={{ padding: '16px 20px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 900, color: '#1a1a1a', lineHeight: 1.1, marginBottom: '4px' }}>{deal.business_name}</p>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '6px' }}>{deal.deal_description}</p>
                          <p style={{ fontSize: '12px', color: '#888', fontWeight: 500 }}>📍 {deal.address}</p>
                        </div>
                        {!onCooldown && (
                          <div style={{ background: '#1a1a1a', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rest of deals — compact list */}
        {rest.length > 0 && (
          <div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', marginBottom: '14px' }}>
              More deals
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rest.map(deal => {
                const onCooldown = cooldowns[deal.id] !== undefined
                return (
                  <div
                    key={deal.id}
                    onClick={() => !onCooldown && setSelectedDeal(deal)}
                    style={{
                      background: '#ffffff', borderRadius: '14px', padding: '16px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      cursor: onCooldown ? 'default' : 'pointer',
                      opacity: onCooldown ? 0.55 : 1,
                      boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => { if (!onCooldown) e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: CAT_BG[deal.category] || '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                      {deal.emoji || CAT_EMOJI[deal.category] || '🎟️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px', fontWeight: 800, color: '#1a1a1a', marginBottom: '2px', lineHeight: 1.1 }}>{deal.business_name}</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '2px' }}>{deal.deal_description}</p>
                      <p style={{ fontSize: '11px', color: '#aaa', fontWeight: 500 }}>{deal.address}</p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {onCooldown ? (
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, color: '#aaa', textAlign: 'right' }}>
                          <div style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>Used</div>
                          <div style={{ color: '#bbb', fontSize: '11px' }}>{formatCooldown(cooldowns[deal.id])}</div>
                        </div>
                      ) : (
                        <div style={{ background: '#f5f5f5', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 700, color: '#1a1a1a', marginBottom: '8px' }}>No deals in this category yet.</p>
            <p style={{ fontSize: '14px', color: '#888' }}>More coming soon.</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.08)', padding: '12px 32px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 10 }}>
        {[
          { label: 'Deals', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, href: '/member/deals', active: true },
          { label: 'Account', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, href: '/account', active: false },
        ].map(item => (
          <Link key={item.label} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', color: item.active ? '#1a1a1a' : '#aaa', transition: 'color 0.12s' }}>
            {item.icon}
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
          </Link>
        ))}
      </div>
    </main>
  )
}