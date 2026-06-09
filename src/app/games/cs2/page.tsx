'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Como é client component, precisamos usar generateMetadata em um layout ou criar um wrapper
export default function CS2Page() {
  const services = [
    {
      title: "BOOST",
      description: "Subimos seu rank Premier do CS2 de forma segura e profissional",
      features: [
        "CS2 Premier Mode",
        "Entrega rápida",
        "Conta 100% segura",
        "Suporte 24/7",
        "Boosters verificados"
      ],
      icon: "⚡",
      href: "/games/cs2/pricing?service=RANK_BOOST",
      available: true
    },
    {
      title: "DUO BOOST",
      description: "Jogue ao lado de um booster profissional e suba de rank juntos",
      features: [
        "CS2 Premier Mode",
        "Você joga na sua conta",
        "Booster profissional ao seu lado",
        "Entrega rápida",
        "Suporte 24/7"
      ],
      icon: "🤝",
      href: "/games/cs2/pricing?service=DUO_BOOST",
      available: true
    },
    {
      title: "COACHING",
      description: "Aprenda com jogadores experientes e melhore seu gameplay",
      features: [
        "Sessões personalizadas",
        "Análise de gameplay",
        "Estratégias avançadas",
        "Mentoria individual",
        "Feedback em tempo real"
      ],
      icon: "🎖️",
      href: "/games/cs2/pricing?service=COACHING",
      available: true
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
            '@type': 'Service',
            name: 'Boost de Rank CS2',
            description: 'Serviço profissional de boost de rank para Counter-Strike 2',
            provider: {
              '@type': 'Organization',
              name: 'FlautasBoost',
              url: 'https://www.flautasboost.com.br',
            },
            areaServed: 'BR',
            serviceType: 'Gaming Service',
          }),
        }}
      />
      <div className="min-h-screen bg-brand-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
              <span className="text-brand-purple-light">COUNTER-STRIKE 2</span>
            </h1>
            <p className="text-xl text-brand-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
              Escolha o serviço que melhor atende suas necessidades
            </p>
          </div>

          <div className="max-w-6xl xl:max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {services.map((service, index) => {
                const isClickable = service.available

                const cardElement = (
                  <Card
                    className={`group relative h-full bg-gradient-to-br from-brand-black/40 via-brand-black/30 to-brand-black/40 backdrop-blur-md border transition-all duration-500 overflow-hidden ${
                      isClickable
                        ? 'border-brand-purple/50 hover:border-brand-purple-light/80 hover:shadow-2xl hover:shadow-brand-purple/30 hover:scale-[1.02] cursor-pointer'
                        : 'border-gray-500/30 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Efeito de brilho no hover */}
                    {isClickable && (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/10 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
                    )}
                    
                    <CardHeader className="text-center pb-2 relative z-10">
                      <div className="text-6xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 inline-block">
                        {service.icon}
                      </div>
                      <CardTitle className="text-3xl font-bold text-white font-orbitron group-hover:text-brand-purple-light transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                        {service.title}
                      </CardTitle>
                      <CardDescription className="text-brand-gray-300 font-rajdhani text-lg mt-2 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-4 relative z-10 flex flex-col justify-between h-[calc(100%-140px)]">
                      <ul className="space-y-3 mb-8">
                        {service.features.map((feature, featureIndex) => (
                          <li 
                            key={featureIndex} 
                            className="flex items-center text-brand-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300"
                            style={{ 
                              fontFamily: 'Rajdhani, sans-serif', 
                              fontWeight: '400',
                            }}
                          >
                            <div className={`w-2 h-2 rounded-full mr-3 transition-all duration-300 ${isClickable ? 'bg-brand-purple-light group-hover:bg-brand-purple-light group-hover:scale-125' : 'bg-gray-400'}`}></div>
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="text-center mt-auto">
                        {isClickable ? (
                          <div className="block w-full">
                            <div 
                              className="w-full inline-flex items-center justify-center bg-gradient-to-r from-brand-purple to-brand-purple-light text-white font-rajdhani font-bold py-4 rounded-md text-lg group shadow-lg border border-transparent hover:border-white/50 transition-all duration-300 relative overflow-hidden"
                            >
                              <span className="relative z-10 flex items-center justify-center">
                                Continuar
                                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center px-6 py-3 bg-gray-500/20 border border-gray-500/50 rounded-lg text-gray-400 font-rajdhani w-full" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
                            <span className="text-sm text-brand-purple-light font-semibold mr-2">(em breve)</span>
                            <span>Em desenvolvimento</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )

                return isClickable ? (
                  <Link href={service.href} key={index} className="block outline-none focus:ring-2 focus:ring-brand-purple-light focus:ring-offset-2 focus:ring-offset-brand-black rounded-xl h-full">
                    {cardElement}
                  </Link>
                ) : (
                  <div key={index} className="h-full">
                    {cardElement}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
