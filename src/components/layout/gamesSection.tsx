"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Trophy, Gamepad2, Users } from "lucide-react"

export default function GamesSection() {
    const games = [
      {
        name: "League of Legends",
        href: "/games/lol",
        description: "Boost de elo, MD10, coaching e mais",
        icon: Gamepad2,
        gradient: "from-blue-600 to-blue-800",
      },
      {
        name: "Valorant",
        href: "/games/valorant",
        description: "Rank boost, placement, coaching",
        icon: Trophy,
        gradient: "from-red-600 to-red-800",
      },
      {
        name: "Counter-Strike 2",
        href: "/games/cs2",
        description: "Prime boost, demo review, treinos",
        icon: Users,
        gradient: "from-orange-600 to-orange-800",
      },
    ]
  
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">
            Jogos Disponíveis
          </h2>
  
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game, i) => (
              <Link key={i} href={game.href} className="group">
                <Card className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <div
                    className={cn(
                      "h-48 flex items-center justify-center bg-gradient-to-br",
                      game.gradient
                    )}
                  >
                    <game.icon className="h-20 w-20 text-white" />
                  </div>
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl font-bold">
                      {game.name}
                    </CardTitle>
                    <p className="text-gray-600">{game.description}</p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    )
  }