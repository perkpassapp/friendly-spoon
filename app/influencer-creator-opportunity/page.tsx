import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Influencer Creator Opportunity | PerkPass',
  description:
    'Join PerkPass as a Philly creator affiliate and help your audience turn local recommendations into real visits.',
}

const PERKS = [
  'Your own referral code or link for your audience',
  'Earn on every confirmed signup through your code',
  'An early access promo for your audience: $30 for the whole year',
  'Locked-in OG member pricing for followers who join early',
  'Free lifetime PerkPass membership as a creator partner',
  'Opportunities to be featured on PerkPass as we grow',
]

const FIT = [
  'You genuinely love spotlighting Philly restaurants, cafes, shops, and neighborhood gems.',
  'You care about helping Philadelphia small businesses and the local community win.',
  'Your recommendations help people decide where to actually go next.',
  'Your content feels trustworthy, useful, and community-first.',
]

const SEND = [
  'Your Instagram handle and a quick intro',
  'Links to a few posts or reels that show your style',
  'A little about the local spots, neighborhoods, or categories you love covering',
  'Anything community-focused you are especially proud of',
]

const CREATOR_KIT = [
  'A simple story framework your audience can understand fast',
  'Caption options you can copy, tweak, or rewrite in your own voice',
  'A short Reel or TikTok script if you want to make video content',
  'Your personal referral code and link',
  'Clear language for the early access promo: $30/year and locked-in OG pricing',
]

export default function InfluencerCreatorOpportunityPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo"><span className="pp-logo-perk">Perk</span><span className="pp-logo-pass">Pass</span></Link>
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
          PerkPass creator affiliate
        </div>

        <h1 className="display" style={{ fontSize: 'clamp(44px, 10vw, 82px)', marginBottom: '18px' }}>
          Help Philly locals turn saved posts into real visits.
        </h1>

        <p style={{ fontSize: '18px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '640px', lineHeight: 1.65, marginBottom: '28px' }}>
          We love creators who highlight local Philly spots. PerkPass helps your audience do more than save a post for later: it gives them a simple reason to go try the businesses you already love sharing.
        </p>

        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '12px', padding: '22px 20px', marginBottom: '28px' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>
            Why creators partner with us
          </div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.65 }}>
            We partner closely with Philly-area businesses to add light promos and member-only offers that make local discovery more actionable. Your audience gets an early access promo: $30 for the whole year, with pricing that stays locked in so they feel like true OG PerkPass members. Businesses get more local support, and you can earn when your community signs up through your code.
          </p>
        </div>

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
            Simple by design
          </div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            We want this to feel easy, not like another complicated sponsorship. You keep creating helpful local content, we give you a trackable code and a better PerkPass offer for your audience, and together we help more people show up for local businesses.
          </p>
        </div>

        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: '12px', padding: '22px 20px', marginBottom: '28px' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: '10px' }}>
            We make posting easy
          </div>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: '14px' }}>
            You do not have to figure out the pitch from scratch. We can give you a small creator kit with story prompts, caption starters, a short video script, and your personal code or link. Use it as-is or make it sound like you.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {CREATOR_KIT.map((item) => (
              <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--green-dk)', fontWeight: 800, lineHeight: 1.4 }}>+</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55 }}>{item}</span>
              </div>
            ))}
          </div>
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
