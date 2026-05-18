import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Our Offerings | PerkPass',
  description: 'See how PerkPass helps Philly members discover local perks and helps Philadelphia businesses bring in repeat customers.',
}

export default function OfferingsPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo"><span className="pp-logo-perk">Perk</span><span className="pp-logo-pass">Pass</span></Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '12px' }}>Our Offerings</h1>
        <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.65, marginBottom: '32px' }}>
          PerkPass is designed for Philly members looking to save locally and neighborhood businesses looking to bring in repeat customers.
        </p>

        <div style={{ display: 'grid', gap: '16px' }}>
          {[
            {
              title: 'Member Access',
              body: 'Unlimited access to participating Philadelphia perks through one simple monthly membership.',
            },
            {
              title: 'Fast Redemption',
              body: 'Members can open the app, generate a code, and redeem in seconds at the counter.',
            },
            {
              title: 'Business Dashboard',
              body: 'Partner businesses can manage deals, update photos, and track redemptions in one place.',
            },
            {
              title: 'Local Discovery',
              body: 'Members can explore food, fitness, grooming, wellness, self-care, and neighborhood favorites across Philly.',
            },
          ].map((item) => (
            <section key={item.title} style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '10px', padding: '20px' }}>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--ink)', marginBottom: '8px' }}>
                {item.title}
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--ink-3)' }}>
                {item.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
