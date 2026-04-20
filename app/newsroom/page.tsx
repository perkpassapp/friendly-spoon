import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Newsroom | PerkPass',
  description: 'Company updates and press information from PerkPass, a Philly-born local perks membership.',
}

export default function NewsroomPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '12px' }}>Newsroom</h1>
        <p style={{ fontSize: '17px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.65, marginBottom: '32px' }}>
          Find updates from PerkPass as we grow our Philly local perks network, launch new features, and spotlight neighborhood businesses.
        </p>

        <section style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '10px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>
            Latest Update
          </div>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.01em', color: 'var(--ink)', marginBottom: '8px' }}>
            PerkPass continues expanding local deals in Philadelphia
          </h2>
          <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--ink-3)' }}>
            We are continuing to grow our Philadelphia business network and improve the member experience for discovering and redeeming perks around the city.
          </p>
        </section>

        <section style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--ink-3)' }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>
            Press Contact
          </h2>
          <p>
            For media inquiries, partnership announcements, or company information, contact{' '}
            <a href="mailto:hello@getperkpass.com" style={{ color: 'var(--green-dk)', fontWeight: 700, textDecoration: 'underline' }}>
              hello@getperkpass.com
            </a>.
          </p>
        </section>
      </div>
    </main>
  )
}
