import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Support | PerkPass',
  description: 'Support options and contact details for PerkPass members and businesses.',
}

export default function SupportPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '8px' }}>Support</h1>
        <p style={{ fontSize: '16px', color: 'var(--ink-3)', fontWeight: 500, marginBottom: '36px', lineHeight: 1.6 }}>
          Need help with your membership, billing, login, or a local deal? Reach out and we&apos;ll help you get sorted.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '12px', padding: '22px 20px' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>
              Contact
            </div>
            <p style={{ fontSize: '15px', color: 'var(--ink-3)', lineHeight: 1.65, marginBottom: '10px' }}>
              Email us at <a href="mailto:hello@getperkpass.com" style={{ color: 'var(--green-dk)', fontWeight: 700, textDecoration: 'underline' }}>hello@getperkpass.com</a>
            </p>
            <p style={{ fontSize: '14px', color: 'var(--ink-4)', lineHeight: 1.55 }}>
              We use this inbox for member support, billing questions, login issues, and business support.
            </p>
          </section>

          <section style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '12px', padding: '22px 20px' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>
              Common Topics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '15px', color: 'var(--ink-3)', lineHeight: 1.6 }}>
              <p>Member login and magic link access</p>
              <p>Billing and subscription questions</p>
              <p>Offer redemption issues</p>
              <p>Business partner questions</p>
            </div>
          </section>

          <section style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '12px', padding: '22px 20px' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>
              Policies
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/terms" style={{ color: 'var(--green-dk)', fontWeight: 700, textDecoration: 'none' }}>Terms</Link>
              <Link href="/privacy" style={{ color: 'var(--green-dk)', fontWeight: 700, textDecoration: 'none' }}>Privacy</Link>
              <Link href="/refund-policy" style={{ color: 'var(--green-dk)', fontWeight: 700, textDecoration: 'none' }}>Refund policy</Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
