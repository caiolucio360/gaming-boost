'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Como é client component, precisamos usar generateMetadata em um layout ou criar um wrapper
export default function CS2Page() {
  const services = [
    {
      title: "BOOST DE RANK PREMIER",
      description: "Subimos seu rank Premier do CS2 de forma segura e profissional",
      features: [
        "CS2 Premier Mode",
        "Entrega rápida",
        "Conta 100% segura",
        "Suporte 24/7",
        "Boosters verificados"
      ],
      icon: "⚡",
      href: "/games/cs2/pricing",
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
      href: "/games/cs2/pricing",
      available: false
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
              name: 'GameBoost',
              url: 'https://gameboostpro.com.br',
            },
            areaServed: 'BR',
            serviceType: 'Gaming Service',
          }),
        }}
      />
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white font-orbitron mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
              <span className="text-purple-300">COUNTER-STRIKE 2</span>
            </h1>
            <p className="text-xl text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
              Escolha o serviço que melhor atende suas necessidades
            </p>
          </div>

          <div className="max-w-5xl xl:max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {services.map((service, index) => (
                <Card
                  key={index}
                  className={`group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border transition-all duration-500 overflow-hidden ${
                    service.available
                      ? 'border-purple-500/50 hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-[1.02] cursor-pointer'
                      : 'border-gray-500/30 opacity-60 cursor-not-allowed'
                  }`}
                  style={{
                  }}
                >
                  {/* Efeito de brilho no hover */}
                  {service.available && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
                  )}
                  
                  <CardHeader className="text-center pb-2 relative z-10">
                    <div className="text-6xl mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 inline-block">
                      {service.icon}
                    </div>
                    <CardTitle className="text-3xl font-bold text-white font-orbitron group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-gray-300 font-rajdhani text-lg mt-2 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-4 relative z-10">
                    <ul className="space-y-3 mb-8">
                      {service.features.map((feature, featureIndex) => (
                        <li 
                          key={featureIndex} 
                          className="flex items-center text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300"
                          style={{ 
                            fontFamily: 'Rajdhani, sans-serif', 
                            fontWeight: '400',
                          }}
                        >
                          <div className={`w-2 h-2 rounded-full mr-3 transition-all duration-300 ${service.available ? 'bg-purple-400 group-hover:bg-purple-300 group-hover:scale-125' : 'bg-gray-400'}`}></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="text-center">
                      {service.available ? (
                        <Link href={service.href} className="block w-full">
                          <Button 
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-rajdhani font-bold py-6 text-lg group shadow-lg border border-transparent hover:border-white/50 transition-all duration-300 relative overflow-hidden"
                          >
                            <span className="relative z-10 flex items-center justify-center">
                              Continuar
                              <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </Button>
                        </Link>
                      ) : (
                        <div className="inline-flex items-center justify-center px-6 py-3 bg-gray-500/20 border border-gray-500/50 rounded-lg text-gray-400 font-rajdhani w-full" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
                          <span className="text-sm text-purple-400 font-semibold mr-2">(em breve)</span>
                          <span>Em desenvolvimento</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
