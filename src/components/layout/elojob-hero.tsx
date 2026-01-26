'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon, ShieldIcon, ZapIcon, HeadphonesIcon } from "lucide-react"

export function ElojobHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-black" aria-label="Hero - Seção principal">
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
        {/* Overlay para melhorar legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 xl:px-12 py-12 md:py-16 lg:py-20 flex flex-col justify-center items-center min-h-screen pb-24 md:pb-32">

        {/* Título Principal */}
        <div className="flex flex-col justify-center items-center text-center mb-6 md:mb-8">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-wide px-2 font-orbitron">
              <span className="text-white drop-shadow-2xl">
                Boost Profissional
              </span>
              <br />
              <span className="text-white drop-shadow-2xl">
                Para Gamers
              </span>
            </h1>
          </div>

          <div className="mb-6 md:mb-8">
            <h2 className="text-lg md:text-2xl lg:text-4xl xl:text-5xl font-semibold bg-gradient-to-r from-brand-purple-light via-brand-purple to-brand-purple-light bg-clip-text text-transparent drop-shadow-xl px-2 font-rajdhani">
              Alcance seu potencial máximo!
            </h2>
          </div>

          <div className="mb-8 md:mb-12">
            <Button
              size="lg"
              className="px-6 md:px-12 py-3 md:py-6 text-sm md:text-lg font-bold bg-brand-purple hover:bg-brand-purple-light text-white transition-all duration-500 group relative overflow-hidden shadow-glow-lg hover:shadow-glow-hover rounded-lg"
              asChild
            >
              <Link href="/games/cs2" className="flex items-center space-x-3 relative z-10">
                <span className="relative z-10">CONTRATE JÁ!</span>
                <ArrowRightIcon className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform duration-300 relative z-10" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="w-full mt-8 md:mt-16 mb-8 md:mb-12 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
            {[
              { icon: ShieldIcon, title: '100% SEGURO', desc: 'Conta protegida' },
              { icon: ZapIcon, title: 'EFICIENTE', desc: 'Processo otimizado' },
              { icon: ShieldIcon, title: 'PROFISSIONAL', desc: 'Jogadores experientes' },
              { icon: HeadphonesIcon, title: '24/7 SUPORTE', desc: 'Sempre disponível' },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Glassmorphism card */}
                <div className="relative bg-white/5 backdrop-blur-xl border border-brand-purple/50 rounded-xl p-4 md:p-5 hover:bg-white/10 hover:border-brand-purple-light/70 transition-all duration-300">
                  {/* Inner glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-purple/5 via-transparent to-brand-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Purple glow on hover */}
                  <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-brand-purple/0 via-brand-purple/20 to-brand-purple/0 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300 pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
                    <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 group-hover:bg-brand-purple/20 group-hover:border-brand-purple/30 transition-all duration-300" aria-hidden="true">
                      <feature.icon className="h-5 w-5 md:h-6 md:w-6 text-brand-purple-light group-hover:text-white transition-colors duration-300" aria-hidden="true" />
                    </div>
                    <div className="text-center md:text-left">
                      <h3 className="text-sm md:text-base font-bold text-white/90 group-hover:text-white transition-colors duration-300 font-rajdhani">
                        {feature.title}
                      </h3>
                      <p className="text-xs md:text-sm text-white/50 group-hover:text-white/70 transition-colors duration-300">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  )
}
