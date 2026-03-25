import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PerkPass — Philly Local Deals',
  description: 'Stop paying full price. Exclusive deals at Philly restaurants, barbers, gyms, cafes, and more. $3/month.',
  openGraph: {
    title: 'PerkPass — Philly Local Deals',
    description: 'Stop paying full price. $3/month.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#5fa061" />
      </head>
      <body>{children}</body>
    </html>
  )
}