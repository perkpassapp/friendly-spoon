import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy | PerkPass',
}

export default function RefundPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
      </nav>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '8px' }}>Refund Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--ink-4)', fontWeight: 500, marginBottom: '40px' }}>Last updated: April 2, 2026</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '15px', lineHeight: 1.65, color: 'var(--ink-3)' }}>
          <p>PerkPass subscriptions are billed based on the plan you choose. Public memberships are monthly, and creator-exclusive annual memberships may be available through referral links. You may cancel anytime from your account settings.</p>
          <p>Payments are non-refundable. We do not provide refunds for unused time, unused offers, or partial billing periods.</p>
          <p>Offers may change or be discontinued at any time by participating businesses. This does not constitute grounds for a refund.</p>
          <p>For billing issues or questions, contact us at <a href="mailto:hello@getperkpass.com" style={{ color: 'var(--green-dk)', fontWeight: 600, textDecoration: 'underline' }}>hello@getperkpass.com</a></p>
        </div>
      </div>
    </main>
  )
}
