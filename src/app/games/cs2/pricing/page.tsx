import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { CS2Calculator } from '@/components/games/cs2-calculator'

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
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/games/cs2/pricing`,
})

export default function CS2PricingPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">PREÇOS</span>
            <span className="text-white"> CS2</span>
          </h1>
          <p className="text-xl text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Calcule o preço do seu boost no Counter-Strike 2
          </p>
        </div>

        <CS2Calculator />
      </div>
    </div>
  )
}
