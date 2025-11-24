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
              name: 'GameBoost Pro',
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
                  className={`bg-black/30 backdrop-blur-md border transition-all duration-300 ${
                    service.available
                      ? 'border-purple-500/50 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105 cursor-pointer'
                      : 'border-gray-500/30 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="text-6xl mb-4">{service.icon}</div>
                    <CardTitle className="text-3xl font-bold text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-gray-300 font-rajdhani text-lg mt-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <ul className="space-y-3 mb-8">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                          <div className={`w-2 h-2 rounded-full mr-3 ${service.available ? 'bg-purple-400' : 'bg-gray-400'}`}></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="text-center">
                      {service.available ? (
                        <Link href={service.href} className="block w-full">
                          <Button 
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-rajdhani font-bold py-6 text-lg group"
                          >
                            Continuar
                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
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
