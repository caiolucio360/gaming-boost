"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 text-white">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,_#3b82f6,_transparent_70%)]" />

      <div className="container relative mx-auto px-6 py-28 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            GameBoost Pro
          </span>
        </h1>
        <p className="text-lg md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Boost profissional para League of Legends, Valorant e Counter-Strike
          2. Suba de rank com segurança, rapidez e suporte 24/7.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="px-10 py-6 text-lg font-semibold" asChild>
            <Link href="#services">Ver Serviços</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="px-10 py-6 text-lg font-semibold border-white text-white hover:bg-white hover:text-gray-900"
            asChild
          >
            <Link href="/login">Começar Agora</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}




