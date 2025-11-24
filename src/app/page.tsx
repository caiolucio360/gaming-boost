import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { ElojobHero } from "@/components/layout/elojob-hero"

export const metadata: Metadata = generateMetadata({
  title: 'Início - GameBoost',
  description: 'Plataforma profissional de boost para Counter-Strike 2. Subimos seu rank Premier e Gamers Club com segurança e rapidez. Boosters verificados, entrega garantida.',
  keywords: [
    'boost cs2',
    'boost counter strike 2',
    'elo job cs2',
    'rank boost cs2',
    'boost premier cs2',
    'boost gamers club',
    'serviço de boost profissional',
    'boost seguro',
  ],
  canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br',
})

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GameBoost',
    description: 'Plataforma profissional de boost para Counter-Strike 2',
    url: siteUrl,
    logo: `${siteUrl}/principal.png`,
    foundingDate: '2025',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: '50+',
    },
    areaServed: {
      '@type': 'Country',
      name: 'BR',
    },
    sameAs: [],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'GameBoost',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/games/cs2?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Gaming Boost Service',
    provider: {
      '@type': 'Organization',
      name: 'GameBoost',
      url: siteUrl,
    },
    areaServed: {
      '@type': 'Country',
      name: 'BR',
    },
    description: 'Serviço profissional de boost de rank para Counter-Strike 2',
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'BRL',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />
      <div className="min-h-screen">
        <ElojobHero />
      </div>
    </>
  )
}
