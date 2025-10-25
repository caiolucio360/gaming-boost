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
    <section className="py-20 bg-black text-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
          Por que escolher a <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">GameBoost Pro</span>?
        </h2>

        {/* Grid se adapta automaticamente para menos ou mais itens */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Card
              key={i}
              className={cn(
                "flex flex-col items-center justify-center p-8 text-center transition-all duration-300",
                "bg-gray-900/50 border-purple-600/50 shadow-lg hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105 backdrop-blur-sm"
              )}
            >
              <CardContent className="flex flex-col items-center p-0">
                <feature.icon
                  className={cn("w-12 h-12 mb-4", feature.iconColor)}
                />
                <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
