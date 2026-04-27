'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CATEGORY_OPTIONS,
  REDEMPTION_COOLDOWN_SECONDS,
  REDEMPTION_RULES,
  getCategoryMeta,
  getCooldownRemainingSeconds,
  normalizeCategory,
} from '@/lib/product'

type Schedule = {
  days: number[]
  start: string
  end: string
}

type Deal = {
  id: string
  business_name: string
  deal_description: string
  deal_details?: string
  category: string
  address: string
  emoji: string
  photo_url?: string
  featured?: boolean
  schedule: Schedule | null
}

type MemberProfile = {
  name: string | null
  phone: string | null
}

type BusinessGroup = {
  business_name: string
  category: string
  address: string
  photo_url?: string
  deals: Deal[]
}

function getMapsUrl(address: string): string {
  const encoded = encodeURIComponent(address)
  // maps:// is intercepted by iOS for Apple Maps; Android/desktop falls through to Google Maps
  return `https://maps.google.com/?q=${encoded}`
}

export default function MemberDeals() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [filter, setFilter] = useState('All')
  const [showLiveOnly, setShowLiveOnly] = useState(false)
  const [selectedWeekday, setSelectedWeekday] = useState<number>(new Date().getDay())
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const [userName, setUserName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.push('/member/login'); return }
      const email = userData.user.email!
      setMemberEmail(email)
      const storedFavorites = window.localStorage.getItem(`perkpass:favorites:${email}`)
      if (storedFavorites) {
        try {
          const parsed = JSON.parse(storedFavorites)
          if (Array.isArray(parsed)) {
            setFavoriteBusinesses(parsed.filter((name): name is string => typeof name === 'string'))
          }
        } catch {
          window.localStorage.removeItem(`perkpass:favorites:${email}`)
        }
      }
      const { data: memberData } = await supabase
        .from('members').select('name, phone').eq('email', email).limit(1)
      const member = memberData?.[0] as MemberProfile | undefined
      if (member?.name) setUserName(member.name.split(' ')[0])
      if (!member?.phone) {
        router.push('/signup')
        return
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
      if (dealsData) {
        setDeals(dealsData.map((deal) => ({ ...deal, category: normalizeCategory(deal.category) })))
      }
      const cooldownThreshold = new Date(Date.now() - REDEMPTION_COOLDOWN_SECONDS * 1000).toISOString()
      const { data: redemptions } = await supabase
        .from('redemptions').select('deal_id, redeemed_at')
        .eq('member_email', email).gte('redeemed_at', cooldownThreshold)
      if (redemptions) {
        const cdMap: Record<string, number> = {}
        redemptions.forEach(r => {
          if (!r.deal_id) return
          const s = getCooldownRemainingSeconds(r.redeemed_at)
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

  function toggleFavoriteBusiness(businessName: string) {
    if (!memberEmail) return
    setFavoriteBusinesses((current) => {
      const next = current.includes(businessName)
        ? current.filter((name) => name !== businessName)
        : [...current, businessName]
      window.localStorage.setItem(`perkpass:favorites:${memberEmail}`, JSON.stringify(next))
      return next
    })
  }

  function formatScheduleTime(t: string) {
    const [hh, mm] = t.split(':').map(Number)
    const ampm = hh >= 12 ? 'PM' : 'AM'
    return `${hh % 12 || 12}${mm ? ':' + String(mm).padStart(2,'0') : ''}${ampm}`
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

  function isDealAvailableOnDay(deal: Deal, day: number): boolean {
    if (!deal.schedule) return true
    return deal.schedule.days.includes(day)
  }

  function getNextAvailableDay(deal: Deal): number | null {
    if (!deal.schedule || deal.schedule.days.length === 0) return null
    const today = new Date().getDay()
    for (let offset = 0; offset < 7; offset += 1) {
      const day = (today + offset) % 7
      if (!deal.schedule.days.includes(day)) continue
      if (offset > 0) return day
      const now = new Date()
      const [sh, sm] = deal.schedule.start.split(':').map(Number)
      const nowMins = now.getHours() * 60 + now.getMinutes()
      const startMins = sh * 60 + sm
      if (nowMins < startMins) return day
    }
    return deal.schedule.days[0] ?? null
  }

  function getAvailabilityBadge(deal: Deal): { label: string; bg: string; color: string } {
    const now = new Date()
    const today = now.getDay()
    if (!deal.schedule) {
      return { label: 'Available anytime', bg: 'var(--bg-3)', color: 'var(--ink-3)' }
    }
    if (isScheduleActive(deal)) {
      return { label: 'Available now', bg: '#E8F8EF', color: 'var(--green-dk)' }
    }
    if (deal.schedule.days.includes(today)) {
      return {
        label: `Today ${formatScheduleTime(deal.schedule.start)}-${formatScheduleTime(deal.schedule.end)}`,
        bg: '#FFF3CD',
        color: '#92600A',
      }
    }
    const nextDay = getNextAvailableDay(deal)
    const dayLabel = nextDay === null ? 'Later this week' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][nextDay]
    return {
      label: `Next ${dayLabel} ${formatScheduleTime(deal.schedule.start)}`,
      bg: '#F2F4F7',
      color: 'var(--ink-3)',
    }
  }

  function scheduleLabel(deal: Deal): string {
    if (!deal.schedule) return ''
    const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const days = deal.schedule.days.map(d => DAY_LABELS[d])
    const dayStr = deal.schedule.days.length === 7 ? 'Daily' : days.join(', ')
    return `${dayStr} ${formatScheduleTime(deal.schedule.start)}–${formatScheduleTime(deal.schedule.end)}`
  }

  function getPhoto(deal: Deal) {
    return deal.photo_url || getCategoryMeta(deal.category).photo
  }

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

  const favoriteDealCount = deals.filter((deal) => favoriteBusinesses.includes(deal.business_name)).length
  const categories = [
    'All',
    ...(favoriteDealCount > 0 ? ['Favorites'] : []),
    ...CATEGORY_OPTIONS.filter(category => deals.some((deal) => deal.category === category)),
  ]
  const now = new Date()
  const currentDay = now.getDay()
  const currentDayLabel = now.toLocaleDateString('en-US', { weekday: 'long' })
  const dayTabs = Array.from({ length: 7 }, (_, day) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (day - currentDay))
    return {
      day,
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      fullLabel: date.toLocaleDateString('en-US', { weekday: 'long' }),
    }
  })
  const categoryFiltered = filter === 'All'
    ? deals
    : filter === 'Favorites'
      ? deals.filter(d => favoriteBusinesses.includes(d.business_name))
      : deals.filter(d => d.category === filter)
  const weekDeals = showLiveOnly
    ? categoryFiltered.filter((deal) => isDealAvailableOnDay(deal, currentDay) && isScheduleActive(deal))
    : categoryFiltered.filter((deal) => isDealAvailableOnDay(deal, selectedWeekday))
  const selectedWeekdayLabel = dayTabs.find(tab => tab.day === selectedWeekday)?.fullLabel ?? currentDayLabel

  function toggleLiveOnly() {
    setShowLiveOnly((current) => {
      const next = !current
      if (next) {
        setSelectedWeekday(currentDay)
      }
      return next
    })
  }

  // Reusable photo block with Option C frosted footer bar
  function BusinessPhotoBlock({
    group,
    firstDeal,
    hasMultiple,
    allOnCooldown,
    isFavorite,
    onToggleFavorite,
    onClick,
  }: {
    group: BusinessGroup
    firstDeal: Deal
    hasMultiple: boolean
    allOnCooldown: boolean
    isFavorite: boolean
    onToggleFavorite: () => void
    onClick: () => void
  }) {
    return (
      <div
        style={{ height: '180px', overflow: 'hidden', position: 'relative', cursor: allOnCooldown ? 'not-allowed' : 'pointer' }}
        onClick={onClick}
      >
        <img
          src={getPhoto(firstDeal)}
          alt={group.business_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
        {/* Category pill — top left */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'var(--ink)', color: 'var(--bg)',
          padding: '4px 10px', borderRadius: '3px',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '11px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em'
        }}>
          {group.category}
        </div>
        <button
          type="button"
          aria-label={isFavorite ? `Remove ${group.business_name} from favorites` : `Add ${group.business_name} to favorites`}
          onClick={(event) => {
            event.stopPropagation()
            onToggleFavorite()
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            border: 'none',
            borderRadius: '999px',
            background: isFavorite ? 'var(--green)' : 'rgba(15,15,15,0.78)',
            color: '#ffffff',
            padding: '7px 10px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          <span style={{ fontSize: '13px', lineHeight: 1 }}>{isFavorite ? '♥' : '♡'}</span>
          {isFavorite ? 'Saved' : 'Save'}
        </button>
        {/* Multi-deal badge — top right */}
        {hasMultiple && (
          <div style={{
            position: 'absolute', top: '50px', right: '12px',
            background: 'var(--green)', color: '#fff',
            padding: '4px 10px', borderRadius: '3px',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.04em'
          }}>
            {group.deals.length} deals
          </div>
        )}
        {/* Option C: frosted footer bar — always opaque, guaranteed contrast */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(15,15,15,0.84)',
          padding: '10px 14px 12px',
        }}>
          <div className="display" style={{
            fontSize: '20px', color: '#ffffff',
            lineHeight: 1.1, marginBottom: '3px'
          }}>
            {group.business_name}
          </div>
          <a
            href={getMapsUrl(group.address)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              fontSize: '12px',
              color: 'rgba(255,255,255,0.75)',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
            }}
          >
            📍 {group.address}
          </a>
        </div>
      </div>
    )
  }

  function renderDealGroupCard(group: BusinessGroup) {
    const firstDeal = group.deals[0]
    const hasMultiple = group.deals.length > 1
    const allOnCooldown = group.deals.every(d => cooldowns[d.id] !== undefined)
    const isFavorite = favoriteBusinesses.includes(group.business_name)

    return (
      <div key={group.business_name} style={{ background: 'var(--bg-2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', opacity: allOnCooldown ? 0.6 : 1 }}>
        <BusinessPhotoBlock
          group={group}
          firstDeal={firstDeal}
          hasMultiple={hasMultiple}
          allOnCooldown={allOnCooldown}
          isFavorite={isFavorite}
          onToggleFavorite={() => toggleFavoriteBusiness(group.business_name)}
          onClick={() => !allOnCooldown && !hasMultiple && setSelectedDeal(firstDeal)}
        />
        <div style={{ padding: hasMultiple ? '0' : '14px 16px' }}>
          {hasMultiple ? (
            <div>
              {group.deals.map((deal, i) => {
                const onCooldown = cooldowns[deal.id] !== undefined
                const availability = getAvailabilityBadge(deal)
                return (
                  <div
                    key={deal.id}
                    onClick={() => !onCooldown && setSelectedDeal(deal)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', cursor: onCooldown ? 'not-allowed' : 'pointer', borderBottom: i < group.deals.length - 1 ? '1px solid var(--border)' : 'none', opacity: onCooldown ? 0.5 : 1, transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!onCooldown) e.currentTarget.style.background = 'var(--bg-3)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '1px' }}>{deal.deal_description}</div>
                      {!onCooldown && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '999px', background: availability.bg, color: availability.color, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px', marginBottom: '4px' }}>
                          {availability.label}
                        </div>
                      )}
                      {!onCooldown && deal.schedule && (
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-4)' }}>
                          When: {scheduleLabel(deal)}
                        </div>
                      )}
                      {onCooldown && <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Back in {formatCooldown(cooldowns[deal.id])}</div>}
                    </div>
                    {!onCooldown && isScheduleActive(deal) && (
                      <div className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', flexShrink: 0, borderRadius: '4px' }}>Redeem</div>
                    )}
                    {!onCooldown && !isScheduleActive(deal) && (
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>View</div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-dk)', marginBottom: '3px' }}>{firstDeal.deal_description}</p>
                {cooldowns[firstDeal.id] === undefined && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '999px', background: getAvailabilityBadge(firstDeal).bg, color: getAvailabilityBadge(firstDeal).color, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    {getAvailabilityBadge(firstDeal).label}
                  </div>
                )}
                {firstDeal.schedule && (
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-4)', marginBottom: '3px' }}>When: {scheduleLabel(firstDeal)}</p>
                )}
                {cooldowns[firstDeal.id] !== undefined && (
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase' }}>Back in {formatCooldown(cooldowns[firstDeal.id])}</p>
                )}
              </div>
              {cooldowns[firstDeal.id] === undefined && (
                <div className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '14px', flexShrink: 0, borderRadius: '4px', cursor: 'pointer' }} onClick={() => setSelectedDeal(firstDeal)}>
                  {isScheduleActive(firstDeal) ? 'Redeem' : 'View'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderSection(title: string, subtitle: string, sectionDeals: Deal[]) {
    if (sectionDeals.length === 0) return null
    const groups = groupDeals(sectionDeals)
    const featuredGroups = groups.filter(g => g.deals.some(d => d.featured))
    const restGroups = groups.filter(g => g.deals.every(d => !d.featured))

    return (
      <section style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginBottom: '4px' }}>
            {title}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--ink-3)', fontWeight: 500 }}>{subtitle}</p>
        </div>
        {featuredGroups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: restGroups.length > 0 ? '12px' : 0 }}>
            {featuredGroups.map(renderDealGroupCard)}
          </div>
        )}
        {restGroups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {restGroups.map(renderDealGroupCard)}
          </div>
        )}
      </section>
    )
  }

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
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px' }}>Sign up to unlock Philly perks.</p>
          <Link href="/signup" className="btn btn-primary" style={{ width: '100%', fontSize: '17px', padding: '16px', display: 'flex', marginBottom: '12px' }}>
            Get PerkPass — from $3/month
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ width: '100%', background: 'none', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', cursor: 'pointer', padding: '8px' }}
          >
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
              {selectedDeal.deal_details && (
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '4px', lineHeight: 1.5 }}>
                  {selectedDeal.deal_details}
                </p>
              )}
              <a
                href={getMapsUrl(selectedDeal.address)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500, marginBottom: '20px', display: 'block', textDecoration: 'underline', textDecorationColor: 'var(--border)' }}
              >
                {selectedDeal.address}
              </a>
              <div style={{ background: 'var(--bg-2)', borderRadius: '8px', padding: '14px', marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {REDEMPTION_RULES.map((rule) => (
                  <div key={rule.label} style={{ textAlign: 'center' }}>
                    <div className="display" style={{ fontSize: '18px', color: 'var(--ink)' }}>{rule.value}</div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', marginTop: '2px' }}>{rule.label}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--ink)', marginBottom: '14px', textAlign: 'center' }}>
                Are you at {selectedDeal.business_name} right now?
              </p>
              {isScheduleActive(selectedDeal) ? (
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
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ padding: '28px 0 8px' }}>
          <h1 className="display" style={{ fontSize: 'clamp(36px, 8vw, 52px)', marginBottom: '4px' }}>
            {userName ? `Hey ${userName}.` : 'Your deals.'}
          </h1>
          <button
            onClick={toggleLiveOnly}
            style={{
              width: 'fit-content',
              marginTop: '14px',
              border: '1px solid',
              borderColor: showLiveOnly ? 'rgba(95,160,97,0.4)' : 'var(--border)',
              borderRadius: '999px',
              background: showLiveOnly ? '#f6f1e4' : 'var(--bg-2)',
              color: 'var(--ink)',
              padding: '10px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              textAlign: 'left',
            }}
          >
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: showLiveOnly ? 'var(--green-dk)' : 'var(--ink)',
            }}>
              Live deals now
            </div>
            <div style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
            }}>
              <div style={{
                width: '42px',
                height: '24px',
                borderRadius: '999px',
                background: showLiveOnly ? 'var(--green)' : '#d8d1bf',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '999px',
                  background: 'var(--bg)',
                  transform: showLiveOnly ? 'translateX(18px)' : 'translateX(0)',
                  transition: 'transform 160ms ease',
                }} />
              </div>
            </div>
          </button>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 0 10px', scrollbarWidth: 'none' }}>
            {dayTabs.map(tab => (
              <button
                key={tab.day}
                onClick={() => {
                  setSelectedWeekday(tab.day)
                  setShowLiveOnly(false)
                }}
                style={{
                  flexShrink: 0,
                  minWidth: '74px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: selectedWeekday === tab.day ? '2px solid var(--ink)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: selectedWeekday === tab.day ? 'var(--bg)' : 'var(--bg-2)',
                  color: selectedWeekday === tab.day ? 'var(--ink)' : 'var(--ink-3)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--ink-3)', fontWeight: 500 }}>
            {showLiveOnly
              ? 'Showing deals customers can redeem right now.'
              : `Showing deals scheduled for ${selectedWeekdayLabel}.`}
          </p>
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '16px 0 20px', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: filter === cat ? 'var(--ink)' : 'var(--bg-2)',
                color: filter === cat ? 'var(--bg)' : 'var(--ink-3)',
              }}
            >
              {cat === 'Favorites' && <span style={{ marginRight: '4px' }}>♥</span>}
              {cat !== 'All' && cat !== 'Favorites' && <span style={{ marginRight: '4px' }}>{getCategoryMeta(cat).emoji}</span>}
              {cat}
            </button>
          ))}
        </div>

        {renderSection(
          showLiveOnly ? 'Live now' : selectedWeekday === currentDay ? 'Today' : selectedWeekdayLabel,
          showLiveOnly ? 'Browse deals customers can redeem right now.' : `Browse what is scheduled for ${selectedWeekdayLabel}.`,
          weekDeals,
        )}

        {weekDeals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div className="display" style={{ fontSize: '32px', marginBottom: '8px' }}>Nothing in this window yet.</div>
            <p style={{ fontSize: '14px', color: 'var(--ink-4)', fontWeight: 500 }}>
              Try another day or category to see more active deals.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
