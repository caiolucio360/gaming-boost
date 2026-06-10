import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export const metadata: Metadata = generateMetadata({
  title: 'Sobre Nós - FlautasBoost',
  description: 'Conheça a FlautasBoost, plataforma líder em serviços de boost para jogos. Mais de 10.000 clientes satisfeitos. Profissionais verificados, entrega rápida e segura.',
  keywords: [
    'sobre FlautasBoost',
    'quem somos',
    'história gameboost',
    'boost profissional',
    'boost seguro',
  ],
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.flautasboost.com.br'}/about`,
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
            name: 'FlautasBoost',
            description: 'Plataforma profissional de boost para jogos',
            url: 'https://www.flautasboost.com.br',
            logo: 'https://www.flautasboost.com.br/flautas/flautasboost-horizontal.png',
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
      <div className="min-h-screen bg-brand-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontWeight: '800' }}>
              <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">SOBRE</span>
              <span className="text-white"> NÓS</span>
            </h1>
            <p className="text-xl text-brand-gray-300 font-rajdhani group-hover:text-brand-gray-200 transition-colors duration-300" style={{ fontWeight: '500' }}>
              A melhor plataforma de boost para gamers do Brasil
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-16">
            <Card className="group relative bg-gradient-to-br from-brand-black/40 via-brand-black/30 to-brand-black/40 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light/80 hover:shadow-xl hover:shadow-brand-purple/20 transition-colors duration-200 overflow-hidden">
              {/* Efeito de brilho sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/5 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardHeader className="relative z-10">
                <CardTitle className="text-3xl font-bold text-white font-orbitron group-hover:text-brand-purple-light transition-colors duration-300" style={{ fontWeight: '700' }}>
                  <span className="bg-gradient-to-r from-brand-purple-light to-brand-purple-light bg-clip-text text-transparent">NOSSA</span>
                  <span className="text-white"> HISTÓRIA</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <p className="text-brand-gray-300 font-rajdhani leading-relaxed group-hover:text-brand-gray-200 transition-colors duration-300" style={{ fontWeight: '400' }}>
                  Fundada em 2020, a FlautasBoost nasceu da paixão por jogos e da necessidade de oferecer 
                  serviços de boost profissionais e seguros para a comunidade gamer brasileira. Nossa equipe 
                  é formada por jogadores experientes que entendem as dificuldades de subir de rank e alcançar 
                  objetivos nos jogos mais populares.
                </p>
                <p className="text-brand-gray-300 font-rajdhani leading-relaxed group-hover:text-brand-gray-200 transition-colors duration-300" style={{ fontWeight: '400' }}>
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
                className="group relative bg-gradient-to-br from-brand-black/40 via-brand-black/30 to-brand-black/40 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light/80 hover:shadow-2xl hover:shadow-brand-purple/30 transition-colors duration-200 overflow-hidden"
                style={{
                }}
              >
                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/10 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="pt-6 text-center relative z-10">
                  <div className="text-4xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 inline-block">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white font-orbitron mb-3 group-hover:text-brand-purple-light transition-colors duration-300" style={{ fontWeight: '700' }}>
                    {feature.title}
                  </h3>
                  <p className="text-brand-gray-300 font-rajdhani group-hover:text-brand-gray-200 transition-colors duration-300" style={{ fontWeight: '400' }}>
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
