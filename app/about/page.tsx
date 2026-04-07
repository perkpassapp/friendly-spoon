import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us | PerkPass',
  description: 'Learn more about PerkPass and our mission to connect Philadelphia members with local businesses.',
}

export default function AboutPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '12px' }}>About Us</h1>
        <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.65, marginBottom: '32px' }}>
          PerkPass is a Philadelphia-based membership built to make local spending feel more rewarding. We help members discover everyday deals at neighborhood restaurants, cafes, barbers, gyms, nail salons, and more.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontSize: '15px', lineHeight: 1.65, color: 'var(--ink-3)' }}>
          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>Our Mission</h2>
            <p>
              We want to make it easier for people to support the spots they already love while helping local businesses turn everyday visits into repeat customers.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>Why Philadelphia</h2>
            <p>
              PerkPass starts in Philly because local businesses here have real community and personality. We built the product around neighborhood discovery, not generic national coupons.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>How We Work</h2>
            <p>
              Members pay one low monthly price for access to exclusive local deals. Businesses join to reach motivated local customers without complicated coupon systems or commissions on each redemption.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
