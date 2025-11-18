import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = generateMetadata({
  title: 'Calculadora de Preços - GameBoost Pro',
  description: 'Calcule o preço do seu boost de rank para Counter-Strike 2. Modos Premier e Gamers Club disponíveis. Preços transparentes e competitivos. Simule seu boost agora.',
  keywords: [
    'preços boost cs2',
    'calculadora boost cs2',
    'quanto custa boost cs2',
    'preço boost premier',
    'preço boost gamers club',
    'calculadora preço boost',
    'simulador preço boost',
  ],
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/pricing`,
})

export default function PricingPage() {
  const games = [
    {
      name: 'Counter-Strike 2',
      description: 'Sistema CS Rating com pontuações de 0 a 30.000+',
      href: '/games/cs2/pricing',
      icon: '🔫',
      features: ['CS2 Premier Mode', 'Gamers Club', 'Entrega rápida', 'Conta 100% segura']
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold text-white font-orbitron mb-3 md:mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">CALCULADORA</span>
            <span className="text-white"> DE PREÇOS</span>
          </h1>
          <p className="text-base md:text-xl text-gray-300 font-rajdhani px-4" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Escolha o jogo para calcular o preço do seu boost
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 md:gap-8">
            {games.map((game) => (
              <Link
                key={game.name}
                href={game.href}
                className="group bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-6 md:p-8 hover:border-purple-400 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105"
              >
                <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
                  <div className="text-4xl md:text-6xl">{game.icon}</div>
                  <div className="flex-1">
                    <h2 className="text-xl md:text-3xl font-bold text-white font-orbitron mb-2 md:mb-3" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                      {game.name}
                    </h2>
                    <p className="text-sm md:text-lg text-gray-300 font-rajdhani mb-3 md:mb-4" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      {game.description}
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 md:mb-0">
                      {game.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm md:text-base text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 flex-shrink-0"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 md:mt-6 flex items-center text-sm md:text-base text-purple-300 font-rajdhani group-hover:text-purple-200 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
                      <span>Calcular preços</span>
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
