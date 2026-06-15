import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { ElojobHero } from "@/components/layout/elojob-hero"
import { HowItWorks } from "@/components/home/how-it-works"
import { PlaceholderSection } from "@/components/home/placeholder-section"
import { getTrustpilotAggregateRating } from '@/lib/trustpilot'

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

  // Only emitted when real Trustpilot rating values are configured (no fake data).
  const aggregateRatingSchema = getTrustpilotAggregateRating(siteUrl)

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
      {aggregateRatingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(aggregateRatingSchema),
          }}
        />
      )}
      <div className="min-h-screen">
        <ElojobHero />

        {/*
          Home scroll skeleton — sections render top-to-bottom, each revealing on
          scroll (see `@/components/home/reveal`). "Como funciona" is the finished
          reference section; the placeholders mark the remaining sections to build.
        */}

        {/* TODO(home): Prova social — 4.9★, pedidos concluídos, satisfação.
            Use getTrustpilotAggregateRating / DB; render nothing if no real data. */}
        <PlaceholderSection
          title="Prova social"
          notes="Barra de avaliação (4.9★), pedidos concluídos e satisfação — somente com dados reais."
          tone="muted"
        />

        {/* TODO(home): Diferenciais — nosso trunfo: boost ao lado de um ex-profissional. */}
        <PlaceholderSection
          title="Por que a FlautasBoost"
          notes="Cards de diferenciais — segurança da conta, eficiência e a experiência de um ex-jogador profissional."
        />

        {/* Finished reference section */}
        <HowItWorks />

        {/* TODO(home): Serviços CS2 — cards puxando de games-config.ts (Premier, Duo, Coaching). */}
        <PlaceholderSection
          title="Nossos serviços"
          notes="Cards de serviço (Premier, Duo Boost, Coaching) com preço dinâmico via /api/pricing/calculate."
        />

        {/* TODO(home): Depoimentos — carrossel/grid; só com reviews reais. */}
        <PlaceholderSection
          title="O que dizem os clientes"
          notes="Carrossel de depoimentos verificados — placeholder até integrar reviews reais."
          tone="muted"
        />

        {/* TODO(home): FAQ — accordion shadcn (segurança, pagamento, prazo, reembolso). */}
        <PlaceholderSection
          title="Perguntas frequentes"
          notes="Accordion (shadcn) — segurança da conta, pagamento PIX, prazo de entrega e reembolso."
        />

        {/* TODO(home): CTA final — faixa com gradiente brand + botão Contrate já. */}
        <PlaceholderSection
          title="Pronto para subir de rank?"
          notes="Faixa de CTA final com gradiente brand e botão 'Contrate já'."
          tone="muted"
        />
      </div>
    </>
  )
}
