import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://getperkpass.com'),
  title: {
    default: 'PerkPass — Philadelphia Local Deals Membership',
    template: '%s | PerkPass',
  },
  description:
    "PerkPass is Philadelphia's local deals membership. Exclusive discounts at Philly restaurants, cafes, barbers, gyms, and nail salons — all for $3/month. Cancel anytime.",
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
      'Exclusive deals at Philly restaurants, cafes, barbers, gyms, and nail salons. $3/month. Cancel anytime.',
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
      'Exclusive deals at Philly restaurants, cafes, barbers, gyms, and nail salons. $3/month.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://getperkpass.com',
  },
  icons: {
    icon: '/favicon.ico',
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
                "Philadelphia's local deals membership. Exclusive discounts at restaurants, cafes, barbers, gyms, and nail salons for $3/month.",
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
            borderTop: '1px solid var(--border)',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/about"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--ink-4)',
              textDecoration: 'none',
            }}
          >
            About us
          </Link>
          <Link
            href="/offerings"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--ink-4)',
              textDecoration: 'none',
            }}
          >
            Our offerings
          </Link>
          <Link
            href="/newsroom"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--ink-4)',
              textDecoration: 'none',
            }}
          >
            Newsroom
          </Link>
        </footer>
      </body>
    </html>
  )
}
