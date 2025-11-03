import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Serviços - Boost de Rank CS2',
  description: 'Oferecemos boost de rank para Counter-Strike 2 em modos Premier e Gamers Club. Serviço profissional, seguro e rápido com boosters verificados.',
  keywords: [
    'serviços boost cs2',
    'boost de rank cs2',
    'boost premier cs2',
    'boost gamers club',
    'serviço boost profissional',
    'elo job cs2',
  ],
})

export default function ServicesPage() {
  const services = [
    {
      title: "BOOST DE RANK",
      description: "Subimos seu rank de forma segura e profissional",
      features: [
        "Entrega rápida",
        "Conta 100% segura",
        "Suporte 24/7"
      ],
      icon: "⚡"
    },
    {
      title: "COACHING",
      description: "Aprenda com jogadores experientes",
      features: [
        "Sessões personalizadas",
        "Análise de gameplay",
        "Estratégias avançadas",
        "Mentoria individual"
      ],
      icon: "🎖️",
      comingSoon: true
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">NOSSOS</span>
            <span className="text-white"> SERVIÇOS</span>
          </h1>
          <p className="text-xl text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Oferecemos os melhores serviços para elevar seu jogo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8 hover:border-purple-400 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{service.icon}</div>
                <h2 className="text-3xl font-bold text-white font-orbitron mb-3" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  {service.title}
                  {service.comingSoon && (
                    <span className="text-sm text-purple-400 font-semibold ml-2">(em breve)</span>
                  )}
                </h2>
                <p className="text-gray-300 font-rajdhani text-lg" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
                  {service.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    {feature}
                  </li>
                ))}
              </ul>

            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
