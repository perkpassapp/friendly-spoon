import Link from 'next/link'
import { getCategoryMeta, normalizeCategory } from '@/lib/product'

const DEALS = [
  { name: 'La Colombe', offer: '$2 off any espresso drink before 11am', cat: 'Cafe', area: 'Fishtown', tag: 'Morning favorite', featured: true },
  { name: 'Mango Mango Dessert', offer: 'Free topping on any dessert order', cat: 'Dessert', area: 'Chinatown', tag: 'After dinner', featured: false },
  { name: 'Earn Everything Gym', offer: '15% off your first class pack', cat: 'Fitness', area: 'Center City', tag: 'Lunch break', featured: false },
  { name: 'Top Design Nails And Jewelry', offer: '$10 off any service over $50', cat: 'Nails', area: 'Old City', tag: 'Weekend reset', featured: false },
  { name: 'Suraya', offer: 'Free mezze add-on with entree purchase', cat: 'Restaurant', area: 'Fishtown', tag: 'Popular dinner spot', featured: false },
]

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  Dessert: { bg: '#ffe5d1', color: '#ae5d17' },
}

const HOW = [
  { num: '01', title: 'Sign up for $3/month',  body: 'Enter your email, pay with any card. Instant access. No contracts ever.' },
  { num: '02', title: 'Browse Philly deals',    body: 'Restaurants, cafes, barbers, gyms, nail salons — all in one place.' },
  { num: '03', title: 'Tap, show code, save',   body: 'A unique 6-letter code appears. Show it at the counter. Done in 10 seconds.' },
]

