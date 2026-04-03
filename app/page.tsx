import Link from 'next/link'

const DEALS = [
  { name: 'La Colombe', cat: 'Cafe', addr: 'Fishtown' },
  { name: 'Barpride', cat: 'Barber', addr: 'Passyunk' },
  { name: 'Everybody Fights', cat: 'Fitness', addr: 'Center City' },
  { name: 'Nails by Design', cat: 'Nails', addr: 'Old City' },
  { name: 'Suraya', cat: 'Restaurant', addr: 'Fishtown' },
]

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  Cafe:       { bg: '#FFF3CD', color: '#92600A' },
  Barber:     { bg: '#E8F4FD', color: '#1A6B9E' },
  Fitness:    { bg: '#E8F8EF', color: '#1A6B3E' },
  Nails:      { bg: '#FCE8F3', color: '#8B1A5E' },
  Restaurant: { bg: '#FDE8E8', color: '#8B1A1A' },
  Sport:      { bg: '#EDE8FD', color: '#4A1A8B' },
}

const CAT_PHOTOS: Record<string, string> = {
  Cafe:       'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=75',
  Barber:     'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=75',
  Fitness:    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=75',
  Nails:      'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=75',
  Restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=75',
  Sport:      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&q=75',
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
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', background: 'var(--bg)', borderBottom: '2px solid var(--ink)' }}>
        <a href="/" className="pp-logo">Perk<span>Pass</span></a>
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
            <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)' }}>
              Sneak peek for the homies
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {DEALS.map((d, i) => {
              const colors = CAT_COLORS[d.cat] || { bg: 'var(--bg-2)', color: 'var(--ink-3)' }
              const photo = CAT_PHOTOS[d.cat]
              return (
                <div key={i} className="deal-card">
                  {photo && (
                    <div style={{ position: 'relative' }}>
                      <img src={photo} alt={d.cat} className="deal-card-img" loading="lazy" />
                      <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--ink)', color: 'var(--bg)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '3px' }}>
                        Coming soon
                      </span>
                    </div>
                  )}
                  <div className="deal-card-body">
                    <span style={{ display: 'inline-block', alignSelf: 'flex-start', background: colors.bg, color: colors.color, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: '4px' }}>
                      {d.cat}
                    </span>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-dk)', lineHeight: 1.3 }}>
                      {d.deal}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-4)', marginTop: 'auto', paddingTop: '4px' }}>
                      {d.addr}
                    </div>
                  </div>
                </div>
              )
            })}
            {/* CTA tile */}
            <Link href="/for-business" style={{ textDecoration: 'none' }}>
              <div className="deal-card" style={{ background: 'var(--forest)', border: '1.5px solid var(--green)', minHeight: '220px', cursor: 'pointer' }}>
                <div className="deal-card-body" style={{ justifyContent: 'center', gap: '16px' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green)' }}>
                    Own a business?
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: 900, color: '#ffffff', lineHeight: 1.05 }}>
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

      {/* Footer */}
      <footer style={{ padding: '24px', borderTop: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <a href="/" className="pp-logo">Perk<span>Pass</span></a>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { l: 'For businesses', h: '/for-business' },
            { l: 'Admin',          h: '/admin' },
            { l: 'Log in',         h: '/member/login' },
          ].map(x => (
            <Link key={x.l} href={x.h} style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-3)', textDecoration: 'none' }}>{x.l}</Link>
          ))}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500 }}>
          2025 PerkPass
        </p>
      </footer>
    </main>
  )
}
