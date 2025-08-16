'use client'

import { useState } from 'react'
import { ServiceCard } from '@/components/games/service-card'
import { RankSelector } from '@/components/games/rank-selector'
import { services, lolRanks } from '@/lib/data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

export default function LoLPage() {
  const lolServices = services.filter(s => s.game === 'LOL')
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)

  const handleRankSelection = (from: any, to: any) => {
    if (from && to) {
      // Lógica simplificada de cálculo de preço baseado na diferença de ranks
      const fromIndex = lolRanks.findIndex(r => r.id === from.id)
      const toIndex = lolRanks.findIndex(r => r.id === to.id)
      const difference = toIndex - fromIndex
      
      if (difference > 0) {
        const basePrice = 25.90
        const calculatedPrice = basePrice * difference * 1.5
        setCalculatedPrice(calculatedPrice)
      }
    } else {
      setCalculatedPrice(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          League of Legends
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Serviços profissionais de boost para League of Legends. 
          Alcance o elo dos seus sonhos com nossos boosters especializados.
        </p>
      </div>

      <Tabs defaultValue="calculator" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="calculator">Calculadora de Preços</TabsTrigger>
          <TabsTrigger value="services">Todos os Serviços</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Calculadora de Boost</CardTitle>
              <CardDescription>
                Selecione seu elo atual e o elo desejado para calcular o preço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankSelector
                ranks={lolRanks}
                title="Boost de Elo - League of Legends"
                onSelectionChange={handleRankSelection}
              />
              
              {calculatedPrice && (
                <div className="mt-8 p-6 bg-blue-50 rounded-lg text-center">
                  <h3 className="text-xl font-semibold mb-2">Preço Calculado</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-4">
                    {formatPrice(calculatedPrice)}
                  </div>
                  <Button size="lg">
                    Contratar Boost
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lolServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Section */}
      <div className="mt-16 grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <p>Selecione o serviço desejado e faça o pedido</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <p>Nosso booster profissional será designado para sua conta</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <p>Acompanhe o progresso em tempo real</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <p>Receba sua conta no elo desejado</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Garantias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p>100% de segurança da conta</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p>Chat offline mode durante o boost</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p>Reembolso em caso de problemas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}