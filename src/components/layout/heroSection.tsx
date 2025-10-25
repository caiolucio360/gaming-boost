"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon, StarIcon, ShieldIcon, ZapIcon } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-brand flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-purple-light/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-purple-lighter/10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Main heading */}
        <div className="animate-fadeIn">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-brand-purple-light to-brand-purple-lighter bg-clip-text text-transparent">
              GAMEBOOST
            </span>
            <br />
            <span className="text-4xl md:text-6xl lg:text-7xl font-bold text-white">
              PRO
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className="animate-fadeIn mb-12" style={{ animationDelay: '0.2s' }}>
          <p className="text-xl md:text-3xl text-gray-300 mb-6 max-w-4xl mx-auto leading-relaxed">
            Boost profissional para League of Legends, Valorant e Counter-Strike 2
          </p>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            Suba de rank com segurança, rapidez e suporte 24/7. 
            <span className="text-brand-purple-light font-semibold"> Resultados garantidos.</span>
          </p>
        </div>

        {/* CTA Button */}
        <div className="animate-fadeIn mb-16" style={{ animationDelay: '0.4s' }}>
          <Button 
            size="lg" 
            className="px-12 py-6 text-xl font-bold bg-gradient-purple hover:bg-gradient-purple-light hover-glow hover-scale transition-all duration-300 group"
            asChild
          >
            <Link href="#services" className="flex items-center space-x-3">
              <span>CONTRATAR SERVIÇO</span>
              <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Features */}
        <div className="animate-fadeIn grid md:grid-cols-3 gap-8 max-w-4xl mx-auto" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col items-center space-y-3 p-6 bg-brand-black-light/50 rounded-xl backdrop-blur-sm hover-lift">
            <div className="p-3 bg-brand-purple rounded-full">
              <ShieldIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">100% Seguro</h3>
            <p className="text-sm text-gray-400 text-center">Conta protegida durante todo o processo</p>
          </div>

          <div className="flex flex-col items-center space-y-3 p-6 bg-brand-black-light/50 rounded-xl backdrop-blur-sm hover-lift">
            <div className="p-3 bg-brand-purple rounded-full">
              <ZapIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Rápido</h3>
            <p className="text-sm text-gray-400 text-center">Resultados em 1-3 dias úteis</p>
          </div>

          <div className="flex flex-col items-center space-y-3 p-6 bg-brand-black-light/50 rounded-xl backdrop-blur-sm hover-lift">
            <div className="p-3 bg-brand-purple rounded-full">
              <StarIcon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">Profissional</h3>
            <p className="text-sm text-gray-400 text-center">Boosters especializados e experientes</p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-brand-purple-light rounded-full flex justify-center">
          <div className="w-1 h-3 bg-brand-purple-light rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  )
}




