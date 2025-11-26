import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'

export const metadata: Metadata = generateMetadata({
  title: 'Sobre Nós - GameBoost',
  description: 'Conheça a GameBoost, plataforma líder em serviços de boost para jogos. Mais de 10.000 clientes satisfeitos. Profissionais verificados, entrega rápida e segura.',
  keywords: [
    'sobre GameBoost',
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
            name: 'GameBoost',
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
              <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">SOBRE</span>
              <span className="text-white"> NÓS</span>
            </h1>
            <p className="text-xl text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
              A melhor plataforma de boost para gamers do Brasil
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 overflow-hidden">
              {/* Efeito de brilho sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardHeader className="relative z-10">
                <CardTitle className="text-3xl font-bold text-white font-orbitron group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">NOSSA</span>
                  <span className="text-white"> HISTÓRIA</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Fundada em 2020, a GameBoost nasceu da paixão por jogos e da necessidade de oferecer 
                  serviços de boost profissionais e seguros para a comunidade gamer brasileira. Nossa equipe 
                  é formada por jogadores experientes que entendem as dificuldades de subir de rank e alcançar 
                  objetivos nos jogos mais populares.
                </p>
                <p className="text-gray-300 font-rajdhani leading-relaxed group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  Com mais de 10.000 clientes satisfeitos, nos tornamos referência em serviços de boost, 
                  oferecendo qualidade, segurança e eficiência em cada projeto. Nossa missão é ajudar 
                  jogadores a alcançarem seus objetivos de forma segura e profissional.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12 lg:mb-16">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/30 transition-colors duration-200 overflow-hidden"
                style={{
                }}
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="pt-6 text-center relative z-10">
                  <div className="text-4xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 inline-block">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white font-orbitron mb-3 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </div>
    </>
  )
}
