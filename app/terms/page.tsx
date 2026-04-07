import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | PerkPass',
  description: 'Terms of Service for PerkPass.',
}

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '8px' }}>Terms of Service</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500, marginBottom: '40px' }}>Last updated: April 2, 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', fontSize: '15px', lineHeight: 1.65, color: 'var(--ink-3)' }}>
          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>1. Overview</h2>
            <p>Welcome to PerkPass. These Terms of Service govern your access to and use of the PerkPass platform.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>2. Platform Role</h2>
            <p>PerkPass is a platform that connects users with participating businesses offering promotions, deals, or perks.</p>
            <p style={{ marginTop: '8px' }}>We do not own or control these businesses and are not responsible for their services or offer fulfillment.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>3. Offers Disclaimer</h2>
            <p>Offers are subject to change, availability, expiration, and terms set by each business. PerkPass does not guarantee offer availability, business participation, specific savings or value, or offer fulfillment.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>4. Subscription</h2>
            <p>PerkPass offers a recurring monthly subscription. By subscribing, you agree to recurring billing unless canceled before the next billing cycle.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>5. Acceptable Use</h2>
            <p>You agree not to abuse or exploit offers, misrepresent eligibility, or use the platform for unlawful purposes.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>6. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, PerkPass is not liable for damages arising from use of the platform or any business interaction.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>7. Governing Law</h2>
            <p>These Terms are governed by the laws of Pennsylvania.</p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink)', marginBottom: '10px' }}>8. Contact</h2>
            <p>Questions? Email us at <a href="mailto:hello@getperkpass.com" style={{ color: 'var(--green-dk)', fontWeight: 600, textDecoration: 'underline' }}>hello@getperkpass.com</a></p>
          </section>
        </div>
      </div>
    </main>
  )
}
