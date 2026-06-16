import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { ElojobHero } from "@/components/layout/elojob-hero"
import { HomeBackground } from "@/components/home/home-background"
import { SocialProof } from "@/components/home/social-proof"
import { WhyUs } from "@/components/home/why-us"
import { HowItWorks } from "@/components/home/how-it-works"
import { Services } from "@/components/home/services"
// Testimonials section hidden until we have real reviews — not in use yet.
// import { Testimonials } from "@/components/home/testimonials"
import { Faq } from "@/components/home/faq"
import { FinalCta } from "@/components/home/final-cta"
// Rating-related features are disabled until we have real review data.
// import { getTrustpilotAggregateRating } from '@/lib/trustpilot'

export const metadata: Metadata = generateMetadata({
  title: 'Início - FlautasBoost',
  description: 'Subimos seu rank com segurança e rapidez. Boosters verificados, entrega garantida.',
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
  canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.flautasboost.com.br',
})

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.flautasboost.com.br'

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FlautasBoost',
    description: 'Plataforma profissional de boost para Counter-Strike 2',
    url: siteUrl,
    logo: `${siteUrl}/flautas/flautasboost-horizontal.png`,
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
    name: 'FlautasBoost',
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
      name: 'FlautasBoost',
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

  // Rating schema disabled for now — re-enable once real review data exists.
  // const aggregateRatingSchema = getTrustpilotAggregateRating(siteUrl)

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
      {/* Rating schema disabled until real review data exists.
      {aggregateRatingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(aggregateRatingSchema),
          }}
        />
      )} */}
      {/*
        Home — long, scroll-driven page. One page-wide HomeBackground sits behind
        all sections so the colour flows continuously and bleeds across section
        boundaries (sections are transparent, no separating bars). Each section
        reveals on scroll (see `@/components/home/reveal`).
      */}
      <div className="relative min-h-screen">
        <HomeBackground />
        <div className="relative z-10">
          <ElojobHero />
          <SocialProof />
          <WhyUs />
          <HowItWorks />
          <Services />
          {/* Testimonials hidden until we have real reviews. <Testimonials /> */}
          <Faq />
          <FinalCta />
        </div>
      </div>
    </>
  )
}
