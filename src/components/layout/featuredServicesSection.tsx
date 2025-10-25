"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ServiceCard } from "@/components/games/service-card"
import { services } from "@/lib/data"

export default function FeaturedServicesSection() {
    const featuredServices = services.slice(0, 6)
  
    return (
      <section id="services" className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14 text-white">
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Serviços em Destaque
            </span>
          </h2>
  
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
  
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="px-10 py-6" asChild>
              <Link href="#all-services">Ver Todos os Serviços</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }