import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | PerkPass',
}

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500, marginBottom: '40px' }}>Last updated: April 2, 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', fontSize: '15px', lineHeight: 1.65, color: 'var(--ink-3)' }}>
          <p>PerkPass, operated by Sam Lee Ventures LLC, collects information to provide and improve our services.</p>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>Information We Collect</h2>
            <p>We collect email and account data, usage data, and payment information processed via Stripe.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>How We Use Data</h2>
            <p>We use your data to operate the platform, process payments, and improve the user experience.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>Third Parties</h2>
            <p>We may use services like Stripe, Supabase, and analytics tools. We do not sell your personal information.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>Contact</h2>
            <p>Email us at <a href="mailto:hello@getperkpass.com" style={{ color: 'var(--green-dk)', fontWeight: 600, textDecoration: 'underline' }}>hello@getperkpass.com</a></p>
          </section>
        </div>
      </div>
    </main>
  )
}
