import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow Google to crawl public pages
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/member',
          '/business',
          '/account',
          '/api',
          '/success',
        ],
      },
    ],
    sitemap: 'https://getperkpass.com/sitemap.xml',
  }
}
