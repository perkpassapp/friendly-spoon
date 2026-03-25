import Link from 'next/link'

const DEALS = [
  { name: 'Fishtown Coffee Co.', deal: '20% off any drink', cat: 'Cafe', addr: 'Fishtown' },
  { name: 'The Craft Barber', deal: '$10 off first haircut', cat: 'Barber', addr: 'Northern Liberties' },
  { name: 'Iron Body Gym', deal: 'Free 1-week trial', cat: 'Fitness', addr: 'Spring Garden' },
  { name: 'Bliss Nail Studio', deal: '30% off mani-pedi', cat: 'Nails', addr: 'South Street' },
  { name: 'Compadre Taqueria', deal: 'Buy 1 entree get 1 free', cat: 'Restaurant', addr: 'Passyunk' },
  { name: 'Rally Pickleball', deal: 'Free drop-in class', cat: 'Sport', addr: 'Old City' },
]

const HOW = [
  { num: '01', title: 'Sign up for $3/month', body: 'Enter your email, pay with any card. Instant access. No contracts ever.' },
  { num: '02', title: 'Browse Philly deals', body: 'Restaurants, cafes, barbers, gyms, nail salons — all in one place.' },
  { num: '03', title: 'Tap, show code, save', body: 'A unique 6-letter code appears. Show it at the counter. Done in 10 seconds.' },
]

export default function Home() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '56px',
        background: 'var(--bg)',
        borderBottom: '2px solid var(--ink)',
      }}>
        <a href="/" className="pp-logo">Perk<span>Pass</span></a>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/member/login" style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.03em',
            color: 'var(--ink-3)', textDecoration: 'none', padding: '8px 12px',
          }}>
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary" style={{ fontSize: '15px', padding: '10px 20px' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '72px 24px 64px', maxWidth: '720px', margin: '0 auto' }}>
        <div className="fade-up" style={{
          display: 'inline-block',
          background: 'var(--green-lt)',
          color: 'var(--green-dk)',
          padding: '4px 12px', borderRadius: '4px',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: '13px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em',
          marginBottom: '24px',
        }}>
          Now live in Philadelphia
        </div>

        <h1 className="display fade-up-2" style={{
          fontSize: 'clamp(64px, 14vw, 112px)',
          marginBottom: '24px',
        }}>
          Stop paying<br />full price.
        </h1>

        <p className="fade-up-3" style={{
          fontSize: '18px', fontWeight: 500, color: 'var(--ink-3)',
          maxWidth: '480px', marginBottom: '36px', lineHeight: 1.6,
        }}>
          One membership unlocks exclusive deals at Philly restaurants, cafes, barbers, gyms, and more. Three bucks a month.
        </p>

        <div className="fade-up-4" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '48px' }}>
          <Link href="/signup" className="btn btn-primary" style={{ fontSize: '18px', padding: '16px 32px' }}>
            Get PerkPass — $3/mo
          </Link>
          <Link href="/member/login" className="btn btn-outline" style={{ fontSize: '18px', padding: '16px 32px' }}>
            Member login
          </Link>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2px', borderTop: '2px solid var(--ink)', paddingTop: '32px',
        }}>
          {[
            { n: '50+', l: 'Active deals' },
            { n: '$3', l: 'Per month' },
            { n: '2 min', l: 'To redeem' },
          ].map(s => (
            <div key={s.l} style={{ paddingRight: '24px' }}>
              <div className="display" style={{ fontSize: '40px', color: 'var(--green)' }}>{s.n}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-3)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Deals */}
      <section style={{ padding: '64px 24px', borderTop: '2px solid var(--ink)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)' }}>
              What's included
            </h2>
            <Link href="/signup" style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em',
              color: 'var(--green)', textDecoration: 'none',
            }}>
              See all deals
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {DEALS.map((d, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '18px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '12px', fontWeight: 700, color: 'var(--ink-4)',
                  width: '28px', flexShrink: 0,
                  letterSpacing: '0.04em',
                }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '20px', fontWeight: 800,
                    color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.1,
                  }}>
                    {d.name}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green-dk)', marginTop: '2px' }}>{d.deal}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span className="tag tag-neutral" style={{ display: 'none' }}>{d.cat}</span>
                  <span style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500 }}>{d.addr}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px' }}>
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
              <div key={s.num} style={{
                display: 'flex', gap: '24px', alignItems: 'flex-start',
                padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div className="display" style={{ fontSize: '48px', color: 'var(--green)', flexShrink: 0, lineHeight: 1 }}>
                  {s.num}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '22px', fontWeight: 800, color: '#ffffff',
                    textTransform: 'uppercase', letterSpacing: '0.01em', marginBottom: '6px',
                  }}>
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
      <footer style={{
        padding: '24px', borderTop: '2px solid var(--ink)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <a href="/" className="pp-logo">Perk<span>Pass</span></a>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { l: 'For businesses', h: '/business/scan' },
            { l: 'Admin', h: '/admin' },
            { l: 'Log in', h: '/member/login' },
          ].map(x => (
            <Link key={x.l} href={x.h} style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.04em',
              color: 'var(--ink-3)', textDecoration: 'none',
            }}>{x.l}</Link>
          ))}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500 }}>
          2025 PerkPass
        </p>
      </footer>
    </main>
  )
}