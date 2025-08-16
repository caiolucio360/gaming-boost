'use client'

import { useState } from 'react'
import { GameRank } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface RankSelectorProps {
  ranks: GameRank[]
  title: string
  onSelectionChange?: (from: GameRank | null, to: GameRank | null) => void
}

export function RankSelector({ ranks, title, onSelectionChange }: RankSelectorProps) {
  const [fromRank, setFromRank] = useState<GameRank | null>(null)
  const [toRank, setToRank] = useState<GameRank | null>(null)
  const [step, setStep] = useState<'from' | 'to'>('from')

  const handleRankSelect = (rank: GameRank) => {
    if (step === 'from') {
      setFromRank(rank)
      setStep('to')
    } else {
      setToRank(rank)
      onSelectionChange?.(fromRank, rank)
    }
  }

  const reset = () => {
    setFromRank(null)
    setToRank(null)
    setStep('from')
    onSelectionChange?.(null, null)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600">
          {step === 'from' 
            ? 'Selecione seu rank atual' 
            : 'Selecione o rank desejado'
          }
        </p>
        
        {fromRank && (
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 relative">
                <Image
                  src={fromRank.image}
                  alt={fromRank.name}
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-sm font-medium">{fromRank.name}</p>
            </div>
            
            <span className="text-2xl text-gray-400">→</span>
            
            {toRank ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 relative">
                  <Image
                    src={toRank.image}
                    alt={toRank.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-sm font-medium">{toRank.name}</p>
              </div>
            ) : (
              <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-xs">?</span>
              </div>
            )}
          </div>
        )}
        
        {fromRank && toRank && (
          <Button onClick={reset} variant="outline" className="mt-4">
            Recalcular
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {ranks.map((rank) => (
          <Card 
            key={rank.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              (step === 'from' && fromRank?.id === rank.id) ||
              (step === 'to' && toRank?.id === rank.id)
                ? 'ring-2 ring-blue-500' 
                : ''
            }`}
            onClick={() => handleRankSelect(rank)}
          >
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 mx-auto mb-2 relative">
                <Image
                  src={rank.image}
                  alt={rank.name}
                  fill
                  className="object-contain"
                />
              </div>
              <h3 className="font-medium text-sm">{rank.name}</h3>
              {rank.tier && (
                <p className="text-xs text-gray-500">{rank.tier}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}