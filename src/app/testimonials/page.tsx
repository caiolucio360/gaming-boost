import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = generateMetadata({
  title: 'Depoimentos - GameBoost',
  description: 'Veja o que nossos clientes dizem sobre nossos serviços de boost. Mais de 10.000 clientes satisfeitos com boost de rank em Counter-Strike 2.',
  keywords: [
    'depoimentos boost',
    'avaliações gameboost',
    'feedback clientes',
    'testimonials boost cs2',
  ],
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/testimonials`,
})

export default function TestimonialsPage() {
  const testimonials = [
    {
      name: "João",
      game: "Counter-Strike 2",
      rank: "Global Elite",
      text: "Cara q serviço foda! Conseguiram meu boost em 2 dias só nem acreditei. Valeu cada real gasto!",
      rating: 5,
      avatar: "J"
    },
    {
      name: "Ana",
      game: "Counter-Strike 2",
      rank: "Supreme",
      text: "Mto bom mesmo! Rapido e eficiente conseguiram meu objetivo super rapido. Parabéns pela qualidade!",
      rating: 4,
      avatar: "A"
    },
    {
      name: "Carlos",
      game: "Counter-Strike 2",
      rank: "Legendary Eagle Master",
      text: "Atendimento top! Tiraram todas minhas duvidas e entregaram certinho no prazo. Recomendo dmss!",
      rating: 5,
      avatar: "C"
    },
    {
      name: "Fernanda",
      game: "Counter-Strike 2",
      rank: "Distinguished Master Guardian",
      text: "Experiencia incrivel! Profissionais de verdade resultados excepcionais. Super recomendo pra td mundo!",
      rating: 5,
      avatar: "F"
    },
    {
      name: "Rafa",
      game: "Counter-Strike 2",
      rank: "Master Guardian Elite",
      text: "Melhor serviço q ja usei! Suporte 24/7 e entrega rapida demais. Recomendo pra todos os amigos!",
      rating: 4,
      avatar: "R"
    },
    {
      name: "Lucas",
      game: "Counter-Strike 2",
      rank: "Gold Nova Master",
      text: "Bom serviço! Fizeram o boost certinho mas demorou um pouco mais q o esperado. Mesmo assim recomendo!",
      rating: 3,
      avatar: "L"
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent">DEPOIMENTOS</span>
            <span className="text-white"> DE CLIENTES</span>
          </h1>
          <p className="text-xl text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Veja o que nossos clientes dizem sobre nossos serviços
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/30 overflow-hidden"
            >
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold font-rajdhani mr-4 shadow-lg" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                      {testimonial.name}
                    </h3>
                    <p className="text-purple-300 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      {testimonial.game}
                    </p>
                  </div>
                </div>

                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">★</span>
                  ))}
                </div>

                <p className="text-gray-300 font-rajdhani leading-relaxed" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  "{testimonial.text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  )
}
