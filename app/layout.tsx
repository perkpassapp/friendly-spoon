import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

const FOOTER_GROUPS = [
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About us' },
      { href: '/offerings', label: 'Our offerings' },
      { href: '/newsroom', label: 'Newsroom' },
      { href: '/influencer-creator-opportunity', label: 'Influencer creator opportunity' },
    ],
  },
  {
    title: 'Members',
    links: [
      { href: '/signup', label: 'Get PerkPass' },
      { href: '/member/login', label: 'Member login' },
      { href: '/for-business', label: 'For businesses' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/support', label: 'Support' },
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/refund-policy', label: 'Refund policy' },
    ],
  },
]

export const metadata: Metadata = {
  metadataBase: new URL('https://getperkpass.com'),
  title: {
    default: 'PerkPass — Philadelphia Local Deals Membership',
    template: '%s | PerkPass',
  },
  description:
    "PerkPass is Philadelphia's local perks membership. Discover member-only deals at Philly restaurants, cafes, gyms, salons, shops, and neighborhood favorites for $3/month.",
  keywords: [
    'Philadelphia deals',
    'Philly discounts',
    'Philadelphia restaurant deals',
    'local deals Philadelphia',
    'Philadelphia membership',
    'Philly local perks',
    'Philadelphia dining deals',
    'Philadelphia gym discounts',
  ],
  authors: [{ name: 'PerkPass', url: 'https://getperkpass.com' }],
  creator: 'PerkPass',
  publisher: 'PerkPass',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://getperkpass.com',
    siteName: 'PerkPass',
    title: 'PerkPass — Philadelphia Local Deals Membership',
    description:
      'Philadelphia perks at local restaurants, cafes, gyms, salons, shops, and neighborhood favorites. $3/month. Built for Philly locals.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PerkPass — Philadelphia Local Deals',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PerkPass — Philadelphia Local Deals Membership',
    description:
      'Philadelphia perks at local restaurants, cafes, gyms, salons, shops, and neighborhood favorites. $3/month.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://getperkpass.com',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#5fa061" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              name: 'PerkPass',
              description:
                "Philadelphia's local perks membership. Member-only deals at restaurants, cafes, gyms, salons, shops, and neighborhood favorites for $3/month.",
              url: 'https://getperkpass.com',
              areaServed: {
                '@type': 'City',
                name: 'Philadelphia',
                sameAs: 'https://en.wikipedia.org/wiki/Philadelphia',
              },
              provider: {
                '@type': 'Organization',
                name: 'PerkPass',
                url: 'https://getperkpass.com',
                logo: 'https://getperkpass.com/apple-touch-icon.png',
              },
              offers: {
                '@type': 'Offer',
                price: '3.00',
                priceCurrency: 'USD',
                description: 'Monthly membership giving access to exclusive local deals in Philadelphia.',
              },
            }),
          }}
        />
      </head>
      <body>
        {children}
        <footer
          style={{
            borderTop: '2px solid var(--ink)',
            background: 'var(--forest)',
            color: '#ffffff',
            padding: '48px 24px 28px',
          }}
        >
          <div style={{ maxWidth: '1120px', margin: '0 auto', width: '100%' }}>
            <div className="site-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) repeat(3, minmax(140px, 1fr))', gap: '24px 40px', alignItems: 'start', marginBottom: '32px' }}>
              <div className="site-footer-brand">
                <Link href="/" className="pp-logo pp-logo-light" style={{ color: '#ffffff', display: 'block', width: 'fit-content', marginBottom: '12px' }}>
                  Perk<span>Pass</span>
                </Link>
                <p className="site-footer-blurb" style={{ fontSize: '15px', lineHeight: 1.65, color: 'rgba(255,255,255,0.68)', maxWidth: '320px', marginBottom: '14px' }}>
                  A Philly-born local perks membership helping neighbors discover and save at restaurants, cafes, gyms, salons, shops, and everyday neighborhood favorites.
                </p>
                <a
                  href="mailto:hello@getperkpass.com"
                  className="site-footer-email"
                  style={{ fontSize: '14px', fontWeight: 600, color: 'var(--green)', textDecoration: 'none' }}
                >
                  hello@getperkpass.com
                </a>
              </div>

              {FOOTER_GROUPS.map((group) => (
                <div key={group.title}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.45)', marginBottom: '12px' }}>
                    {group.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {group.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: 'rgba(255,255,255,0.82)',
                          textDecoration: 'none',
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="site-footer-meta" style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                2026 PerkPass. Philly-born and built for local discovery.
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                Secure checkout powered by Stripe.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
