import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/booster/',
          '/cart/',
          '/payment/',
          '/profile/',
          '/(auth)/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

