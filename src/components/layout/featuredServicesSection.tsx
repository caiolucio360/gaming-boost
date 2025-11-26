"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, GraduationCap } from "lucide-react"

export default function FeaturedServicesSection() {
  const services = [
    {
      title: "BOOST DE RANK",
      description: "Subimos seu rank de forma segura e profissional no CS2",
      icon: Zap,
      available: true,
      href: "/games/cs2"
    },
    {
      title: "COACHING",
      description: "Aprenda com jogadores experientes e melhore seu gameplay",
      icon: GraduationCap,
      available: false,
      href: "/games/cs2"
    }
  ]

  return (
    <section id="services" className="py-20 bg-black" aria-labelledby="featured-services-heading">
      <div className="container mx-auto px-6">
        <h2 id="featured-services-heading" className="text-3xl md:text-4xl font-bold text-center mb-14 text-white">
          <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Serviços em Destaque
          </span>
        </h2>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mb-12">
          {services.map((service, index) => {
            const IconComponent = service.icon
            return (
              <Card
                key={index}
                className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/30 transition-colors duration-200 overflow-hidden"
                style={{ transformOrigin: 'center center' }}
              >
                {/* Efeito de brilho no hover */}
                {service.available && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
                )}
                
                <CardContent className="pt-6 relative z-10">
                  <div className="text-center">
                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300 mb-4">
                      <IconComponent className="h-12 w-12 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-white font-orbitron mb-3 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                      {service.title}
                      {!service.available && (
                        <span className="text-sm text-purple-400 font-semibold ml-2">(em breve)</span>
                      )}
                    </h3>
                    <p className="text-gray-300 font-rajdhani mb-6 group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      {service.description}
                    </p>
                    {service.available ? (
                      <Button 
                        asChild 
                        className="bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg border border-transparent hover:border-white/50 transition-all duration-300"
                      >
                        <Link href={service.href}>Contratar Agora</Link>
                      </Button>
                    ) : (
                      <Button disabled variant="outline" className="opacity-50 cursor-not-allowed">
                        Em Breve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            variant="outline" 
            className="px-10 py-6 border-2 border-purple-500/50 text-purple-300 hover:border-white/50 transition-all duration-300 group" 
            asChild
          >
            <Link href="/games/cs2" className="flex items-center justify-center">
              Ver Jogos Disponíveis
              <svg className="w-5 h-5 ml-2 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}