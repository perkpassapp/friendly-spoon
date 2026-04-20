import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Influencer Creator Opportunity | PerkPass',
  description:
    'Collaborate with PerkPass as a Philly creator and help spotlight great local businesses doing good in the community.',
}

const PERKS = [
  'Life time PerkPass membership',
  'Exclusive direct access to participating businesses',
  'Free PerkPass merch',
  'Featured on our site and app (coming soon)',
  'Marketing support and promotion for your content',
]

const FIT = [
  'You genuinely love spotlighting Philly restaurants, cafes, shops, and neighborhood gems.',
  'You care about helping Philadelphia small businesses and the local community win.',
  'Your content feels trustworthy, useful, and community-first.',
  'You are excited to build with an early local brand and grow together.',
]

const SEND = [
  'Your Instagram handle and a quick intro',
  'Links to a few posts or reels that show your style',
  'Why you think you would be a strong fit for PerkPass',
  'Anything local or community-focused you are especially proud of',
]

export default function InfluencerCreatorOpportunityPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
        <Link href="/" style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--ink-3)',
          textDecoration: 'none',
        }}>
          Back home
        </Link>
      </nav>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '56px 24px 88px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--green-lt)', color: 'var(--green-dk)', padding: '4px 12px', borderRadius: '999px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '20px' }}>
          PerkPass creator collab
        </div>

        <h1 className="display" style={{ fontSize: 'clamp(44px, 10vw, 82px)', marginBottom: '18px' }}>
          Influencer Creator Opportunity
        </h1>

        <p style={{ fontSize: '18px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '640px', lineHeight: 1.65, marginBottom: '28px' }}>
          We want to partner with Philly creators who shine a light on great local businesses and do great things for the community. If that sounds like you, let&apos;s chat about a PerkPass collab.
        </p>

        <div style={{ background: 'var(--forest)', color: '#ffffff', borderRadius: '14px', padding: '28px 24px', border: '2px solid var(--green)', marginBottom: '28px' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green)', marginBottom: '10px' }}>
            What you get
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {PERKS.map((perk) => (
              <div key={perk} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px 16px 14px' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.45, color: '#ffffff' }}>
                  {perk}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '12px', padding: '22px 20px' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '12px' }}>
              Who we&apos;re looking for
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FIT.map((item) => (
                <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green-dk)', fontWeight: 800, lineHeight: 1.4 }}>+</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '12px', padding: '22px 20px' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '12px' }}>
              What to send us
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {SEND.map((item) => (
                <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--green-dk)', fontWeight: 800, lineHeight: 1.4 }}>+</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '12px', padding: '22px 20px', marginBottom: '28px' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>
            Coming soon
          </div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            Creators we collaborate with will also be featured on the PerkPass site and inside the app as that part of the product rolls out.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <a
            href="mailto:hello@getperkpass.com?subject=PerkPass%20Influencer%20Creator%20Opportunity"
            className="btn btn-primary"
            style={{ fontSize: '17px', padding: '16px 28px' }}
          >
            Reach out to collab
          </a>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-4)' }}>
            Prefer DM first? Mention PerkPass and we&apos;ll take it from there.
          </p>
        </div>
      </div>
    </main>
  )
}
