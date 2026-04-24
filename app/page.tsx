import Link from 'next/link'
import { getCategoryMeta, normalizeCategory } from '@/lib/product'

const DEALS = [
  { name: 'The Brew Room', offer: '10% off your purchase', cat: 'Cafe', area: 'Ardmore', featured: true },
  { name: 'Prince Tea House', offer: '10% off your order', cat: 'Restaurant', area: 'Chinatown', featured: false },
  { name: 'Scoop DeVille', offer: '25% off all items', cat: 'Dessert', area: 'Center City', featured: false },
  { name: 'Mocha Melt Cafe', offer: '$3 off minimum purchase of $20', cat: 'Cafe', area: 'Philadelphia', featured: false },
  { name: 'Cellar Dog', offer: 'Happy hour specials: 1/2 off games, drinks, & bites under $10', cat: 'Sport', area: 'Philadelphia', featured: false },
]

const CAT_COLORS: Record<string, { bg: string; color: string }> = {
  Dessert: { bg: '#ffe5d1', color: '#ae5d17' },
}

const HOW = [
  { num: '01', title: 'Join for $3/month',  body: 'Start monthly, unlock the member experience, and keep it simple. No contracts ever.' },
  { num: '02', title: 'Browse Philly deals',    body: 'Restaurants, cafes, barbers, gyms, nail salons — all in one place.' },
  { num: '03', title: 'Tap, show code, save',   body: 'A unique 6-letter code appears. Show it at the counter. Done in 10 seconds.' },
]

const FAQS = [
  {
    question: 'How does PerkPass work?',
    answer: 'Join monthly for $3, browse member-only Philly perks, then show a short redemption code when you visit a participating local business.',
  },
  {
    question: 'Why is PerkPass so affordable?',
    answer: 'We keep PerkPass affordable on purpose. The goal is simple: help more people enjoy local deals, discover new favorites, and support neighborhood businesses without overthinking the cost.',
  },
  {
    question: 'How does PerkPass get quality local deals?',
    answer: 'We work closely with Philly-area businesses that care about giving locals a great experience, not just a random discount. Every perk is shaped with the business so the offer feels worthwhile for members, clear at checkout, and supportive of the local spots people want to come back to.',
  },
  {
    question: 'How do I redeem a deal?',
    answer: 'Tap a deal, confirm you are at the business, and show your code at checkout. Codes are time-sensitive, so you will have 2 minutes to show it, then that deal enters a short cooldown before you can redeem it again.',
  },
]

const CREATORS = [
  {
    handle: '@citybitesdaily',
    title: 'Neighborhood food finds with real community pull',
    body: 'We love creators who spotlight underrated local spots, tell the story behind the people running them, and send real support back into the neighborhood.',
    stats: 'Foodie picks • Small biz champion',
  },
  {
    handle: '@phillyafterfive',
    title: 'The go-to for date night, coffee runs, and casual city gems',
    body: 'The best collabs feel useful. Think honest recommendations, good taste, and a feed that helps people discover where to spend locally.',
    stats: 'Cafe culture • Dinner recs',
  },
  {
    handle: '@supportlocalphl',
    title: 'Creators who make local business feel personal',
    body: 'We are especially into creators who highlight owners, community events, neighborhood energy, and the kinds of places people want to come back to.',
    stats: 'Community voice • Local impact',
  },
]

const SHOW_CREATOR_COLLABS = false

