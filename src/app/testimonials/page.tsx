export default function TestimonialsPage() {
  const testimonials = [
    {
      name: "João Silva",
      game: "Counter-Strike 2",
      rank: "Global Elite",
      text: "Serviço excepcional! Conseguiu meu boost em apenas 2 dias. Profissionais e confiáveis.",
      rating: 5,
      avatar: "JS"
    },
    {
      name: "Maria Santos",
      game: "League of Legends",
      rank: "Challenger",
      text: "Melhor serviço de boost que já usei. Suporte 24/7 e entrega rápida. Recomendo!",
      rating: 5,
      avatar: "MS"
    },
    {
      name: "Pedro Costa",
      game: "Valorant",
      rank: "Radiant",
      text: "Profissionais de verdade! Meu boost foi feito com segurança total. Vale cada centavo.",
      rating: 5,
      avatar: "PC"
    },
    {
      name: "Ana Oliveira",
      game: "Counter-Strike 2",
      rank: "Supreme",
      text: "Serviço rápido e eficiente. Conseguiu meu objetivo em tempo recorde. Parabéns!",
      rating: 5,
      avatar: "AO"
    },
    {
      name: "Carlos Lima",
      game: "League of Legends",
      rank: "Master",
      text: "Atendimento de primeira! Resolveram todas minhas dúvidas e entregaram no prazo.",
      rating: 5,
      avatar: "CL"
    },
    {
      name: "Fernanda Rocha",
      game: "Valorant",
      rank: "Immortal",
      text: "Experiência incrível! Profissionais dedicados e resultados excepcionais. Super recomendo!",
      rating: 5,
      avatar: "FR"
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">DEPOIMENTOS</span>
            <span className="text-white"> DE CLIENTES</span>
          </h1>
          <p className="text-xl text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Veja o que nossos clientes dizem sobre nossos serviços
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-6 hover:border-purple-400 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold font-rajdhani mr-4" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                  {testimonial.avatar}
                </div>
                <div>
                  <h3 className="text-white font-bold font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    {testimonial.name}
                  </h3>
                  <p className="text-purple-300 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                    {testimonial.game} - {testimonial.rank}
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
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
