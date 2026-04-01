'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Schedule = {
  days: number[]
  start: string
  end: string
}

type Deal = {
  id: string
  business_name: string
  deal_description: string
  category: string
  address: string
  emoji: string
  photo_url?: string
  schedule: Schedule | null
}

type BusinessGroup = {
  business_name: string
  category: string
  address: string
  photo_url?: string
  deals: Deal[]
}

const CAT_PHOTOS: Record<string, string> = {
  Cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=75',
  Restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=75',
  Barber: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=75',
  Fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=75',
  Nails: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=75',
  Sport: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=75',
  Wellness: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=75',
  Retail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=75',
  Other: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=75',
}

const CAT_EMOJI: Record<string, string> = {
  Cafe: '☕', Restaurant: '🍽️', Barber: '✂️', Fitness: '🏋️',
  Nails: '💅', Sport: '🏓', Wellness: '🧘', Retail: '🛍️', Other: '🎟️',
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
      const { data: memberData } = await supabase
        .from('members').select('name').eq('email', email).limit(1)
      if (memberData?.[0]?.name) setUserName(memberData[0].name.split(' ')[0])

      const res = await fetch('/api/verify-subscription', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const { active } = await res.json()
      if (!active) { setAccessDenied(true); setLoading(false); return }

      const { data: dealsData } = await supabase
        .from('deals').select('*').eq('active', true).order('created_at')
      if (dealsData) setDeals(dealsData)

      const fifteenMinsAgo = new Date(Date.now() - 900000).toISOString()
      const { data: redemptions } = await supabase
        .from('redemptions').select('deal_id, redeemed_at')
        .eq('member_email', email).gte('redeemed_at', fifteenMinsAgo)
      if (redemptions) {
        const cdMap: Record<string, number> = {}
        redemptions.forEach(r => {
          if (!r.deal_id) return
          const s = Math.ceil((new Date(r.redeemed_at).getTime() + 900000 - Date.now()) / 1000)
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

  function isScheduleActive(deal: Deal): boolean {
    if (!deal.schedule) return true
    const now = new Date()
    const day = now.getDay()
    if (!deal.schedule.days.includes(day)) return false
    const [sh, sm] = deal.schedule.start.split(':').map(Number)
    const [eh, em] = deal.schedule.end.split(':').map(Number)
    const nowMins = now.getHours() * 60 + now.getMinutes()
    const startMins = sh * 60 + sm
    const endMins = eh * 60 + em
    return nowMins >= startMins && nowMins < endMins
  }

  function scheduleLabel(deal: Deal): string {
    if (!deal.schedule) return ''
    const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const days = deal.schedule.days.map(d => DAY_LABELS[d])
    function fmt(t: string) {
      const [hh, mm] = t.split(':').map(Number)
      const ampm = hh >= 12 ? 'PM' : 'AM'
      return `${hh % 12 || 12}${mm ? ':' + String(mm).padStart(2,'0') : ''}${ampm}`
    }
    const dayStr = deal.schedule.days.length === 7 ? 'Daily' : days.join(', ')
    return `${dayStr} ${fmt(deal.schedule.start)}–${fmt(deal.schedule.end)}`
  }

  function getPhoto(deal: Deal) {
    return deal.photo_url || CAT_PHOTOS[deal.category] || CAT_PHOTOS['Other']
  }

  // Group deals by business name
  function groupDeals(dealList: Deal[]): BusinessGroup[] {
    const map = new Map<string, BusinessGroup>()
    dealList.forEach(d => {
      if (!map.has(d.business_name)) {
        map.set(d.business_name, {
          business_name: d.business_name,
          category: d.category,
          address: d.address,
          photo_url: d.photo_url,
          deals: []
        })
      }
      map.get(d.business_name)!.deals.push(d)
    })
    return Array.from(map.values())
  }

  const categories = ['All', ...Array.from(new Set(deals.map(d => d.category)))]
  const filtered = filter === 'All' ? deals : deals.filter(d => d.category === filter)
  const groups = groupDeals(filtered)
  const featuredGroups = groups.slice(0, 2)
  const restGroups = groups.slice(2)

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '48px' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '2px solid var(--ink)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="pp-logo">Perk<span>Pass</span></span>
      </header>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ width: '200px', height: '36px', background: 'var(--bg-3)', borderRadius: '6px', marginBottom: '8px' }} />
          <div style={{ width: '160px', height: '16px', background: 'var(--bg-3)', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[80,70,90,75].map((w,i) => <div key={i} style={{ width: w, height: '34px', background: 'var(--bg-3)', borderRadius: '4px', flexShrink: 0 }} />)}
        </div>
        {[1,2].map(i => (
          <div key={i} style={{ background: 'var(--bg-2)', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', border: '1px solid var(--border)' }}>
            <div style={{ height: '180px', background: 'var(--bg-3)' }} />
            <div style={{ padding: '14px 16px' }}>
              <div style={{ width: '60%', height: '18px', background: 'var(--bg-3)', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '40%', height: '14px', background: 'var(--bg-3)', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  )

  if (accessDenied) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <h1 className="display" style={{ fontSize: '56px', marginBottom: '12px' }}>Members only.</h1>
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>Sign up to unlock every Philly deal.</p>
          <Link href="/signup" className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px', display: 'flex', marginBottom: '12px' }}>
            Get PerkPass — $3/month
          </Link>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ width: '100%', background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', cursor: 'pointer', padding: '8px' }}>
            Sign out
          </button>
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '48px' }}>

      {/* Deal confirmation overlay */}
      {selectedDeal && (
        <div className="fade-in" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg)', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '440px', border: '2px solid var(--ink)' }}>
            <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
              <img src={getPhoto(selectedDeal)} alt={selectedDeal.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '16px' }}>
                <div className="display" style={{ fontSize: '22px', color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{selectedDeal.business_name}</div>
              </div>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '4px' }}>{selectedDeal.deal_description}</p>
              <p style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500, marginBottom: '20px' }}>{selectedDeal.address}</p>
              <div style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '14px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[{ n: '2 min', l: 'Window' }, { n: '24 hrs', l: 'Cooldown' }, { n: '1x', l: 'Per day' }].map(r => (
                  <div key={r.l} style={{ textAlign: 'center' }}>
                    <div className="display" style={{ fontSize: '18px', color: 'var(--ink)' }}>{r.n}</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', marginTop: '2px' }}>{r.l}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px', textAlign: 'center' }}>
                Are you at {selectedDeal.business_name} right now?
              </p>
              {isScheduleActive(selectedDeal) ? (
                <button onClick={() => { router.push(`/member/redeem?id=${selectedDeal.id}&biz=${encodeURIComponent(selectedDeal.business_name)}&deal=${encodeURIComponent(selectedDeal.deal_description)}`); setSelectedDeal(null) }}
                  className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px', marginBottom: '8px' }}>
                  Yes — show my code
                </button>
              ) : (
                <div style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '14px 16px', marginBottom: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', marginBottom: '4px' }}>Not available right now</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-3)' }}>Available: {scheduleLabel(selectedDeal)}</div>
                </div>
              )}
              <button onClick={() => setSelectedDeal(null)} className="btn btn-outline" style={{ width: '100%', fontSize: '15px', padding: '13px' }}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '2px solid var(--ink)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/member/deals" className="pp-logo">Perk<span>Pass</span></Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/account" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', textDecoration: 'none' }}>Account</Link>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ padding: '28px 0 8px' }}>
          <h1 className="display" style={{ fontSize: 'clamp(36px, 8vw, 52px)', marginBottom: '4px' }}>
            {userName ? `Hey ${userName}.` : 'Your deals.'}
          </h1>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)' }}>
            {groups.length} {groups.length === 1 ? 'business' : 'businesses'} · {filtered.length} deals in Philadelphia
          </p>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '16px 0 20px', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              flexShrink: 0, padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
              background: filter === cat ? 'var(--ink)' : 'var(--bg-2)',
              color: filter === cat ? 'var(--bg)' : 'var(--ink-3)',
            }}>
              {cat !== 'All' && <span style={{ marginRight: '4px' }}>{CAT_EMOJI[cat] || '🎟️'}</span>}
              {cat}
            </button>
          ))}
        </div>

        {/* Featured — large grouped cards */}
        {featuredGroups.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: '12px' }}>
              {filter === 'All' ? 'Featured' : filter}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {featuredGroups.map(group => {
                const firstDeal = group.deals[0]
                const hasMultiple = group.deals.length > 1
                const allOnCooldown = group.deals.every(d => cooldowns[d.id] !== undefined)
                return (
                  <div key={group.business_name} style={{
                    background: 'var(--bg-2)', borderRadius: '12px', overflow: 'hidden',
                    border: '1px solid var(--border)', opacity: allOnCooldown ? 0.6 : 1,
                  }}>
                    {/* Photo */}
                    <div style={{ height: '180px', overflow: 'hidden', position: 'relative', cursor: allOnCooldown ? 'not-allowed' : 'pointer' }}
                      onClick={() => !allOnCooldown && !hasMultiple && setSelectedDeal(firstDeal)}>
                      <img src={getPhoto(firstDeal)} alt={group.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--ink)', color: 'var(--bg)', padding: '4px 10px', borderRadius: '3px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {group.category}
                      </div>
                      {hasMultiple && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--green)', color: '#fff', padding: '4px 10px', borderRadius: '3px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {group.deals.length} deals
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px' }}>
                        <div className="display" style={{ fontSize: '22px', color: '#ffffff', lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                          {group.business_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: '2px' }}>📍 {group.address}</div>
                      </div>
                    </div>
                    {/* Deals list */}
                    <div style={{ padding: hasMultiple ? '0' : '14px 16px' }}>
                      {hasMultiple ? (
                        <div>
                          {group.deals.map((deal, i) => {
                            const onCooldown = cooldowns[deal.id] !== undefined
                            return (
                              <div key={deal.id} onClick={() => !onCooldown && setSelectedDeal(deal)}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '13px 16px', cursor: onCooldown ? 'not-allowed' : 'pointer',
                                  borderBottom: i < group.deals.length - 1 ? '1px solid var(--border)' : 'none',
                                  opacity: onCooldown ? 0.5 : 1,
                                  transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { if (!onCooldown) e.currentTarget.style.background = 'var(--bg-3)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                              >
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '1px' }}>{deal.deal_description}</div>
                                  {onCooldown && <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Back in {formatCooldown(cooldowns[deal.id])}</div>}
                                  {!onCooldown && deal.schedule && !isScheduleActive(deal) && <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Available: {scheduleLabel(deal)}</div>}
                                </div>
                                {!onCooldown && isScheduleActive(deal) && (
                                  <div className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', flexShrink: 0, borderRadius: '4px' }}>Redeem</div>
                                )}
                                {!onCooldown && !isScheduleActive(deal) && (
                                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>Later</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '3px' }}>{firstDeal.deal_description}</p>
                            {cooldowns[firstDeal.id] !== undefined && (
                              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase' }}>Back in {formatCooldown(cooldowns[firstDeal.id])}</p>
                            )}
                            {firstDeal.schedule && !isScheduleActive(firstDeal) && cooldowns[firstDeal.id] === undefined && (
                              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase' }}>Available: {scheduleLabel(firstDeal)}</p>
                            )}
                          </div>
                          {cooldowns[firstDeal.id] === undefined && (
                            <div className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '14px', flexShrink: 0, borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => setSelectedDeal(firstDeal)}>Redeem</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rest — card layout matching featured */}
        {restGroups.length > 0 && (
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: '12px' }}>
              More deals
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {restGroups.map(group => {
                const firstDeal = group.deals[0]
                const hasMultiple = group.deals.length > 1
                const allOnCooldown = group.deals.every(d => cooldowns[d.id] !== undefined)
                return (
                  <div key={group.business_name} style={{
                    background: 'var(--bg-2)', borderRadius: '12px', overflow: 'hidden',
                    border: '1px solid var(--border)', opacity: allOnCooldown ? 0.6 : 1,
                  }}>
                    {/* Photo */}
                    <div style={{ height: '180px', overflow: 'hidden', position: 'relative', cursor: allOnCooldown ? 'not-allowed' : 'pointer' }}
                      onClick={() => !allOnCooldown && !hasMultiple && setSelectedDeal(firstDeal)}>
                      <img src={getPhoto(firstDeal)} alt={group.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--ink)', color: 'var(--bg)', padding: '4px 10px', borderRadius: '3px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {group.category}
                      </div>
                      {hasMultiple && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--green)', color: '#fff', padding: '4px 10px', borderRadius: '3px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {group.deals.length} deals
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px' }}>
                        <div className="display" style={{ fontSize: '22px', color: '#ffffff', lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                          {group.business_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginTop: '2px' }}>📍 {group.address}</div>
                      </div>
                    </div>
                    {/* Deals */}
                    <div style={{ padding: hasMultiple ? '0' : '14px 16px' }}>
                      {hasMultiple ? (
                        <div>
                          {group.deals.map((deal, i) => {
                            const onCooldown = cooldowns[deal.id] !== undefined
                            return (
                              <div key={deal.id} onClick={() => !onCooldown && setSelectedDeal(deal)}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '13px 16px', cursor: onCooldown ? 'not-allowed' : 'pointer',
                                  borderBottom: i < group.deals.length - 1 ? '1px solid var(--border)' : 'none',
                                  opacity: onCooldown ? 0.5 : 1, transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { if (!onCooldown) e.currentTarget.style.background = 'var(--bg-3)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '1px' }}>{deal.deal_description}</div>
                                  {onCooldown && <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Back in {formatCooldown(cooldowns[deal.id])}</div>}
                                </div>
                                {!onCooldown && (
                                  <div className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', flexShrink: 0, borderRadius: '4px' }}>Redeem</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '3px' }}>{firstDeal.deal_description}</p>
                            {cooldowns[firstDeal.id] !== undefined && (
                              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase' }}>Back in {formatCooldown(cooldowns[firstDeal.id])}</p>
                            )}
                          </div>
                          {cooldowns[firstDeal.id] === undefined && (
                            <div className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '14px', flexShrink: 0, borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => setSelectedDeal(firstDeal)}>Redeem</div>
                          )}
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
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div className="display" style={{ fontSize: '32px', marginBottom: '8px' }}>No deals yet.</div>
            <p style={{ fontSize: '14px', color: 'var(--ink-4)', fontWeight: 500 }}>More coming soon in this category.</p>
          </div>
        )}
      </div>
    </main>
  )
}