export default function Home() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <style>{`
        .deal-card { background: var(--bg-2); border: 1.5px solid var(--border-2); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
        .deal-card-img { width: 100%; height: 120px; object-fit: cover; display: block; }
        .deal-card-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .quick-link { background: var(--bg-2); border: 1px solid var(--border-2); border-radius: 8px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; text-align: left; width: 100%; transition: border-color 0.15s; }
        .quick-link:hover { border-color: var(--green); }
        .preview-shell { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 14px; margin-bottom: 32px; }
        .preview-featured { min-height: 100%; }
        .preview-featured .deal-card-img { height: 170px; }
        .preview-side-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .preview-tag { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; background: rgba(15,15,15,0.06); color: var(--ink-3); font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 8px; border-radius: 999px; }
        .preview-kicker { display: inline-flex; align-items: center; gap: 8px; background: var(--green-lt); color: var(--green-dk); padding: 4px 12px; border-radius: 999px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px; }
        .preview-note { font-size: 13px; font-weight: 600; color: var(--ink-4); text-transform: uppercase; letter-spacing: 0.05em; }
        @media (max-width: 900px) {
          .preview-shell { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .preview-side-grid { grid-template-columns: 1fr; }
          .preview-featured .deal-card-img { height: 150px; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', background: 'var(--bg)', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
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
      <section style={{ padding: '72px 24px 64px', maxWidth: '720px', margin: '0 auto' }}>
        <div className="fade-up" style={{ display: 'inline-block', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '4px 12px', borderRadius: '4px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '24px' }}>
          Now live in Philadelphia
        </div>
        <h1 className="display fade-up-2" style={{ fontSize: 'clamp(56px, 13vw, 104px)', marginBottom: '24px', lineHeight: 0.95 }}>
          Your city.<br />Your spots.<br />Hooked up.
        </h1>
        <p className="fade-up-3" style={{ fontSize: '18px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '480px', marginBottom: '36px', lineHeight: 1.6 }}>
          From your lowkey favorites to your everyday go-to&apos;s — one membership unlocks exclusive deals at the Philly spots that actually matter to you.
        </p>
        <div className="fade-up-4" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '48px' }}>
          <Link href="/signup" className="btn btn-primary" style={{ fontSize: '18px', padding: '16px 32px' }}>
            Get PerkPass — $3/mo
          </Link>
          <Link href="/member/login" className="btn btn-outline" style={{ fontSize: '18px', padding: '16px 32px' }}>
            Member login
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', borderTop: '2px solid var(--ink)', paddingTop: '32px' }}>
          {[
            { n: 'Growing', l: 'Active deals' },
            { n: '$3',      l: 'Per month' },
            { n: '1 min',   l: 'To redeem' },
          ].map(s => (
            <div key={s.l} style={{ paddingRight: '24px' }}>
              <div className="display" style={{ fontSize: '40px', color: 'var(--green)' }}>{s.n}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-3)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Deals — card grid */}
      <section style={{ padding: '64px 24px', borderTop: '2px solid var(--ink)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <div className="preview-kicker">Sample deal preview</div>
            <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)' }}>
              Sneak peek
            </h2>
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ink-2)', marginTop: '10px', marginBottom: '10px', lineHeight: 1.4 }}>
              What $3/month unlocks around Philly.
            </p>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '520px', lineHeight: 1.6 }}>
              Preview of the member experience. Business names are shown for vibe, and deals rotate across cafes, restaurants, fitness, self-care, and more.
            </p>
          </div>
          <div className="preview-shell">
            {DEALS.filter((deal) => deal.featured).map((d, i) => {
              const normalizedCategory = normalizeCategory(d.cat)
              const categoryMeta = getCategoryMeta(d.cat)
              const colors = CAT_COLORS[d.cat] || categoryMeta.color || { bg: 'var(--bg-2)', color: 'var(--ink-3)' }
              const photo = d.cat === 'Dessert'
                ? 'https://nstqhqhwhzzvhddnbwvg.supabase.co/storage/v1/object/public/business-photos/Homepage/Screenshot%202026-04-06%20at%203.04.06%20PM.png'
                : categoryMeta.photo
              return (
                <div key={i} className="deal-card preview-featured">
                  {photo && (
                    <div style={{ position: 'relative' }}>
                      <img src={photo} alt={d.cat} className="deal-card-img" loading="lazy" />
                      <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--ink)', color: 'var(--bg)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '3px' }}>
                        Sample deal
                      </span>
                    </div>
                  )}
                  <div className="deal-card-body" style={{ padding: '18px 18px 20px', gap: '10px' }}>
                    <span style={{ display: 'inline-block', alignSelf: 'flex-start', background: colors.bg, color: colors.color, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: '4px' }}>
                      {d.cat === 'Dessert' ? d.cat : normalizedCategory} • {d.area}
                    </span>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '28px', fontWeight: 900, color: 'var(--ink)', lineHeight: 1.02, letterSpacing: '-0.02em' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green-dk)', lineHeight: 1.15 }}>
                      {d.offer}
                    </div>
                    <div className="preview-tag">
                      {d.tag}
                    </div>
                    <div className="preview-note" style={{ marginTop: 'auto', paddingTop: '6px' }}>
                      Preview of the member experience
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="preview-side-grid">
            {DEALS.filter((deal) => !deal.featured).map((d, i) => {
              const normalizedCategory = normalizeCategory(d.cat)
              const categoryMeta = getCategoryMeta(d.cat)
              const colors = CAT_COLORS[d.cat] || categoryMeta.color || { bg: 'var(--bg-2)', color: 'var(--ink-3)' }
              const photo = d.cat === 'Dessert'
                ? 'https://nstqhqhwhzzvhddnbwvg.supabase.co/storage/v1/object/public/business-photos/Homepage/Screenshot%202026-04-06%20at%203.04.06%20PM.png'
                : categoryMeta.photo
              return (
                <div key={i} className="deal-card">
                  {photo && (
                    <div style={{ position: 'relative' }}>
                      <img src={photo} alt={d.cat} className="deal-card-img" loading="lazy" />
                      <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--ink)', color: 'var(--bg)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '3px' }}>
                        Sample deal
                      </span>
                    </div>
                  )}
                  <div className="deal-card-body">
                    <span style={{ display: 'inline-block', alignSelf: 'flex-start', background: colors.bg, color: colors.color, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: '4px' }}>
                      {d.cat === 'Dessert' ? d.cat : normalizedCategory} • {d.area}
                    </span>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-dk)', lineHeight: 1.35 }}>
                      {d.offer}
                    </div>
                    <div className="preview-tag">
                      {d.tag}
                    </div>
                  </div>
                </div>
              )
            })}
            <Link href="/for-business" style={{ textDecoration: 'none' }}>
              <div className="deal-card" style={{ background: 'var(--bg)', border: '1.5px solid var(--forest)', minHeight: '220px', cursor: 'pointer' }}>
                <div className="deal-card-body" style={{ justifyContent: 'center', gap: '16px' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green)' }}>
                    Own a business?
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: 900, color: 'var(--forest)', lineHeight: 1.05 }}>
                    Wanna list your business? Let&apos;s do it.
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--green)' }}>
                    Apply free →
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <div>
            <Link href="/signup" className="btn btn-primary" style={{ fontSize: '17px' }}>
              Unlock all deals — $3/month
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '64px 24px', background: 'var(--forest)', borderTop: '2px solid var(--ink)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', color: '#ffffff', marginBottom: '40px' }}>
            How it works
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {HOW.map(s => (
              <div key={s.num} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="display" style={{ fontSize: '48px', color: 'var(--green)', flexShrink: 0, lineHeight: 1 }}>
                  {s.num}
                </div>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.01em', marginBottom: '6px' }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', fontWeight: 400, lineHeight: 1.55 }}>
                    {s.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '80px 24px', borderTop: '2px solid var(--ink)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 className="display" style={{ fontSize: 'clamp(52px, 11vw, 96px)', marginBottom: '24px' }}>
            Ready to save?
          </h2>
          <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', marginBottom: '32px', maxWidth: '400px', lineHeight: 1.6 }}>
            Cancel anytime. No contracts. No BS. Just deals at places you already go.
          </p>
          <Link href="/signup" className="btn btn-dark" style={{ fontSize: '18px', padding: '18px 40px' }}>
            Get PerkPass — $3/month
          </Link>
        </div>
      </section>

    </main>
  )
}
