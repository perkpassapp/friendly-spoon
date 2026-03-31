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

const CAT_PHOTOS: Record<string, string> = {
  Cafe:       'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=75',
  Restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=75',
  Barber:     'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=75',
  Fitness:    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=75',
  Nails:      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=75',
  Sport:      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=75',
  Wellness:   'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=75',
  Retail:     'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=75',
  Other:      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=75',
}

const CAT_EMOJI: Record<string, string> = {
  Cafe: '☕', Restaurant: '🍽️', Barber: '✂️',
  Fitness: '🏋️', Nails: '💅', Sport: '🏓',
  Wellness: '🧘', Retail: '🛍️', Other: '🎟️',
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

  function getPhoto(deal: Deal) {
    return deal.photo_url || CAT_PHOTOS[deal.category] || CAT_PHOTOS['Other']
  }

  const categories = ['All', ...Array.from(new Set(deals.map(d => d.category)))]
  const filtered = filter === 'All' ? deals : deals.filter(d => d.category === filter)
  const featured = filtered.slice(0, 2)
  const rest = filtered.slice(2)

  if (loading) return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '48px' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '2px solid var(--ink)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="pp-logo">Perk<span>Pass</span></span>
      </header>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ width: '200px', height: '36px', background: 'var(--bg-3)', borderRadius: '6px', marginBottom: '8px', animation: 'shimmer 1.4s ease infinite' }} />
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
        {[1,2,3].map(i => (
          <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--bg-3)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '55%', height: '16px', background: 'var(--bg-3)', borderRadius: '4px', marginBottom: '6px' }} />
              <div style={{ width: '70%', height: '13px', background: 'var(--bg-3)', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
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

      {/* Confirmation overlay */}
      {selectedDeal && (
        <div className="fade-in" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg)', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '440px', border: '2px solid var(--ink)' }}>
            {/* Photo */}
            <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
              <img
                src={getPhoto(selectedDeal)}
                alt={selectedDeal.business_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '16px' }}>
                <div className="display" style={{ fontSize: '22px', color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{selectedDeal.business_name}</div>
              </div>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '4px' }}>{selectedDeal.deal_description}</p>
              <p style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500, marginBottom: '20px' }}>{selectedDeal.address}</p>

              {/* Rules */}
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
              <button
                onClick={() => {
                  router.push(`/member/redeem?id=${selectedDeal.id}&biz=${encodeURIComponent(selectedDeal.business_name)}&deal=${encodeURIComponent(selectedDeal.deal_description)}`)
                  setSelectedDeal(null)
                }}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '17px', padding: '16px', marginBottom: '8px' }}
              >
                Yes — show my code
              </button>
              <button onClick={() => setSelectedDeal(null)} className="btn btn-outline" style={{ width: '100%', fontSize: '15px', padding: '13px' }}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header — logo goes to deals when logged in */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '2px solid var(--ink)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/member/deals" className="pp-logo">Perk<span>Pass</span></Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/account" style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em',
            color: 'var(--ink-3)', textDecoration: 'none',
          }}>Account</Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px' }}>

        {/* Greeting */}
        <div style={{ padding: '28px 0 8px' }}>
          <h1 className="display" style={{ fontSize: 'clamp(36px, 8vw, 52px)', marginBottom: '4px' }}>
            {userName ? `Hey ${userName}.` : 'Your deals.'}
          </h1>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)' }}>
            {deals.length} active deals in Philadelphia
          </p>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '16px 0 20px', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              flexShrink: 0, padding: '8px 16px', borderRadius: '4px',
              border: 'none', cursor: 'pointer', transition: 'all 0.12s',
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              background: filter === cat ? 'var(--ink)' : 'var(--bg-2)',
              color: filter === cat ? 'var(--bg)' : 'var(--ink-3)',
            }}>
              {cat !== 'All' && <span style={{ marginRight: '4px' }}>{CAT_EMOJI[cat] || '🎟️'}</span>}
              {cat}
            </button>
          ))}
        </div>

        {/* Featured — large photo cards */}
        {featured.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: '12px' }}>
              {filter === 'All' ? 'Featured' : filter}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {featured.map(deal => {
                const onCooldown = cooldowns[deal.id] !== undefined
                return (
                  <div
                    key={deal.id}
                    onClick={() => !onCooldown && setSelectedDeal(deal)}
                    style={{
                      background: 'var(--bg-2)', borderRadius: '12px',
                      overflow: 'hidden', cursor: onCooldown ? 'not-allowed' : 'pointer',
                      border: '1px solid var(--border)',
                      opacity: onCooldown ? 0.6 : 1,
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => { if (!onCooldown) e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
                  >
                    {/* Photo */}
                    <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={getPhoto(deal)}
                        alt={deal.business_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                      {/* Gradient overlay */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
                      {/* Category tag */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'var(--ink)', color: 'var(--bg)', padding: '4px 10px', borderRadius: '3px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {deal.category}
                      </div>
                      {/* Cooldown badge */}
                      {onCooldown && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 10px', borderRadius: '3px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Back in {formatCooldown(cooldowns[deal.id])}
                        </div>
                      )}
                      {/* Business name on photo */}
                      <div style={{ position: 'absolute', bottom: '12px', left: '14px', right: '14px' }}>
                        <div className="display" style={{ fontSize: '22px', color: '#ffffff', lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                          {deal.business_name}
                        </div>
                      </div>
                    </div>
                    {/* Card body */}
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '3px' }}>{deal.deal_description}</p>
                        <p style={{ fontSize: '12px', color: 'var(--ink-4)', fontWeight: 500 }}>📍 {deal.address}</p>
                      </div>
                      {!onCooldown && (
                        <div className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '14px', flexShrink: 0, borderRadius: '4px' }}>
                          Redeem
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Rest — compact rows with thumbnail */}
        {rest.length > 0 && (
          <div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: '12px' }}>
              More deals
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rest.map((deal, i) => {
                const onCooldown = cooldowns[deal.id] !== undefined
                return (
                  <div
                    key={deal.id}
                    onClick={() => !onCooldown && setSelectedDeal(deal)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 0',
                      borderBottom: i < rest.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: onCooldown ? 'not-allowed' : 'pointer',
                      opacity: onCooldown ? 0.5 : 1,
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' }}>
                      <img
                        src={getPhoto(deal)}
                        alt={deal.business_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: '2px' }}>
                        {deal.business_name}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '2px' }}>{deal.deal_description}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-4)', fontWeight: 500 }}>{deal.address}</div>
                    </div>
                    {/* Action */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      {onCooldown ? (
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {formatCooldown(cooldowns[deal.id])}
                        </div>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
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