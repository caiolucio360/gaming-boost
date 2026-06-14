import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { CS2Calculator } from '@/components/games/cs2-calculator'
import type { ServiceType } from '@/lib/games-config'

export const metadata: Metadata = generateMetadata({
  title: 'Preços CS2 - Calculadora de Boost',
  description: 'Calcule o preço do seu boost de rank para Counter-Strike 2. Modos Premier e Gamers Club disponíveis. Preços transparentes e competitivos.',
  keywords: [
    'preços boost cs2',
    'calculadora boost cs2',
    'quanto custa boost cs2',
    'preço boost premier',
    'preço boost gamers club',
  ],
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.flautasboost.com.br'}/games/cs2/pricing`,
})

const VALID_SERVICES: ServiceType[] = ['RANK_BOOST', 'DUO_BOOST', 'COACHING']

interface Props {
  searchParams: Promise<{ service?: string }>
}

export default async function CS2PricingPage({ searchParams }: Props) {
  const { service } = await searchParams
  const initialService = VALID_SERVICES.includes(service as ServiceType)
    ? (service as ServiceType)
    : 'RANK_BOOST'

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Brilho atmosférico de fundo — profundidade sutil atrás do configurador */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand-purple/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-purple/60 to-transparent"
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
        <div className="mb-10 text-center sm:mb-12">
          <h1 className="mb-4 font-orbitron text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-brand-purple-light via-brand-purple to-brand-purple-light bg-clip-text text-transparent drop-shadow-glow">
              CALCULE
            </span>{' '}
            SEU BOOST
          </h1>
          <p className="mx-auto max-w-2xl font-rajdhani text-lg font-medium text-muted-foreground sm:text-xl">
            Monte seu serviço, veja o preço na hora e contrate em segundos.
          </p>
        </div>

        <CS2Calculator initialService={initialService} />
      </div>
    </div>
  )
}
