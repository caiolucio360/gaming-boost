'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRightIcon, ShieldIcon, ZapIcon, HeadphonesIcon } from "lucide-react"

export function ElojobHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black" aria-label="Hero - Seção principal">
      {/* Background Image */}
      <div className="absolute inset-0" aria-hidden="true">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/principal.png)',
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
          aria-hidden="true"
        />
        {/* Overlay para melhorar legibilidade do texto - Contraste otimizado */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" aria-hidden="true" />
      </div>

      {/* Content - Layout Profissional com Hierarquia Visual */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-12 md:py-16 lg:py-20 flex flex-col justify-center items-center min-h-screen pb-24 md:pb-32">
        
        {/* Seção Superior - Título Principal com Espaçamento Adequado */}
        <div className="flex flex-col justify-center items-center text-center mb-6 md:mb-8">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-wide px-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
              <span className="text-white drop-shadow-2xl shadow-black/50">
                Boost Profissional
              </span>
              <br />
              <span className="text-white drop-shadow-2xl shadow-black/50">
                Para Gamers
              </span>
            </h1>
          </div>

          <div className="mb-6 md:mb-8">
            <h2 className="text-lg md:text-2xl lg:text-4xl xl:text-5xl font-semibold bg-gradient-to-r from-purple-300 via-purple-400 to-purple-300 bg-clip-text text-transparent drop-shadow-xl shadow-black/30 px-2" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
              Alcance seu potencial máximo!
            </h2>
          </div>

          <div className="mb-8 md:mb-12">
            <Button
              size="lg"
              className="px-6 md:px-12 py-3 md:py-6 text-sm md:text-lg font-bold bg-gradient-to-r from-purple-600/30 via-purple-500/30 to-purple-600/30 backdrop-blur-md border-2 border-purple-500/80 text-purple-200 hover:border-white/50 transition-all duration-500 group relative overflow-hidden"
              asChild
            >
              <Link href="/games/cs2" className="flex items-center space-x-3 relative z-10">
                <span className="relative z-10">CONTRATE JÁ!</span>
                <ArrowRightIcon className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform duration-300 relative z-10" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Seção Inferior - Features e Stats com Layout Equilibrado */}
        <div className="w-full mt-8 md:mt-16 mb-8 md:mb-12 px-4">
          {/* Features - Layout Horizontal Compacto */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
            {[
              { icon: ShieldIcon, title: '100% SEGURO', desc: 'Conta protegida', delay: '0.1s' },
              { icon: ZapIcon, title: 'EFICIENTE', desc: 'Processo otimizado', delay: '0.2s' },
              { icon: ShieldIcon, title: 'PROFISSIONAL', desc: 'Jogadores experientes', delay: '0.3s' },
              { icon: HeadphonesIcon, title: '24/7 SUPORTE', desc: 'Sempre disponível', delay: '0.4s' },
            ].map((feature, index) => (
              <Card 
                key={index}
                className="group bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border border-purple-500/60 hover:border-purple-400/80 rounded-lg hover:shadow-xl hover:shadow-purple-500/30 transition-colors duration-200 overflow-hidden"
                style={{ transformOrigin: 'center center' }}
              >
                <CardContent className="flex flex-col md:flex-row items-center md:items-center space-y-2 md:space-y-0 md:space-x-4 p-3 md:p-4 relative">
                  {/* Efeito de brilho no hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
                  
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex-shrink-0 shadow-lg transition-all duration-300 relative z-10" aria-hidden="true">
                    <feature.icon className="h-4 w-4 md:h-5 md:w-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="text-center md:text-left relative z-10">
                    <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-purple-200 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-[10px] md:text-xs text-gray-200 group-hover:text-gray-100 transition-colors duration-300">
                      {feature.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

    </section>
  )
}
