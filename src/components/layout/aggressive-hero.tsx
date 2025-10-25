'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon, StarIcon, ShieldIcon, ZapIcon } from "lucide-react"

export default function AggressiveHero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-brand-black via-gray-900 to-brand-black flex items-center justify-center overflow-hidden">
      {/* Background Image Overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-black/80 via-brand-black/60 to-brand-black/80" />
        {/* Placeholder for tactical background image */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-brand-black opacity-50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Main heading */}
        <div className="animate-fadeIn mb-8">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
            <span className="text-white">
              Quer upar sua conta?
            </span>
            <br />
            <span className="text-white">
              Aqui é o lugar!
            </span>
          </h1>
        </div>

        {/* Slogan */}
        <div className="animate-fadeIn mb-12" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-red-600 mb-8">
            O melhor BOOSTER da América!
          </h2>
        </div>

        {/* CTA Button */}
        <div className="animate-fadeIn mb-16" style={{ animationDelay: '0.4s' }}>
          <Button 
            size="lg" 
            className="px-16 py-8 text-2xl font-black bg-transparent border-4 border-red-600 text-red-600 hover:bg-red-600 hover:text-white hover-glow hover-scale transition-all duration-300 group"
            asChild
          >
            <Link href="#services" className="flex items-center space-x-4">
              <span>CONTRATE JÁ!</span>
              <ArrowRightIcon className="h-8 w-8 group-hover:translate-x-2 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Features */}
        <div className="animate-fadeIn grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col items-center space-y-4 p-8 bg-brand-black-light/80 rounded-xl backdrop-blur-sm hover-lift border border-red-600/30">
            <div className="p-4 bg-red-600 rounded-full">
              <ShieldIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">100% SEGURO</h3>
            <p className="text-gray-400 text-center">Conta protegida durante todo o processo</p>
          </div>

          <div className="flex flex-col items-center space-y-4 p-8 bg-brand-black-light/80 rounded-xl backdrop-blur-sm hover-lift border border-red-600/30">
            <div className="p-4 bg-red-600 rounded-full">
              <ZapIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">RÁPIDO</h3>
            <p className="text-gray-400 text-center">Resultados em 1-3 dias úteis</p>
          </div>

          <div className="flex flex-col items-center space-y-4 p-8 bg-brand-black-light/80 rounded-xl backdrop-blur-sm hover-lift border border-red-600/30">
            <div className="p-4 bg-red-600 rounded-full">
              <StarIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">PROFISSIONAL</h3>
            <p className="text-gray-400 text-center">Boosters especializados e experientes</p>
          </div>
        </div>

        {/* Stats */}
        <div className="animate-fadeIn mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto" style={{ animationDelay: '0.8s' }}>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-red-600 mb-2">1000+</div>
            <div className="text-white font-bold">CLIENTES</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-red-600 mb-2">4.9</div>
            <div className="text-white font-bold">AVALIAÇÃO</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-red-600 mb-2">24/7</div>
            <div className="text-white font-bold">SUPORTE</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-black text-red-600 mb-2">100%</div>
            <div className="text-white font-bold">SEGURO</div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-red-600 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-red-600 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  )
}
