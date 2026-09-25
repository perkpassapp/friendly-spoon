import Link from 'next/link'
import Image from 'next/image'
import { connection } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCategoryMeta, normalizeCategory } from '@/lib/product'

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  Dessert: { bg: '#ffe5d1', color: '#ae5d17' },
}

type LiveDeal = {
  id: string
  business_name: string
  deal_description: string
  category: string
  address: string
  photo_url?: string | null
  schedule?: {
    days?: number[]
    start?: string
    end?: string
  } | null
}

const SNEAK_PEEK_EXCLUDED_BUSINESSES = new Set([
  'koto sushi - hibachi catering',
])

const SNEAK_PEEK_PRIORITY_BUSINESSES = [
  'mocha melt cafe',
  'prince tea house',
]

const FAQS = [
  {
    question: 'How does PerkPass work?',
    answer: 'Join monthly for $3, browse member-only Philly perks, then show a short redemption code when you visit a participating local business.',
  },
  {
    question: 'Why is PerkPass so affordable?',
    answer: 'We keep PerkPass affordable on purpose. The goal is simple: help more people enjoy local deals, discover new favorites, and support neighborhood businesses without overthinking the cost.',
  },
  {
    question: 'How does PerkPass get quality local deals?',
    answer: 'We work closely with Philly-area businesses that care about giving locals a great experience, not just a random discount. Every perk is shaped with the business so the offer feels worthwhile for members, clear at checkout, and supportive of the local spots people want to come back to.',
  },
  {
    question: 'How do I redeem a deal?',
    answer: 'Tap a deal, confirm you are at the business, and show your code at checkout. Codes are time-sensitive, so you will have 2 minutes to show it, then that deal enters a short cooldown before you can redeem it again.',
  },
]

const CREATORS = [
  {
    handle: '@citybitesdaily',
    title: 'Neighborhood food finds with real community pull',
    body: 'We love creators who spotlight underrated local spots, tell the story behind the people running them, and send real support back into the neighborhood.',
    stats: 'Foodie picks • Small biz champion',
  },
  {
    handle: '@phillyafterfive',
    title: 'The go-to for date night, coffee runs, and casual city gems',
    body: 'The best collabs feel useful. Think honest recommendations, good taste, and a feed that helps people discover where to spend locally.',
    stats: 'Cafe culture • Dinner recs',
  },
  {
    handle: '@supportlocalphl',
    title: 'Creators who make local business feel personal',
    body: 'We are especially into creators who highlight owners, community events, neighborhood energy, and the kinds of places people want to come back to.',
    stats: 'Community voice • Local impact',
  },
]

const SHOW_CREATOR_COLLABS = false

function ArrowUpRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 12L12 4M6 4H12V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function isDealLiveNow(deal: LiveDeal, now: Date) {
  if (!deal.schedule) return true
  const days = Array.isArray(deal.schedule.days) ? deal.schedule.days : []
  if (!days.includes(now.getDay())) return false
  const start = deal.schedule.start
  const end = deal.schedule.end
  if (!start || !end) return true
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

function buildSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function loadSneakPeekDeals(): Promise<LiveDeal[]> {
  const supabase = buildSupabaseClient()
  if (!supabase) return []

  const [{ data: deals, error: dealsError }, { data: applications, error: applicationsError }] = await Promise.all([
    supabase
      .from('deals')
      .select('id, business_name, deal_description, category, address, photo_url, schedule')
      .eq('active', true)
      .eq('admin_disabled', false)
      .order('created_at'),
    supabase
      .from('business_applications')
      .select('business_name, status'),
  ])

  if (dealsError || applicationsError) return []

  const pendingBusinesses = new Set(
    (applications || [])
      .filter((application) => (application.status || 'pending') === 'pending')
      .map((application) => application.business_name.trim().toLowerCase()),
  )

  const now = new Date()
  const priorityOrder = new Map(
    SNEAK_PEEK_PRIORITY_BUSINESSES.map((business, index) => [business, index]),
  )

  return ((deals || []) as LiveDeal[])
    .filter((deal) => !pendingBusinesses.has(deal.business_name.trim().toLowerCase()))
    .filter((deal) => !SNEAK_PEEK_EXCLUDED_BUSINESSES.has(deal.business_name.trim().toLowerCase()))
    .filter((deal) => isDealLiveNow(deal, now))
    .sort((left, right) => {
      const leftName = left.business_name.trim().toLowerCase()
      const rightName = right.business_name.trim().toLowerCase()
      const leftPriority = priorityOrder.get(leftName)
      const rightPriority = priorityOrder.get(rightName)

      if (leftPriority !== undefined && rightPriority !== undefined) {
        return leftPriority - rightPriority
      }
      if (leftPriority !== undefined) return -1
      if (rightPriority !== undefined) return 1
      return left.business_name.localeCompare(right.business_name)
    })
    .slice(0, 5)
}

export default async function Home() {
  await connection()
  const liveDeals = await loadSneakPeekDeals()
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <style>{`
        .deal-card { background: var(--bg-2); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
        .deal-card-img { width: 100%; height: 120px; object-fit: cover; display: block; }
        .deal-card-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .quick-link { background: var(--bg-2); border: 1px solid var(--border-2); border-radius: 8px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; text-align: left; width: 100%; transition: border-color 0.15s; }
        .quick-link:hover { border-color: var(--green); }
        .preview-kicker { display: inline-flex; align-items: center; gap: 8px; background: var(--green-lt); color: var(--green-dk); padding: 4px 12px; border-radius: 999px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px; }
        .preview-meta-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px; }
        .preview-meta-card { background: var(--bg-2); border-radius: 10px; padding: 14px 14px 12px; }
        .preview-meta-label { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-4); margin-bottom: 6px; }
        .preview-meta-value { font-size: 14px; font-weight: 700; color: var(--ink); line-height: 1.3; }
        .preview-category-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
        .preview-category-pill { display: inline-flex; align-items: center; gap: 6px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 999px; padding: 7px 12px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-3); }
        .preview-category-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--green); flex-shrink: 0; }
        .deal-showcase { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(240px, 0.85fr); gap: 14px; margin-bottom: 24px; }
        .deal-feature { background: var(--bg-2); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; min-height: 100%; display: flex; flex-direction: column; }
        .deal-feature-media { position: relative; }
        .deal-feature-image { width: 100%; height: 260px; object-fit: cover; display: block; }
        .deal-feature-body { padding: 18px 18px 20px; display: flex; flex-direction: column; gap: 10px; }
        .deal-badge-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .deal-live-chip { display: inline-flex; align-items: center; gap: 6px; background: var(--forest); color: var(--bg); border-radius: 999px; padding: 5px 10px; font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .deal-live-dot { width: 7px; height: 7px; border-radius: 999px; background: var(--green); flex-shrink: 0; }
        .deal-feature-title { font-family: 'Barlow Condensed', sans-serif; font-size: clamp(30px, 5vw, 40px); font-weight: 900; color: var(--ink); line-height: 0.98; letter-spacing: -0.02em; }
        .deal-feature-offer { font-size: 22px; font-weight: 800; color: var(--green-dk); line-height: 1.18; }
        .deal-feature-meta { display: flex; flex-wrap: wrap; gap: 8px 12px; font-size: 13px; font-weight: 700; color: var(--ink-4); }
        .deal-feature-value { background: var(--green-lt); color: var(--green-dk); border-radius: 999px; padding: 6px 11px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; align-self: flex-start; }
        .deal-stack { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .deal-compact { background: var(--bg-2); border: 1px solid var(--border); border-radius: 14px; padding: 15px 15px 16px; display: flex; flex-direction: column; gap: 8px; }
        .deal-compact-title { font-family: 'Barlow Condensed', sans-serif; font-size: 24px; font-weight: 900; color: var(--ink); line-height: 1; letter-spacing: -0.015em; }
        .deal-compact-offer { font-size: 16px; font-weight: 800; color: var(--green-dk); line-height: 1.25; }
        .deal-compact-address { font-size: 13px; font-weight: 600; color: var(--ink-4); line-height: 1.4; }
        .trust-strip { border-bottom: 2px solid var(--ink); background: var(--bg-2); padding: 18px 24px; }
        .trust-strip-inner { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .trust-item { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: var(--ink-3); }
        .trust-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
        .faq-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .faq-card { background: var(--bg-2); border-radius: 12px; padding: 20px; }
        .creator-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 14px; }
        .creator-card { background: var(--bg-2); border-radius: 14px; padding: 22px; }
        .creator-stack { display: grid; grid-template-columns: 1fr; gap: 14px; }
        .lifestyle-section { padding: 72px 24px; border-top: 2px solid var(--ink); background: var(--bg-2); }
        .lifestyle-wrap { max-width: 1080px; margin: 0 auto; }
        .lifestyle-intro { max-width: 680px; margin-bottom: 28px; }
        .lifestyle-hero { height: clamp(280px, 38vw, 430px); overflow: hidden; border-radius: 18px; }
        .lifestyle-image { width: 100%; height: 100%; object-fit: cover; display: block; }
        .lifestyle-hero .lifestyle-image { object-position: center 48%; }
        .lifestyle-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
        .lifestyle-fact { min-height: 170px; padding: 22px; border-radius: 12px; background: var(--bg); }
        .lifestyle-fact-title { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 900; line-height: 1; text-transform: uppercase; margin-bottom: 12px; }
        .lifestyle-fact-copy { max-width: 250px; color: var(--ink-3); font-size: 15px; font-weight: 500; line-height: 1.5; }
        .lifestyle-support { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 48px; }
        .lifestyle-support-image { height: 280px; overflow: hidden; border-radius: 16px; }
        .lifestyle-support-copy { padding: 18px 4px 0; }
        .lifestyle-support-title { font-family: 'Barlow Condensed', sans-serif; font-size: 30px; font-weight: 900; line-height: 1; text-transform: uppercase; margin-bottom: 9px; }
        .lifestyle-support-text { max-width: 430px; color: var(--ink-3); font-size: 15px; font-weight: 500; line-height: 1.55; }
        .redemption-section { position: relative; overflow: hidden; padding: 82px 24px; border-top: 2px solid var(--ink); background: var(--bg-3); }
        .redemption-section::before { content: ''; position: absolute; width: 420px; height: 420px; border-radius: 999px; right: -110px; top: -170px; background: var(--green); opacity: 0.22; }
        .redemption-section::after { content: ''; position: absolute; width: 220px; height: 220px; border-radius: 999px; left: -80px; bottom: -120px; border: 42px solid rgba(26,46,26,0.05); }
        .redemption-grid { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(340px, 1.05fr); gap: 56px; align-items: center; }
        .redemption-title { max-width: 520px; font-family: 'Barlow Condensed', sans-serif; font-size: clamp(52px, 8vw, 86px); font-weight: 900; line-height: 0.9; letter-spacing: -0.035em; text-transform: uppercase; color: var(--ink); margin-bottom: 32px; }
        .redemption-benefits { display: grid; gap: 10px; }
        .redemption-benefit { display: grid; grid-template-columns: 36px 1fr; gap: 13px; align-items: center; padding: 15px; border: 1px solid rgba(26,46,26,0.2); border-radius: 12px; background: var(--bg-2); }
        .redemption-benefit-mark { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; background: var(--forest); color: var(--green); font-family: 'Barlow Condensed', sans-serif; font-size: 17px; font-weight: 900; }
        .redemption-benefit-title { color: var(--ink); font-size: 14px; font-weight: 800; margin-bottom: 2px; }
        .redemption-benefit-copy { color: var(--ink-3); font-size: 13px; line-height: 1.45; }
        .redemption-stage { position: relative; min-height: 520px; display: grid; place-items: center; }
        .redemption-stage::before { content: ''; position: absolute; width: 410px; height: 410px; border-radius: 50%; background: var(--green); opacity: 0.28; }
        .redemption-card { position: relative; z-index: 2; width: min(100%, 390px); overflow: hidden; border: 2px solid var(--forest); border-radius: 28px; background: var(--bg-2); box-shadow: 0 24px 56px rgba(26,46,26,0.22); }
        .redemption-card-top { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--border-2); }
        .redemption-card-brand { font-family: 'Barlow Condensed', sans-serif; font-size: 19px; font-weight: 900; color: var(--forest); text-transform: uppercase; }
        .redemption-card-close { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 999px; background: var(--bg-2); color: var(--ink-3); font-size: 18px; }
        .redemption-card-body { padding: 28px 24px 24px; text-align: center; }
        .redemption-business { font-size: 13px; font-weight: 800; color: var(--green-dk); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 9px; }
        .redemption-offer { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 900; line-height: 1; color: var(--ink); text-transform: uppercase; margin-bottom: 24px; }
        .redemption-code-label { font-size: 12px; font-weight: 700; color: var(--ink-4); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        .redemption-code { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 16px; }
        .redemption-code-letter { display: grid; place-items: center; aspect-ratio: 1; border-radius: 9px; background: var(--forest); color: var(--green); font-family: 'Barlow Condensed', sans-serif; font-size: 27px; font-weight: 900; }
        .redemption-timer { color: var(--ink-3); font-size: 13px; font-weight: 700; margin-bottom: 20px; }
        .redemption-timer strong { color: var(--green-dk); }
        .redemption-status { display: flex; align-items: center; justify-content: center; gap: 9px; padding: 13px 16px; border: 2px solid var(--forest); border-radius: 10px; background: var(--green); color: var(--forest); font-family: 'Barlow Condensed', sans-serif; font-size: 15px; font-weight: 900; letter-spacing: 0.04em; text-transform: uppercase; }
        .redemption-status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--forest); }
        .home-hero { position: relative; overflow: hidden; padding: 64px 24px 56px; border-bottom: 2px solid var(--ink); background: var(--bg); }
        .home-hero-inner { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(280px, 0.82fr); gap: 42px; align-items: center; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--ink); color: var(--bg); padding: 6px 11px; border-radius: 999px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 20px; }
        .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 30px; }
        .hero-proof { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; max-width: 620px; }
        .hero-proof-card { background: rgba(255,255,255,0.62); border: 1px solid rgba(15,15,15,0.12); border-radius: 12px; padding: 14px 14px 12px; backdrop-filter: blur(10px); }
        .hero-visual { position: relative; min-height: 430px; }
        .hero-phone { position: relative; z-index: 2; width: min(100%, 330px); margin-left: auto; background: var(--forest); border: 2px solid var(--ink); border-radius: 30px; padding: 14px; box-shadow: 10px 12px 0 rgba(15,15,15,0.1); }
        .hero-phone-screen { background: var(--bg-2); border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.18); }
        .hero-phone-top { padding: 16px 16px 10px; background: var(--forest); color: #fff; }
        .hero-mini-card { background: var(--bg); border: 1px solid var(--border-2); border-radius: 12px; padding: 12px; margin: 8px; }
        .hero-float { position: absolute; z-index: 3; background: var(--bg); border: 2px solid var(--ink); border-radius: 14px; padding: 13px; box-shadow: 6px 8px 0 rgba(15,15,15,0.12); }
        .hero-float-left { left: 4px; top: 64px; max-width: 170px; }
        .hero-float-right { right: 0; bottom: 34px; max-width: 180px; }
        .hero-shape { position: absolute; z-index: 1; border-radius: 999px; background: var(--green); opacity: 0.25; }
        .hero-shape-one { width: 180px; height: 180px; right: 18px; top: 18px; }
        .hero-shape-two { width: 110px; height: 110px; left: 34px; bottom: 50px; background: var(--green-lt); }
        @media (max-width: 900px) {
          .preview-meta-grid { grid-template-columns: 1fr; }
          .deal-showcase { grid-template-columns: 1fr; }
          .trust-strip-inner { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .faq-grid { grid-template-columns: 1fr; }
          .creator-grid { grid-template-columns: 1fr; }
          .lifestyle-facts { grid-template-columns: 1fr; }
          .lifestyle-fact { min-height: auto; }
          .lifestyle-support { grid-template-columns: 1fr; }
          .redemption-grid { grid-template-columns: 1fr; gap: 42px; }
          .redemption-copy { max-width: 600px; }
          .redemption-stage { min-height: 500px; }
          .home-hero { padding: 48px 20px 42px; }
          .home-hero-inner { grid-template-columns: 1fr; gap: 36px; }
          .hero-proof { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .hero-visual { min-height: auto; }
          .hero-phone { margin: 0 auto; box-shadow: 8px 10px 0 rgba(15,15,15,0.1); }
          .hero-float { display: none; }
        }
        @media (max-width: 560px) {
          .hero-actions .btn { width: 100%; justify-content: center; }
          .hero-proof { grid-template-columns: 1fr 1fr; }
          .hero-proof-card { padding: 12px; }
          .trust-strip-inner { grid-template-columns: 1fr; }
          .hero-phone { border-radius: 26px; padding: 12px; }
          .hero-phone-screen { border-radius: 18px; }
          .lifestyle-section { padding: 56px 20px; }
          .lifestyle-hero { height: 260px; border-radius: 14px; }
          .lifestyle-support { margin-top: 38px; }
          .lifestyle-support-image { height: 240px; border-radius: 14px; }
          .redemption-section { padding: 64px 20px; }
          .redemption-stage { min-height: 440px; }
          .redemption-card { width: min(94%, 360px); box-shadow: 0 18px 42px rgba(26,46,26,0.2); }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', background: 'var(--bg)', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo"><span className="pp-logo-perk">Perk</span><span className="pp-logo-pass">Pass</span></Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/member/login" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink-3)', textDecoration: 'none', padding: '8px 12px' }}>
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary" style={{ fontSize: '15px', padding: '10px 20px' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div>
            <div className="hero-badge fade-up">
              Philly perks, made easy
            </div>
            <h1 className="display fade-up-2" style={{ fontSize: 'clamp(44px, 7.4vw, 84px)', marginBottom: '20px', lineHeight: 0.94, letterSpacing: '-0.035em' }}>
              Your <span style={{ color: 'var(--green)' }}>Philly favorites.</span> Member perks. One place.
            </h1>
            <p className="fade-up-3" style={{ fontSize: 'clamp(17px, 2vw, 20px)', fontWeight: 600, color: 'var(--ink-2)', maxWidth: '560px', marginBottom: '14px', lineHeight: 1.45 }}>
              PerkPass brings Philly restaurants, cafes, gyms, self-care spots, and neighborhood gems into one simple local membership.
            </p>
            <p className="fade-up-3" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '520px', marginBottom: '30px', lineHeight: 1.65 }}>
              Open the app, pick a perk, show your code, and save. No clipping coupons. No awkward checkout math. Just Philly perks you actually want to use.
            </p>
            <div className="hero-actions fade-up-4">
              <Link href="/signup" className="btn btn-primary" style={{ fontSize: '17px', padding: '15px 28px' }}>
                Start saving for $3/mo
              </Link>
              <Link href="#sneak-peek" className="btn btn-outline" style={{ fontSize: '17px', padding: '15px 28px' }}>
                See live deals
              </Link>
            </div>
            <div className="hero-proof">
              {[
                { n: '$3', l: 'Monthly access' },
                { n: 'Fresh', l: 'Deals rotate' },
                { n: 'Fast', l: 'Code redemption' },
                { n: 'Philly', l: 'Born locally' },
              ].map(s => (
                <div key={s.l} className="hero-proof-card">
                  <div className="display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--green)', lineHeight: 1, whiteSpace: 'nowrap' }}>{s.n}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-3)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-label="PerkPass app preview">
            <div className="hero-shape hero-shape-one" />
            <div className="hero-shape hero-shape-two" />
            <div className="hero-float hero-float-left">
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 800, color: 'var(--green-dk)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Today&apos;s move</div>
              <div className="display" style={{ fontSize: '23px', lineHeight: 1 }}>Coffee, lunch, gym.</div>
            </div>
            <div className="hero-phone">
              <div className="hero-phone-screen">
                <div className="hero-phone-top">
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green)', marginBottom: '8px' }}>Member deals</div>
                  <div className="display" style={{ fontSize: '28px', color: '#fff', lineHeight: 1 }}>Good for today.</div>
                </div>
                {[
                  { tag: 'Cafe • Fishtown', title: '$2 off any espresso drink', status: 'Available now' },
                  { tag: 'Restaurant • Center City', title: 'Free side with entree', status: 'Today 2-5PM' },
                  { tag: 'Fitness • Old City', title: '15% off first class pack', status: 'This week' },
                ].map((card) => (
                  <div key={card.title} className="hero-mini-card">
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 800, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{card.tag}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green-dk)', lineHeight: 1.25, marginBottom: '10px' }}>{card.title}</div>
                    <div style={{ display: 'inline-flex', background: 'var(--green-lt)', color: 'var(--green-dk)', borderRadius: '999px', padding: '4px 9px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.status}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-float hero-float-right">
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 800, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Redeem in seconds</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {['P', 'K', '7'].map((letter) => (
                  <div key={letter} className="display" style={{ background: 'var(--forest)', color: 'var(--green)', borderRadius: '8px', padding: '10px 0', textAlign: 'center', fontSize: '28px' }}>{letter}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="trust-strip-inner">
          {['Secure checkout by Stripe', 'No hidden fees', 'Philly-born and local-first'].map((item) => (
            <div key={item} className="trust-item">
              <span className="trust-dot" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Deals — card grid */}
      <section id="sneak-peek" style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <div className="preview-kicker">Inside the app</div>
            <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)' }}>
              Live right now
            </h2>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '560px', lineHeight: 1.6 }}>
              See the kinds of offers people can actually use the minute they join. This board updates throughout the week, so the lineup always feels fresh.
            </p>
          </div>

          <div className="preview-meta-grid">
            <div className="preview-meta-card">
              <div className="preview-meta-label">Live now</div>
              <div className="preview-meta-value"><span style={{ color: 'var(--green)', fontWeight: 900 }}>35+</span> current offers on the board</div>
            </div>
            <div className="preview-meta-card">
              <div className="preview-meta-label">Categories</div>
              <div className="preview-meta-value">Coffee, food, dessert, fitness, and neighborhood favorites</div>
            </div>
            <div className="preview-meta-card">
              <div className="preview-meta-label">Redeem</div>
              <div className="preview-meta-value">Open the app, show your code, and save in seconds</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {liveDeals.map((d) => {
              const normalizedCategory = normalizeCategory(d.category)
              const categoryMeta = getCategoryMeta(d.category)
              const colors = CAT_COLORS[d.category] || categoryMeta.color || { bg: 'var(--bg-2)', color: 'var(--ink-3)' }
              const photo = d.photo_url || categoryMeta.photo
              return (
                <div key={d.id} className="deal-card">
                  {photo && (
                    <div style={{ position: 'relative' }}>
                      <Image
                        src={photo}
                        alt={d.business_name}
                        className="deal-card-img"
                        width={1200}
                        height={675}
                        sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 240px"
                        quality={72}
                        loading="lazy"
                      />
                      <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--ink)', color: 'var(--bg)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '3px' }}>
                        Live now
                      </span>
                    </div>
                  )}
                  <div className="deal-card-body">
                    <span style={{ display: 'inline-block', alignSelf: 'flex-start', background: colors.bg, color: colors.color, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: '4px' }}>
                      {d.category === 'Dessert' ? d.category : normalizedCategory}
                    </span>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                      {d.business_name}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-dk)', lineHeight: 1.35 }}>
                      {d.deal_description}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-4)', lineHeight: 1.45 }}>
                      {d.address}
                    </div>
                  </div>
                </div>
              )
            })}
            <Link href="/for-business" style={{ textDecoration: 'none' }}>
              <div
                className="deal-card"
                style={{
                  background: 'var(--bg-2)',
                  border: '1.5px solid var(--forest)',
                  minHeight: '220px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '999px',
                    background: 'var(--green-lt)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '16px',
                    fontWeight: 800,
                    color: 'var(--green-dk)',
                  }}
                >
                  ↗
                </div>
                <div className="deal-card-body" style={{ justifyContent: 'center', gap: '16px', padding: '22px 18px 22px' }}>
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      background: 'var(--green-lt)',
                      color: 'var(--green-dk)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '4px 10px',
                      borderRadius: '999px',
                    }}
                  >
                    For business owners
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '26px', fontWeight: 900, color: 'var(--forest)', lineHeight: 1.05, maxWidth: '14ch' }}>
                    Wanna partner up? Let&apos;s do it.
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-3)', lineHeight: 1.5, maxWidth: '30ch' }}>
                    Put your business in front of locals already looking for their next favorite Philly spot.
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      alignSelf: 'flex-start',
                      color: 'var(--green-dk)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '15px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <span>Apply now</span>
                    <span style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center' }}>
                      <ArrowUpRightIcon />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-4)', marginBottom: '20px', lineHeight: 1.6 }}>
            Offers rotate throughout the week, so the live board changes as new spots come online and time windows open up.
          </p>
          <div>
            <Link href="/signup" className="btn btn-primary" style={{ fontSize: '17px' }}>
              Unlock Philly perks — $3/month
            </Link>
          </div>
        </div>
      </section>

      {/* Lifestyle */}
      <section className="lifestyle-section">
        <div className="lifestyle-wrap">
          <div className="lifestyle-intro">
            <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '12px' }}>
              More reasons to go out.
            </h2>
            <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '590px', lineHeight: 1.65 }}>
              PerkPass makes it easier to try a new neighborhood spot, revisit an old favorite, or turn an ordinary day into a plan.
            </p>
          </div>

          <div className="lifestyle-hero">
            <Image
              src="/perkpass-lifestyle-dining.png"
              alt="Friends sharing a meal at a neighborhood restaurant"
              className="lifestyle-image"
              width={1122}
              height={1402}
              sizes="(max-width: 1120px) 100vw, 1080px"
              quality={75}
              loading="lazy"
            />
          </div>

          <div className="lifestyle-facts">
            <div className="lifestyle-fact">
              <div className="lifestyle-fact-title">One membership</div>
              <p className="lifestyle-fact-copy">Food, fitness, self-care, and neighborhood experiences in one place.</p>
            </div>
            <div className="lifestyle-fact">
              <div className="lifestyle-fact-title">$3 a month</div>
              <p className="lifestyle-fact-copy">Low commitment by design, with no annual contract and the freedom to cancel.</p>
            </div>
            <div className="lifestyle-fact">
              <div className="lifestyle-fact-title">Easy to use</div>
              <p className="lifestyle-fact-copy">Choose a deal, visit the business, and show your redemption code at checkout.</p>
            </div>
          </div>

          <div className="lifestyle-support">
            <article>
              <div className="lifestyle-support-image">
                <Image
                  src="/perkpass-lifestyle-cafe.png"
                  alt="Friends enjoying coffee and pastries on a Philadelphia sidewalk"
                  className="lifestyle-image"
                  width={1122}
                  height={1402}
                  sizes="(max-width: 900px) 100vw, 50vw"
                  quality={75}
                  loading="lazy"
                />
              </div>
              <div className="lifestyle-support-copy">
                <h3 className="lifestyle-support-title">Make the usual feel new.</h3>
                <p className="lifestyle-support-text">A coffee run, lunch break, or quick catch-up can become the best part of the day.</p>
              </div>
            </article>
            <article>
              <div className="lifestyle-support-image">
                <Image
                  src="/perkpass-lifestyle-city.png"
                  alt="Friends enjoying a walk through a Philadelphia neighborhood"
                  className="lifestyle-image"
                  width={1122}
                  height={1402}
                  sizes="(max-width: 900px) 100vw, 50vw"
                  quality={75}
                  loading="lazy"
                />
              </div>
              <div className="lifestyle-support-copy">
                <h3 className="lifestyle-support-title">Keep it local.</h3>
                <p className="lifestyle-support-text">Discover independent Philadelphia businesses and spend more time in the neighborhoods you love.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '64px 24px', borderTop: '2px solid var(--ink)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <div className="preview-kicker">Quick answers</div>
            <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '10px' }}>
              FAQ
            </h2>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '520px', lineHeight: 1.6 }}>
              PerkPass is designed to be simple: join, browse, redeem, save.
            </p>
          </div>
          <div className="faq-grid">
            {FAQS.map((faq) => (
              <div key={faq.question} className="faq-card">
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1, marginBottom: '8px' }}>
                  {faq.question}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {SHOW_CREATOR_COLLABS && (
        <section style={{ padding: '64px 24px', borderTop: '2px solid var(--ink)' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <div className="preview-kicker">Creator collabs</div>
              <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '10px' }}>
                The local voices we love.
              </h2>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '560px', lineHeight: 1.6 }}>
                We want to feature our favorite IG foodies and community-driven creators who hype up great local businesses, bring real eyes to neighborhood gems, and do good for the city.
              </p>
            </div>

            <div className="creator-grid" style={{ marginBottom: '24px' }}>
              <div className="creator-card" style={{ background: 'var(--forest)', color: '#ffffff', borderColor: 'var(--forest)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', color: 'var(--green)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                  Community spotlight
                </div>
                <div className="display" style={{ fontSize: 'clamp(34px, 7vw, 52px)', color: '#ffffff', marginBottom: '14px' }}>
                  Creator Collab
                </div>
                <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'rgba(255,255,255,0.76)', marginBottom: '20px' }}>
                  PerkPass is built for the people already putting the city on. Foodies, storytellers, and neighborhood champions who help locals discover where to eat, shop, and show up.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {['Local businesses', 'Community impact', 'Neighborhood culture'].map((item) => (
                    <span
                      key={item}
                      style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <a
                  href="mailto:hello@getperkpass.com?subject=PerkPass%20Creator%20Collab"
                  className="btn"
                  style={{ background: '#ffffff', color: 'var(--forest)', fontSize: '15px', padding: '12px 18px' }}
                >
                  Pitch a creator
                </a>
              </div>

              <div className="creator-stack">
                {CREATORS.map((creator) => (
                  <div key={creator.handle} className="creator-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                        {creator.handle}
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-dk)', background: 'var(--green-lt)', padding: '4px 8px', borderRadius: '999px' }}>
                        Creator vibe
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: 900, color: 'var(--ink)', lineHeight: 1.05, marginBottom: '10px' }}>
                      {creator.title}
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: '14px' }}>
                      {creator.body}
                    </p>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {creator.stats}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="redemption-section">
        <div className="redemption-grid">
          <div>
            <h2 className="redemption-title">Your perk, ready at checkout.</h2>
            <div className="redemption-benefits">
              <div className="redemption-benefit">
                <span className="redemption-benefit-mark">↗</span>
                <div>
                  <div className="redemption-benefit-title">One tap when you are ready</div>
                  <div className="redemption-benefit-copy">Your code appears right inside the deal.</div>
                </div>
              </div>
              <div className="redemption-benefit">
                <span className="redemption-benefit-mark">ABC</span>
                <div>
                  <div className="redemption-benefit-title">Built for the counter</div>
                  <div className="redemption-benefit-copy">Six bold characters are easy to show and verify.</div>
                </div>
              </div>
              <div className="redemption-benefit">
                <span className="redemption-benefit-mark">✓</span>
                <div>
                  <div className="redemption-benefit-title">No coupon clutter</div>
                  <div className="redemption-benefit-copy">No printing, screenshots, or checkout math.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="redemption-stage" aria-label="Example PerkPass redemption screen">
            <div className="redemption-card">
              <div className="redemption-card-top">
                <div className="redemption-card-brand">PerkPass</div>
                <div className="redemption-card-close" aria-hidden="true">×</div>
              </div>
              <div className="redemption-card-body">
                <div className="redemption-business">Neighborhood café</div>
                <div className="redemption-offer">Your member perk is ready</div>
                <div className="redemption-code-label">Show this code at checkout</div>
                <div className="redemption-code" aria-label="Example code PERKUP">
                  {'PERKUP'.split('').map((letter, index) => (
                    <span key={`${letter}-${index}`} className="redemption-code-letter">{letter}</span>
                  ))}
                </div>
                <div className="redemption-timer">Code expires in <strong>1:48</strong></div>
                <div className="redemption-status"><span className="redemption-status-dot" aria-hidden="true" />Ready to redeem</div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
