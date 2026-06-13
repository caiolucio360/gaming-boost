import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.flautasboost.com.br'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Bloqueia áreas autenticadas/privadas e a API. NÃO bloquear `/_next/` —
        // os crawlers precisam do CSS/JS crítico de renderização para indexar (mobile-first).
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/booster/',
          '/cart/',
          '/payment/',
          '/profile/',
          '/notifications',
          '/login',
          '/register',
          '/verify',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

