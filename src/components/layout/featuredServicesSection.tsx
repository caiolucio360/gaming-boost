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
    <section id="services" className="py-20 bg-black">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 text-white">
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
                className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <IconComponent className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white font-orbitron mb-3" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                      {service.title}
                      {!service.available && (
                        <span className="text-sm text-purple-400 font-semibold ml-2">(em breve)</span>
                      )}
                    </h3>
                    <p className="text-gray-300 font-rajdhani mb-6" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                      {service.description}
                    </p>
                    {service.available ? (
                      <Button asChild className="bg-purple-500 hover:bg-purple-400 text-white">
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
          <Button size="lg" variant="outline" className="px-10 py-6" asChild>
            <Link href="/games/cs2">Ver Jogos Disponíveis</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}