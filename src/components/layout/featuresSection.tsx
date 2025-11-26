"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  ShieldCheck,
  Headphones,
  Clock,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react"

// Features configuráveis
const features = [
  {
    title: "Resultados Garantidos",
    subtitle: "Alcance seu rank com confiança",
    icon: Trophy,
    iconColor: "text-yellow-400",
  },
  {
    title: "Suporte Atencioso",
    subtitle: "Equipe pronta para ajudar",
    icon: Headphones,
    iconColor: "text-pink-400",
  },
  {
    title: "Disponibilidade 24/7",
    subtitle: "Sempre que você precisar",
    icon: Clock,
    iconColor: "text-green-400",
  },
  {
    title: "Segurança em Primeiro Lugar",
    subtitle: "Serviços 100% confiáveis",
    icon: ShieldCheck,
    iconColor: "text-blue-400",
  },
  {
    title: "Comunidade em Crescimento",
    subtitle: "Jogadores unidos pelo mesmo objetivo",
    icon: Users,
    iconColor: "text-indigo-400",
  },
  {
    title: "Inovação Constante",
    subtitle: "Tecnologia e métodos atualizados",
    icon: Sparkles,
    iconColor: "text-purple-400",
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-black text-white" aria-labelledby="features-heading">
      <div className="container mx-auto px-6">
        <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-center mb-14">
          Por que escolher a <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">GameBoost</span>?
        </h2>

        {/* Grid se adapta automaticamente para menos ou mais itens */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Card
              key={i}
              className={cn(
                "group relative flex flex-col items-center justify-center p-8 text-center transition-colors duration-200 overflow-hidden",
                "bg-gradient-to-br from-gray-900/60 via-gray-900/50 to-gray-800/60 border-purple-600/50 hover:border-purple-400/80",
                "shadow-lg hover:shadow-2xl hover:shadow-purple-500/30 backdrop-blur-sm"
              )}
              style={{ transformOrigin: 'center center' }}
            >
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              
              <CardContent className="flex flex-col items-center p-0 relative z-10">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 group-hover:from-purple-500/30 group-hover:to-purple-600/30 transition-all duration-300 mb-4">
                  <feature.icon
                    className={cn("w-12 h-12", feature.iconColor)}
                  />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-purple-200 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
                  {feature.subtitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