export default function Home() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <style>{`
        .deal-card { background: var(--bg-2); border: 1.5px solid var(--border-2); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
        .deal-card-img { width: 100%; height: 120px; object-fit: cover; display: block; }
        .deal-card-body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .quick-link { background: var(--bg-2); border: 1px solid var(--border-2); border-radius: 8px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; text-align: left; width: 100%; transition: border-color 0.15s; }
        .quick-link:hover { border-color: var(--green); }
        .preview-kicker { display: inline-flex; align-items: center; gap: 8px; background: var(--green-lt); color: var(--green-dk); padding: 4px 12px; border-radius: 999px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px; }
        .preview-meta-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 18px; }
        .preview-meta-card { background: var(--bg-2); border: 1px solid var(--border-2); border-radius: 10px; padding: 14px 14px 12px; }
        .preview-meta-label { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-4); margin-bottom: 6px; }
        .preview-meta-value { font-size: 14px; font-weight: 700; color: var(--ink); line-height: 1.3; }
        .trust-strip { border-bottom: 2px solid var(--ink); background: var(--bg-2); padding: 18px 24px; }
        .trust-strip-inner { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .trust-item { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: var(--ink-3); }
        .trust-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--green); flex-shrink: 0; }
        .faq-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .faq-card { background: var(--bg-2); border: 1px solid var(--border-2); border-radius: 12px; padding: 20px; }
        .creator-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 14px; }
        .creator-card { background: var(--bg-2); border: 1.5px solid var(--border-2); border-radius: 14px; padding: 22px; }
        .creator-stack { display: grid; grid-template-columns: 1fr; gap: 14px; }
        .home-hero { position: relative; overflow: hidden; padding: 64px 24px 56px; border-bottom: 2px solid var(--ink); background: var(--bg); }
        .home-hero-inner { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(280px, 0.82fr); gap: 42px; align-items: center; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--ink); color: var(--bg); padding: 6px 11px; border-radius: 999px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 20px; }
        .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 30px; }
        .hero-proof { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; max-width: 620px; }
        .hero-proof-card { background: rgba(255,255,255,0.62); border: 1px solid rgba(15,15,15,0.12); border-radius: 12px; padding: 14px 14px 12px; backdrop-filter: blur(10px); }
        .hero-visual { position: relative; min-height: 430px; }
        .hero-phone { position: relative; z-index: 2; width: min(100%, 330px); margin-left: auto; background: var(--forest); border: 2px solid var(--ink); border-radius: 30px; padding: 14px; box-shadow: 10px 12px 0 rgba(15,15,15,0.1); }
        .hero-phone-screen { background: #fffaf0; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.18); }
        .hero-phone-top { padding: 16px 16px 10px; background: var(--forest); color: #fff; }
        .hero-mini-card { background: var(--bg); border: 1px solid var(--border-2); border-radius: 12px; padding: 12px; margin: 8px; }
        .hero-float { position: absolute; z-index: 3; background: var(--bg); border: 2px solid var(--ink); border-radius: 14px; padding: 13px; box-shadow: 6px 8px 0 rgba(15,15,15,0.12); }
        .hero-float-left { left: 4px; top: 64px; max-width: 170px; }
        .hero-float-right { right: 0; bottom: 34px; max-width: 180px; }
        .hero-shape { position: absolute; z-index: 1; border-radius: 999px; background: var(--green); opacity: 0.25; }
        .hero-shape-one { width: 180px; height: 180px; right: 18px; top: 18px; }
        .hero-shape-two { width: 110px; height: 110px; left: 34px; bottom: 50px; background: #f0bd57; }
        @media (max-width: 900px) {
          .preview-meta-grid { grid-template-columns: 1fr; }
          .trust-strip-inner { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .faq-grid { grid-template-columns: 1fr; }
          .creator-grid { grid-template-columns: 1fr; }
          .home-hero { padding: 48px 20px 42px; }
          .home-hero-inner { grid-template-columns: 1fr; gap: 36px; }
          .hero-proof { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .hero-visual { min-height: auto; }
          .hero-phone { margin: 0 auto; box-shadow: 8px 10px 0 rgba(15,15,15,0.1); }
          .hero-float { display: none; }
        }
        @media (max-width: 560px) {
          .hero-actions .btn { width: 100%; justify-content: center; }
          .hero-proof { grid-template-columns: 1fr 1fr; }
          .hero-proof-card { padding: 12px; }
          .trust-strip-inner { grid-template-columns: 1fr; }
          .hero-phone { border-radius: 26px; padding: 12px; }
          .hero-phone-screen { border-radius: 18px; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', background: 'var(--bg)', borderBottom: '2px solid var(--ink)' }}>
        <Link href="/" className="pp-logo">Perk<span>Pass</span></Link>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href="/member/login" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--ink-3)', textDecoration: 'none', padding: '8px 12px' }}>
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary" style={{ fontSize: '15px', padding: '10px 20px' }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div>
            <div className="hero-badge fade-up">
              Philly perks, made easy
            </div>
            <h1 className="display fade-up-2" style={{ fontSize: 'clamp(44px, 7.4vw, 84px)', marginBottom: '20px', lineHeight: 0.94, letterSpacing: '-0.035em' }}>
              Your Philly favorites. Member perks. One place.
            </h1>
            <p className="fade-up-3" style={{ fontSize: 'clamp(17px, 2vw, 20px)', fontWeight: 600, color: 'var(--ink-2)', maxWidth: '560px', marginBottom: '14px', lineHeight: 1.45 }}>
              PerkPass brings Philly restaurants, cafes, gyms, self-care spots, and neighborhood gems into one simple local membership.
            </p>
            <p className="fade-up-3" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '520px', marginBottom: '30px', lineHeight: 1.65 }}>
              Open the app, pick a perk, show your code, and save. No clipping coupons. No awkward checkout math. Just Philly perks you actually want to use.
            </p>
            <div className="hero-actions fade-up-4">
              <Link href="/signup" className="btn btn-primary" style={{ fontSize: '17px', padding: '15px 28px' }}>
                Start saving for $3/mo
              </Link>
            </div>
            <div className="hero-proof">
              {[
                { n: '$3', l: 'Monthly access' },
                { n: 'Fresh', l: 'Deals rotate' },
                { n: 'Fast', l: 'Code redemption' },
                { n: 'Philly', l: 'Born locally' },
              ].map(s => (
                <div key={s.l} className="hero-proof-card">
                  <div className="display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--green)', lineHeight: 1, whiteSpace: 'nowrap' }}>{s.n}</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-3)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-label="PerkPass app preview">
            <div className="hero-shape hero-shape-one" />
            <div className="hero-shape hero-shape-two" />
            <div className="hero-float hero-float-left">
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 800, color: 'var(--green-dk)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Today&apos;s move</div>
              <div className="display" style={{ fontSize: '23px', lineHeight: 1 }}>Coffee, lunch, gym.</div>
            </div>
            <div className="hero-phone">
              <div className="hero-phone-screen">
                <div className="hero-phone-top">
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--green)', marginBottom: '8px' }}>Member deals</div>
                  <div className="display" style={{ fontSize: '28px', color: '#fff', lineHeight: 1 }}>Good for today.</div>
                </div>
                {[
                  { tag: 'Cafe • Fishtown', title: '$2 off any espresso drink', status: 'Available now' },
                  { tag: 'Restaurant • Center City', title: 'Free side with entree', status: 'Today 2-5PM' },
                  { tag: 'Fitness • Old City', title: '15% off first class pack', status: 'This week' },
                ].map((card) => (
                  <div key={card.title} className="hero-mini-card">
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 800, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{card.tag}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green-dk)', lineHeight: 1.25, marginBottom: '10px' }}>{card.title}</div>
                    <div style={{ display: 'inline-flex', background: 'var(--green-lt)', color: 'var(--green-dk)', borderRadius: '999px', padding: '4px 9px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.status}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-float hero-float-right">
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 800, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Redeem in seconds</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {['P', 'K', '7'].map((letter) => (
                  <div key={letter} className="display" style={{ background: 'var(--forest)', color: 'var(--green)', borderRadius: '8px', padding: '10px 0', textAlign: 'center', fontSize: '28px' }}>{letter}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="trust-strip-inner">
          {['Secure checkout by Stripe', 'No hidden fees', 'Philly-born and local-first'].map((item) => (
            <div key={item} className="trust-item">
              <span className="trust-dot" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Deals — card grid */}
      <section id="sneak-peek" style={{ padding: '64px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <div className="preview-kicker">Inside the app</div>
            <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)' }}>
              Sneak peek
            </h2>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '560px', lineHeight: 1.6 }}>
              Preview the kind of member-only perks we are bringing to Philly as we continue onboarding neighborhood cafes, restaurants, fitness studios, self-care spots, shops, and local favorites.
            </p>
          </div>

          <div className="preview-meta-grid">
            <div className="preview-meta-card">
              <div className="preview-meta-label">Browse</div>
              <div className="preview-meta-value">Neighborhood favorites across categories</div>
            </div>
            <div className="preview-meta-card">
              <div className="preview-meta-label">Discover</div>
              <div className="preview-meta-value">New spots, casual go-tos, and hidden gems</div>
            </div>
            <div className="preview-meta-card">
              <div className="preview-meta-label">Redeem</div>
              <div className="preview-meta-value">Fast, simple codes right from your phone</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {DEALS.map((d, i) => {
              const normalizedCategory = normalizeCategory(d.cat)
              const categoryMeta = getCategoryMeta(d.cat)
              const colors = CAT_COLORS[d.cat] || categoryMeta.color || { bg: 'var(--bg-2)', color: 'var(--ink-3)' }
              const photo = d.cat === 'Dessert'
                ? 'https://nstqhqhwhzzvhddnbwvg.supabase.co/storage/v1/object/public/business-photos/Homepage/Screenshot%202026-04-06%20at%203.04.06%20PM.png'
                : categoryMeta.photo
              return (
                <div key={i} className="deal-card">
                  {photo && (
                    <div style={{ position: 'relative' }}>
                      <img src={photo} alt={d.cat} className="deal-card-img" loading="lazy" />
                      <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--ink)', color: 'var(--bg)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 8px', borderRadius: '3px' }}>
                        Member preview
                      </span>
                    </div>
                  )}
                  <div className="deal-card-body">
                    <span style={{ display: 'inline-block', alignSelf: 'flex-start', background: colors.bg, color: colors.color, fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 9px', borderRadius: '4px' }}>
                      {d.cat === 'Dessert' ? d.cat : normalizedCategory}
                    </span>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--green-dk)', lineHeight: 1.35 }}>
                      {d.offer}
                    </div>
                  </div>
                </div>
              )
            })}
            <Link href="/for-business" style={{ textDecoration: 'none' }}>
              <div
                className="deal-card"
                style={{
                  background: 'var(--bg)',
                  border: '1.5px solid var(--forest)',
                  minHeight: '220px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '999px',
                    background: 'var(--green-lt)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '16px',
                    fontWeight: 800,
                    color: 'var(--green-dk)',
                  }}
                >
                  ↗
                </div>
                <div className="deal-card-body" style={{ justifyContent: 'center', gap: '16px', padding: '22px 18px 22px' }}>
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      background: 'var(--green-lt)',
                      color: 'var(--green-dk)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '12px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '4px 10px',
                      borderRadius: '999px',
                    }}
                  >
                    For business owners
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '26px', fontWeight: 900, color: 'var(--forest)', lineHeight: 1.05, maxWidth: '14ch' }}>
                    Wanna partner up? Let&apos;s do it.
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-3)', lineHeight: 1.5, maxWidth: '30ch' }}>
                    Put your business in front of locals already looking for their next favorite Philly spot.
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      alignSelf: 'flex-start',
                      color: 'var(--green-dk)',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '15px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <span>Apply now</span>
                    <span style={{ color: 'var(--green)' }}>→</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink-4)', marginBottom: '20px', lineHeight: 1.6 }}>
            And this is just a preview. More perks, neighborhoods, categories, and Philly favorites are waiting inside the membership.
          </p>
          <div>
            <Link href="/signup" className="btn btn-primary" style={{ fontSize: '17px' }}>
              Unlock Philly perks — $3/month
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '64px 24px', borderTop: '2px solid var(--ink)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ marginBottom: '28px' }}>
            <div className="preview-kicker">Quick answers</div>
            <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '10px' }}>
              FAQ
            </h2>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '520px', lineHeight: 1.6 }}>
              PerkPass is designed to be simple: join, browse, redeem, save.
            </p>
          </div>
          <div className="faq-grid">
            {FAQS.map((faq) => (
              <div key={faq.question} className="faq-card">
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1, marginBottom: '8px' }}>
                  {faq.question}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {SHOW_CREATOR_COLLABS && (
        <section style={{ padding: '64px 24px', borderTop: '2px solid var(--ink)' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
              <div className="preview-kicker">Creator collabs</div>
              <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', marginBottom: '10px' }}>
                The local voices we love.
              </h2>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--ink-3)', maxWidth: '560px', lineHeight: 1.6 }}>
                We want to feature our favorite IG foodies and community-driven creators who hype up great local businesses, bring real eyes to neighborhood gems, and do good for the city.
              </p>
            </div>

            <div className="creator-grid" style={{ marginBottom: '24px' }}>
              <div className="creator-card" style={{ background: 'var(--forest)', color: '#ffffff', borderColor: 'var(--forest)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', color: 'var(--green)', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
                  Community spotlight
                </div>
                <div className="display" style={{ fontSize: 'clamp(34px, 7vw, 52px)', color: '#ffffff', marginBottom: '14px' }}>
                  Creator Collab
                </div>
                <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'rgba(255,255,255,0.76)', marginBottom: '20px' }}>
                  PerkPass is built for the people already putting the city on. Foodies, storytellers, and neighborhood champions who help locals discover where to eat, shop, and show up.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  {['Local businesses', 'Community impact', 'Neighborhood culture'].map((item) => (
                    <span
                      key={item}
                      style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', borderRadius: '999px', background: 'rgba(255,255,255,0.08)', color: '#ffffff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <a
                  href="mailto:hello@getperkpass.com?subject=PerkPass%20Creator%20Collab"
                  className="btn"
                  style={{ background: '#ffffff', color: 'var(--forest)', fontSize: '15px', padding: '12px 18px' }}
                >
                  Pitch a creator
                </a>
              </div>

              <div className="creator-stack">
                {CREATORS.map((creator) => (
                  <div key={creator.handle} className="creator-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                        {creator.handle}
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-dk)', background: 'var(--green-lt)', padding: '4px 8px', borderRadius: '999px' }}>
                        Creator vibe
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px', fontWeight: 900, color: 'var(--ink)', lineHeight: 1.05, marginBottom: '10px' }}>
                      {creator.title}
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: '14px' }}>
                      {creator.body}
                    </p>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {creator.stats}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section style={{ padding: '64px 24px', background: 'var(--forest)', borderTop: '2px solid var(--ink)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', color: '#ffffff', marginBottom: '40px' }}>
            How it works
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {HOW.map(s => (
              <div key={s.num} style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="display" style={{ fontSize: '48px', color: 'var(--green)', flexShrink: 0, lineHeight: 1 }}>
                  {s.num}
                </div>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.01em', marginBottom: '6px' }}>
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

    </main>
  )
}
