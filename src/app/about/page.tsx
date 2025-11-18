import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Sobre Nós - GameBoost Pro',
  description: 'Conheça a GameBoost Pro, plataforma líder em serviços de boost para jogos. Mais de 10.000 clientes satisfeitos. Profissionais verificados, entrega rápida e segura.',
  keywords: [
    'sobre gameboost pro',
    'quem somos',
    'história gameboost',
    'boost profissional',
    'boost seguro',
  ],
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/about`,
})

export default function AboutPage() {
  const features = [
    {
      icon: "⚡",
      title: "VELOCIDADE",
      description: "Entrega rápida e eficiente em todos os nossos serviços"
    },
    {
      icon: "🛡️",
      title: "SEGURANÇA",
      description: "Proteção total da sua conta com métodos seguros"
    },
    {
      icon: "👥",
      title: "PROFISSIONAIS",
      description: "Equipe de jogadores experientes e qualificados"
    },
    {
      icon: "📞",
      title: "SUPORTE",
      description: "Atendimento 24/7 para resolver todas suas dúvidas"
    }
  ]

  return (
    <>
      {/* Structured Data para SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'GameBoost Pro',
            description: 'Plataforma profissional de boost para jogos',
            url: 'https://gameboostpro.com.br',
            logo: 'https://gameboostpro.com.br/principal.png',
            foundingDate: '2020',
            numberOfEmployees: {
              '@type': 'QuantitativeValue',
              value: '50+',
            },
            areaServed: {
              '@type': 'Country',
              name: 'BR',
            },
            sameAs: [
              // Adicione links de redes sociais aqui quando tiver
            ],
          }),
        }}
      />
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
              <span className="text-purple-300">SOBRE</span>
              <span className="text-white"> NÓS</span>
            </h1>
            <p className="text-xl text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
              A melhor plataforma de boost para gamers do Brasil
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-8">
              <h2 className="text-3xl font-bold text-white font-orbitron mb-6" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                <span className="text-purple-300">NOSSA</span>
                <span className="text-white"> HISTÓRIA</span>
              </h2>
              <p className="text-gray-300 font-rajdhani leading-relaxed mb-6" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                Fundada em 2020, a GameBoost Pro nasceu da paixão por jogos e da necessidade de oferecer 
                serviços de boost profissionais e seguros para a comunidade gamer brasileira. Nossa equipe 
                é formada por jogadores experientes que entendem as dificuldades de subir de rank e alcançar 
                objetivos nos jogos mais populares.
              </p>
              <p className="text-gray-300 font-rajdhani leading-relaxed" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                Com mais de 10.000 clientes satisfeitos, nos tornamos referência em serviços de boost, 
                oferecendo qualidade, segurança e eficiência em cada projeto. Nossa missão é ajudar 
                jogadores a alcançarem seus objetivos de forma segura e profissional.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-6 text-center hover:border-purple-400 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white font-orbitron mb-3" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  {feature.title}
                </h3>
                <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}
