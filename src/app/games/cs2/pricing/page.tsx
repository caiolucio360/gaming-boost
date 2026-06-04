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
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">PREÇOS</span>
            <span className="text-white"> CS2</span>
          </h1>
          <p className="text-xl text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Calcule o preço do seu boost no Counter-Strike 2
          </p>
        </div>

        <CS2Calculator initialService={initialService} />
      </div>
    </div>
  )
}
