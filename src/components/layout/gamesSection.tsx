"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getEnabledGames } from "@/lib/games-config"
import { Trophy, Gamepad2, Users } from "lucide-react"

// Mapeamento de ícones por jogo
const gameIcons: Record<string, any> = {
  CS2: Users,
  LOL: Trophy,
  VALORANT: Gamepad2,
}

// Mapeamento de gradientes por jogo
const gameGradients: Record<string, string> = {
  CS2: "from-orange-600 to-orange-800",
  LOL: "from-blue-600 to-blue-800",
  VALORANT: "from-red-600 to-red-800",
}

export default function GamesSection() {
    const enabledGames = getEnabledGames()
    
    const games = enabledGames.map((game) => ({
      name: game.name,
      href: game.href,
      description: game.description,
      icon: gameIcons[game.id] || Users,
      gradient: gameGradients[game.id] || "from-brand-purple-dark to-purple-800",
    }))
  
    return (
      <section className="py-20 bg-black" aria-labelledby="games-heading">
        <div className="container mx-auto px-6">
          <h2 id="games-heading" className="text-3xl md:text-4xl font-bold text-center mb-14 text-white">
            Jogos Disponíveis
          </h2>
  
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game, i) => (
              <Link key={i} href={game.href} className="group" aria-label={`Ver serviços de ${game.name} - ${game.description}`}>
                <Card className="overflow-hidden border-brand-purple-dark/50 bg-gray-900 hover:shadow-lg hover:shadow-brand-purple/20 hover:scale-105 transition-all duration-300 group-hover:scale-105">
                  <div
                    className={cn(
                      "h-48 flex items-center justify-center bg-gradient-to-br",
                      game.gradient
                    )}
                  >
                    <game.icon className="h-20 w-20 text-white" aria-hidden="true" />
                  </div>
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold text-white">
                      {game.name}
                    </CardTitle>
                    <p className="text-gray-400">{game.description}</p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    )
  }