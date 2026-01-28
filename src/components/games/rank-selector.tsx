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
        {ranks.map((rank, index) => {
          const isSelected = (step === 'from' && fromRank?.id === rank.id) || (step === 'to' && toRank?.id === rank.id)
          return (
            <Card 
              key={rank.id}
              role="button"
              tabIndex={0}
              aria-label={`Selecionar rank ${rank.name}${rank.tier ? ` - ${rank.tier}` : ''}`}
              aria-pressed={isSelected}
              className={`group relative cursor-pointer transition-all duration-300 overflow-hidden ${
                isSelected
                  ? 'ring-2 ring-brand-purple shadow-lg shadow-brand-purple/50 scale-105' 
                  : 'hover:shadow-lg hover:shadow-brand-purple/20 hover:scale-105 hover:border-brand-purple-light/50'
              } bg-gradient-to-br from-gray-900/50 via-gray-800/50 to-gray-900/50 border-brand-purple/30`}
              onClick={() => handleRankSelect(rank)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleRankSelect(rank)
                }
              }}
            >
              {/* Efeito de brilho no hover */}
              {!isSelected && (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/10 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              )}
              
              <CardContent className="p-4 text-center relative z-10">
                <div className={`w-16 h-16 mx-auto mb-2 relative transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <Image
                    src={rank.image}
                    alt={rank.name}
                    fill
                    className="object-contain drop-shadow-lg"
                  />
                </div>
                <h3 className={`font-medium text-sm transition-colors duration-300 ${isSelected ? 'text-brand-purple-light font-bold' : 'text-white group-hover:text-brand-purple-lighter'}`}>
                  {rank.name}
                </h3>
                {rank.tier && (
                  <p className={`text-xs transition-colors duration-300 ${isSelected ? 'text-brand-purple-light' : 'text-gray-400 group-hover:text-gray-300'}`}>
                    {rank.tier}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}