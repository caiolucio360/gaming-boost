'use client'

import Link from 'next/link'

export default function CS2Page() {
  const services = [
    {
      title: "BOOST DE RANK",
      description: "Subimos seu rank de forma segura e profissional",
      features: [
        "CS2 Premier Mode",
        "Gamers Club", 
        "Entrega rápida",
        "Conta 100% segura",
        "Suporte 24/7"
      ],
      icon: "⚡",
      href: "/games/cs2/pricing",
      available: true
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
      href: "#",
      available: false
    }
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">COUNTER-STRIKE 2</span>
          </h1>
          <p className="text-xl text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Escolha o serviço que melhor atende suas necessidades
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div
                key={index}
                className={`bg-black/30 backdrop-blur-md border rounded-lg p-8 transition-all duration-300 ${
                  service.available
                    ? 'border-purple-500/50 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105 cursor-pointer'
                    : 'border-gray-500/30 opacity-60 cursor-not-allowed'
                }`}
              >
                {service.available ? (
                  <Link href={service.href} className="block">
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">{service.icon}</div>
                      <h2 className="text-3xl font-bold text-white font-orbitron mb-3" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                        {service.title}
                      </h2>
                      <p className="text-gray-300 font-rajdhani text-lg" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
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

                    <div className="text-center">
                      <div className="inline-flex items-center text-purple-300 font-rajdhani group-hover:text-purple-200 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
                        <span>Continuar</span>
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div>
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">{service.icon}</div>
                      <h2 className="text-3xl font-bold text-white font-orbitron mb-3" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                        {service.title}
                      </h2>
                      <p className="text-gray-300 font-rajdhani text-lg" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                        {service.description}
                      </p>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                          <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="text-center">
                      <div className="inline-flex items-center justify-center px-6 py-3 bg-gray-500/20 border border-gray-500/50 rounded-lg text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
                        <span className="text-sm text-purple-400 font-semibold mr-2">(em breve)</span>
                        <span>Em desenvolvimento</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}