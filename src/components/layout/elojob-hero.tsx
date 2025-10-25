'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon, ShieldIcon, ZapIcon, HeadphonesIcon } from "lucide-react"

export default function ElojobHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/principal.png)',
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />
        {/* Overlay para melhorar legibilidade do texto - Contraste otimizado */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Content - Layout Profissional com Hierarquia Visual */}
      <div className="relative z-10 container mx-auto px-6 py-20 flex flex-col justify-center items-center min-h-screen">
        
        {/* Seção Superior - Título Principal com Espaçamento Adequado */}
        <div className="flex flex-col justify-center items-center text-center mb-8 transform translate-y-16">
          <div className="mb-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
              <span className="text-white drop-shadow-2xl shadow-black/50">
                Boost Profissional
              </span>
              <br />
              <span className="text-white drop-shadow-2xl shadow-black/50">
                Para Gamers
              </span>
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-semibold text-purple-300 drop-shadow-xl shadow-black/30" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
              Alcance seu potencial máximo!
            </h2>
          </div>

          <div className="mb-12">
            <Button
              size="lg"
              className="px-12 py-6 text-lg font-bold bg-purple-600/20 backdrop-blur-md border-2 border-purple-500 text-purple-200 hover:bg-purple-600 hover:text-white hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 group"
              asChild
            >
              <Link href="#services" className="flex items-center space-x-3">
                <span>CONTRATE JÁ!</span>
                <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Seção Inferior - Features e Stats com Layout Equilibrado */}
        <div className="w-full mt-16 transform translate-y-24">
          {/* Features - Layout Horizontal Compacto */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="flex items-center space-x-4 p-4 bg-black/30 backdrop-blur-md  border border-purple-500/60">
              <div className="p-2 bg-purple-500 rounded-full flex-shrink-0">
                <ShieldIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">100% SEGURO</h3>
                <p className="text-xs text-gray-200">Conta protegida</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-black/30 backdrop-blur-md  border border-purple-500/60">
              <div className="p-2 bg-purple-500 rounded-full flex-shrink-0">
                <ZapIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">EFICIENTE</h3>
                <p className="text-xs text-gray-200">Processo otimizado</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-black/30 backdrop-blur-md  border border-purple-500/60">
              <div className="p-2 bg-purple-500 rounded-full flex-shrink-0">
                <ShieldIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">PROFISSIONAL</h3>
                <p className="text-xs text-gray-200">Jogadores experientes</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-black/30 backdrop-blur-md  border border-purple-500/60">
              <div className="p-2 bg-purple-500 rounded-full flex-shrink-0">
                <HeadphonesIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">24/7 SUPORTE</h3>
                <p className="text-xs text-gray-200">Sempre disponível</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
