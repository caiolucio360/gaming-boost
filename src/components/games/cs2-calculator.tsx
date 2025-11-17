'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { CartItem } from '@/types'
import { handleServiceHire } from '@/lib/cart-utils'
import { getGameConfig, GameId, GameMode, GameModeConfig } from '@/lib/games-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface GameCalculatorProps {
  gameId?: GameId
}

export function CS2Calculator({ gameId = 'CS2' }: GameCalculatorProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('PREMIER')
  const [currentRating, setCurrentRating] = useState('')
  const [targetRating, setTargetRating] = useState('')
  const [price, setPrice] = useState(0)
  const [selectedCurrent, setSelectedCurrent] = useState('')
  const [selectedTarget, setSelectedTarget] = useState('')
  const { user } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()

  const gameConfig = getGameConfig(gameId)
  const modeConfig = gameConfig?.modes?.[selectedMode]

  const handleHire = async () => {
    if (!selectedCurrent || !selectedTarget || price <= 0 || !gameConfig || !modeConfig) return

    const currentValue = selectedMode === 'PREMIER' ? parseInt(selectedCurrent) * 1000 : parseInt(selectedCurrent)
    const targetValue = selectedMode === 'PREMIER' ? parseInt(selectedTarget) * 1000 : parseInt(selectedTarget)
    
    const displayCurrent = selectedMode === 'PREMIER' ? `${selectedCurrent}K` : `Nível ${selectedCurrent}`
    const displayTarget = selectedMode === 'PREMIER' ? `${selectedTarget}K` : `Nível ${selectedTarget}`

    const cartItem: CartItem = {
      game: gameId,
      serviceName: `Boost ${gameConfig.displayName} ${modeConfig.displayName}: ${displayCurrent} → ${displayTarget}`,
      description: `Boost profissional no ${gameConfig.name} ${modeConfig.name} de ${displayCurrent} para ${displayTarget}`,
      currentRank: displayCurrent,
      targetRank: displayTarget,
      price,
      duration: '2-5 dias',
      metadata: {
        currentRating: currentValue,
        targetRating: targetValue,
        gameType: `${gameId}_${selectedMode}`,
        mode: selectedMode,
      },
    }

    try {
      const orderCreated = await handleServiceHire(
        cartItem,
        !!user,
        addItem,
        () => {
          router.push('/login')
        }
      )

      // Se o pedido foi criado ou adicionado ao carrinho com sucesso, redirecionar para o carrinho
      // Usar router.push em vez de window.location.href para evitar reload completo
      if (orderCreated) {
        // Pedido criado com sucesso - redirecionar para carrinho
        router.push('/cart')
      } else if (user) {
        // Adicionado ao carrinho (usuário logado mas sem serviceId) - redirecionar para carrinho
        router.push('/cart')
      }
      // Se não estiver logado, o redirecionamento já foi feito dentro de handleServiceHire
    } catch (error) {
      console.error('Erro ao contratar serviço:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao contratar serviço. Tente novamente.'
      alert(errorMessage)
    }
  }

  // Reset seleções ao mudar de modo
  const handleModeChange = (mode: GameMode) => {
    setSelectedMode(mode)
    setCurrentRating('')
    setTargetRating('')
    setSelectedCurrent('')
    setSelectedTarget('')
    setPrice(0)
  }

  // Obter pontos de rating baseado no modo
  const getRatingPoints = (isTarget: boolean = false) => {
    if (!modeConfig) return []
    
    if (modeConfig.ratingPoints) {
      // Filtrar pontos baseado nos limites
      let filteredPoints = modeConfig.ratingPoints
      
      if (selectedMode === 'PREMIER') {
        // Current: até 25K, Target: até 26K
        filteredPoints = isTarget 
          ? modeConfig.ratingPoints // Target pode ir até 26K
          : modeConfig.ratingPoints.filter(p => p <= 25000) // Current até 25K
      } else if (selectedMode === 'GAMERS_CLUB') {
        // Current: até 19, Target: até 20
        filteredPoints = isTarget
          ? modeConfig.ratingPoints // Target pode ir até 20
          : modeConfig.ratingPoints.filter(p => p <= 19) // Current até 19
      }
      
      return filteredPoints.map(value => {
        // Cores baseadas em faixas para Premier
        if (selectedMode === 'PREMIER') {
          if (value <= 4000) return { value, color: 'bg-gray-500 border-gray-400', display: `${value / 1000}K` }
          if (value <= 10000) return { value, color: 'bg-blue-400 border-blue-300', display: `${value / 1000}K` }
          if (value <= 15000) return { value, color: 'bg-blue-600 border-blue-500', display: `${value / 1000}K` }
          if (value <= 25000) return { value, color: 'bg-purple-600 border-purple-500', display: `${value / 1000}K` }
          return { value, color: 'bg-red-500 border-red-400', display: `${value / 1000}K` } // 26K
        }
        
        // Cores baseadas em faixas para Gamers Club
        if (selectedMode === 'GAMERS_CLUB') {
          if (value <= 3) return { value, color: 'bg-gray-500 border-gray-400', display: value.toString() }
          if (value <= 7) return { value, color: 'bg-blue-400 border-blue-300', display: value.toString() }
          if (value <= 11) return { value, color: 'bg-blue-600 border-blue-500', display: value.toString() }
          if (value <= 15) return { value, color: 'bg-purple-600 border-purple-500', display: value.toString() }
          if (value <= 19) return { value, color: 'bg-purple-800 border-purple-700', display: value.toString() }
          return { value, color: 'bg-red-500 border-red-400', display: value.toString() } // Level 20
        }
        
        return { value, color: 'bg-gray-500 border-gray-400', display: value.toString() }
      })
    }
    
    return []
  }

  const currentRatingPoints = getRatingPoints(false) // Current: Premier até 25K, GC até 19
  const targetRatingPoints = getRatingPoints(true) // Target: Premier até 26K, GC até 20

  const calculatePrice = () => {
    if (!selectedCurrent || !selectedTarget || !modeConfig) {
      setPrice(0)
      return
    }

    const current = parseInt(selectedCurrent)
    const target = parseInt(selectedTarget)

    if (current >= target) {
      setPrice(0)
      return
    }

    // Converter para valores reais baseado no modo
    const currentValue = selectedMode === 'PREMIER' ? current * 1000 : current
    const targetValue = selectedMode === 'PREMIER' ? target * 1000 : target

    // Usar a função de cálculo do modo
    if (modeConfig.pricingRules.calculation) {
      const calculatedPrice = modeConfig.pricingRules.calculation(currentValue, targetValue)
      setPrice(calculatedPrice)
    } else {
      setPrice(0)
    }
  }

  const handleCurrentSelect = (value: number) => {
    const displayValue = selectedMode === 'PREMIER' ? (value / 1000).toString() : value.toString()
    setSelectedCurrent(displayValue)
    setCurrentRating(displayValue)
  }

  const handleTargetSelect = (value: number) => {
    const displayValue = selectedMode === 'PREMIER' ? (value / 1000).toString() : value.toString()
    setSelectedTarget(displayValue)
    setTargetRating(displayValue)
  }

  if (!gameConfig || !modeConfig) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
          <CardContent className="p-6">
            <p className="text-white text-center">Configuração do jogo não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-xl md:text-3xl font-bold text-white font-orbitron text-center" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
            <span className="text-purple-300">{gameConfig.displayName}</span>
            <span className="text-white"> CALCULATOR</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Seletor de Modo */}
          {gameConfig.modes && Object.keys(gameConfig.modes).length > 1 && (
            <div className="mb-6">
              <Tabs value={selectedMode} onValueChange={(value) => handleModeChange(value as GameMode)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/50 border-purple-500/50">
                  <TabsTrigger value="PREMIER" className="font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    Premier
                  </TabsTrigger>
                  <TabsTrigger value="GAMERS_CLUB" className="font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                    Gamers Club
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Informações do Modo */}
          <Card className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border-purple-500/50 mb-6">
            <CardContent className="p-3 md:p-4">
              <h3 className="text-base md:text-lg font-bold text-purple-300 font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                Sistema {modeConfig.displayName}:
              </h3>
              <div className="text-xs md:text-sm text-gray-300 font-rajdhani space-y-1" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                {selectedMode === 'PREMIER' ? (
                  <>
                    <p><span className="text-purple-300">• Pontuação:</span> 0 a 40.000+ pontos</p>
                    <p><span className="text-purple-300">• Faixas:</span> 7 faixas de cores baseadas na pontuação</p>
                    <p><span className="text-purple-300">• Preço:</span> R$ {modeConfig.pricingRules.basePrice} a cada {modeConfig.pricingRules.unit} de diferença</p>
                  </>
                ) : (
                  <>
                    <p><span className="text-purple-300">• Níveis:</span> 1 a 20</p>
                    <p><span className="text-purple-300">• Ranqueamento:</span> Sistema Gamers Club</p>
                    <p><span className="text-purple-300">• Preço:</span> R$ {modeConfig.pricingRules.basePrice} por {modeConfig.pricingRules.unit}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 md:space-y-8">
          {/* Seleção de Pontuações - Lado a Lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Pontuação Atual */}
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white font-orbitron mb-3 md:mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                {selectedMode === 'PREMIER' ? 'PONTUAÇÃO ATUAL:' : 'NÍVEL ATUAL:'}
              </h3>
              <div className={`grid gap-2 ${selectedMode === 'PREMIER' ? 'grid-cols-5' : 'grid-cols-6'}`}>
                {currentRatingPoints.map((point) => {
                  const displayValue = selectedMode === 'PREMIER' ? (point.value / 1000).toString() : point.value.toString()
                  const isSelected = selectedCurrent === displayValue
                  
                  return (
                    <Button
                      key={point.value}
                      onClick={() => handleCurrentSelect(point.value)}
                      variant="outline"
                      className={`p-2 md:p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                        isSelected
                          ? 'ring-4 ring-yellow-400 ring-opacity-90 shadow-lg shadow-yellow-400/60 scale-105 bg-yellow-500/90'
                          : 'hover:ring-2 hover:ring-purple-300 hover:ring-opacity-40'
                      } ${point.color}`}
                    >
                      <span className="text-white font-bold text-xs md:text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                        {point.display}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Pontuação Desejada */}
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white font-orbitron mb-3 md:mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                {selectedMode === 'PREMIER' ? 'PONTUAÇÃO DESEJADA:' : 'NÍVEL DESEJADO:'}
              </h3>
              <div className={`grid gap-2 ${selectedMode === 'PREMIER' ? 'grid-cols-5' : 'grid-cols-6'}`}>
                {targetRatingPoints.map((point) => {
                  const displayValue = selectedMode === 'PREMIER' ? (point.value / 1000).toString() : point.value.toString()
                  const isSelected = selectedTarget === displayValue
                  
                  return (
                    <Button
                      key={point.value}
                      onClick={() => handleTargetSelect(point.value)}
                      variant="outline"
                      className={`p-2 md:p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                        isSelected
                          ? 'ring-4 ring-yellow-400 ring-opacity-90 shadow-lg shadow-yellow-400/60 scale-105 bg-yellow-500/90'
                          : 'hover:ring-2 hover:ring-purple-300 hover:ring-opacity-40'
                      } ${point.color}`}
                    >
                      <span className="text-white font-bold text-xs md:text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                        {point.display}
                      </span>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Botão de Cálculo e Resultado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Botão de Cálculo */}
            <div className="flex justify-center lg:justify-start">
              <Button
                onClick={calculatePrice}
                className="bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 md:py-3 px-6 md:px-8 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 text-sm md:text-base"
              >
                CALCULAR PREÇO
              </Button>
            </div>

            {/* Resultado do Preço */}
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/50 rounded-lg p-4 md:p-6">
              <h3 className="text-xl md:text-2xl font-bold text-white font-orbitron mb-3 md:mb-4" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '700' }}>
                <span className="text-purple-300">PREÇO</span>
                <span className="text-white"> ESTIMADO</span>
              </h3>
              
              {price > 0 ? (
                <div className="text-center">
                  <div className="text-2xl md:text-4xl font-bold text-purple-300 font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
                    R$ {price.toFixed(2)}
                  </div>
                  <p className="text-sm md:text-base text-gray-300 font-rajdhani mb-4" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                    {selectedMode === 'PREMIER' 
                      ? `${selectedCurrent}K → ${selectedTarget}K pontos`
                      : `Nível ${selectedCurrent} → Nível ${selectedTarget}`}
                  </p>
                  <Button 
                    onClick={handleHire}
                    className="w-full bg-purple-500 hover:bg-purple-400 text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 text-sm md:text-base"
                  >
                    CONTRATAR AGORA
                  </Button>
                </div>
              ) : (
                <div className="text-center text-xs md:text-sm text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '400' }}>
                  {selectedMode === 'PREMIER' 
                    ? 'Selecione as pontuações para calcular o preço'
                    : 'Selecione os níveis para calcular o preço'}
                </div>
              )}
            </div>
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
