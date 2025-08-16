'use client'

import { useState } from 'react'
import { ServiceCard } from '@/components/games/service-card'
import { RankSelector } from '@/components/games/rank-selector'
import { services, valorantRanks } from '@/lib/data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

export default function ValorantPage() {
  const valorantServices = services.filter(s => s.game === 'VALORANT')
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)

  const handleRankSelection = (from: any, to: any) => {
    if (from && to) {
      const fromIndex = valorantRanks.findIndex(r => r.id === from.id)
      const toIndex = valorantRanks.findIndex(r => r.id === to.id)
      const difference = toIndex - fromIndex
      
      if (difference > 0) {
        const basePrice = 35.90
        const calculatedPrice = basePrice * difference * 1.3
        setCalculatedPrice(calculatedPrice)
      }
    } else {
      setCalculatedPrice(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
          Valorant
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Boost profissional no Valorant. Nossos boosters são ex-profissionais e 
          radiant players que irão levar você ao rank desejado.
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
                Selecione seu rank atual e o rank desejado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankSelector
                ranks={valorantRanks}
                title="Boost de Rank - Valorant"
                onSelectionChange={handleRankSelection}
              />
              
              {calculatedPrice && (
                <div className="mt-8 p-6 bg-red-50 rounded-lg text-center">
                  <h3 className="text-xl font-semibold mb-2">Preço Calculado</h3>
                  <div className="text-3xl font-bold text-red-600 mb-4">
                    {formatPrice(calculatedPrice)}
                  </div>
                  <Button size="lg" className="bg-red-600 hover:bg-red-700">
                    Contratar Boost
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {valorantServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}