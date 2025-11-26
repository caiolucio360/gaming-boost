'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarIcon, QuoteIcon } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Carlos Silva',
    game: 'League of Legends',
    rank: 'Diamond II',
    rating: 5,
    text: 'Serviço incrível! Meu booster foi muito profissional e conseguiu subir do Gold para Diamond em apenas 2 dias. Recomendo demais!',
    avatar: '/avatars/carlos.jpg',
    verified: true
  },
  {
    id: 2,
    name: 'Ana Santos',
    game: 'Valorant',
    rank: 'Immortal 2',
    rating: 5,
    text: 'Estava presa no Platinum há meses. O GameBoost me ajudou a chegar no Immortal! Equipe muito atenciosa e segura.',
    avatar: '/avatars/ana.jpg',
    verified: true
  },
  {
    id: 3,
    name: 'Pedro Costa',
    game: 'Counter-Strike 2',
    rank: 'Global Elite',
    rating: 5,
    text: 'Melhor serviço de boost que já usei. Transparência total, acompanhamento em tempo real e resultado garantido. Vale cada centavo!',
    avatar: '/avatars/pedro.jpg',
    verified: true
  },
  {
    id: 4,
    name: 'Mariana Lima',
    game: 'League of Legends',
    rank: 'Master',
    rating: 5,
    text: 'Incrível como conseguiram subir minha conta de forma tão rápida e segura. Chat offline funcionou perfeitamente. 5 estrelas!',
    avatar: '/avatars/mariana.jpg',
    verified: true
  },
  {
    id: 5,
    name: 'Rafael Oliveira',
    game: 'Valorant',
    rank: 'Radiant',
    rating: 5,
    text: 'Cheguei no Radiant! O serviço é top, boosters muito bons e o suporte 24/7 é sensacional. Vou contratar novamente!',
    avatar: '/avatars/rafael.jpg',
    verified: true
  },
  {
    id: 6,
    name: 'Julia Ferreira',
    game: 'Counter-Strike 2',
    rank: 'Supreme Master',
    rating: 5,
    text: 'Profissionais de verdade! Meu booster era muito experiente e me manteve informada de todo o progresso. Recomendo!',
    avatar: '/avatars/julia.jpg',
    verified: true
  }
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-black text-white" aria-labelledby="testimonials-heading">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 id="testimonials-heading" className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Depoimentos
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Veja o que nossos clientes dizem sobre nossos serviços
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.id} 
              className="relative bg-gray-900 border-purple-600/50 hover:shadow-lg hover:shadow-purple-500/20 transition-colors duration-200 overflow-hidden group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="mb-4">
                  <QuoteIcon className="h-8 w-8 text-purple-400 group-hover:text-purple-300 transition-colors" aria-hidden="true" />
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                  ))}
                </div>

                {/* Testimonial Text */}
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="bg-brand-purple text-white">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-white">{testimonial.name}</h4>
                      {testimonial.verified && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-purple-400">{testimonial.game}</p>
                    <p className="text-xs text-gray-400">{testimonial.rank}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-20 grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">1000+</div>
            <div className="text-gray-300">Clientes Satisfeitos</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">4.9</div>
            <div className="text-gray-300">Avaliação Média</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">24/7</div>
            <div className="text-gray-300">Suporte Online</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">100%</div>
            <div className="text-gray-300">Segurança Garantida</div>
          </div>
        </div>
      </div>
    </section>
  )
}
