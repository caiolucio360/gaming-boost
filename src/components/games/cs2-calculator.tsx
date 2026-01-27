'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { CartItem } from '@/types'
import { handleServiceHire } from '@/lib/cart-utils'
import { getGameConfig, GameId, GameMode, GameModeConfig } from '@/lib/games-config'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ButtonLoading } from '@/components/common/button-loading'
import { showError } from '@/lib/toast'
import { AlertCircle, Calculator, Zap } from 'lucide-react'
import Link from 'next/link'

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
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [isCheckingOrders, setIsCheckingOrders] = useState(false)
  const { user } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()

  const gameConfig = getGameConfig(gameId)
  const modeConfig = gameConfig?.modes?.[selectedMode]

  // Check for active orders when user is logged in or mode changes
  useEffect(() => {
    const checkActiveOrders = async () => {
      if (!user) {
        setActiveOrders([])
        return
      }

      setIsCheckingOrders(true)
      try {
        const response = await fetch('/api/orders', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const orders = data.orders || []

          // Filter for active orders (PENDING, PAID, IN_PROGRESS) in current game mode
          const activeInMode = orders.filter((order: any) =>
            ['PENDING', 'PAID', 'IN_PROGRESS'].includes(order.status) &&
            order.gameMode === selectedMode
          )

          setActiveOrders(activeInMode)
        }
      } catch (error) {
        console.error('Error checking active orders:', error)
      } finally {
        setIsCheckingOrders(false)
      }
    }

    checkActiveOrders()
  }, [user, selectedMode])

  const hasActiveOrderInMode = activeOrders.length > 0

  const handleHire = async () => {
    if (!selectedCurrent || !selectedTarget || price <= 0 || !gameConfig || !modeConfig) return

    setIsLoading(true)
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
          router.replace('/login')
        }
      )

      if (orderCreated || user) {
        router.replace('/cart')
      }
    } catch (error) {
      console.error('Erro ao contratar serviço:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao contratar serviço. Tente novamente.'
      showError('Erro', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset seleções ao mudar de modo com transição
  const handleModeChange = (mode: GameMode) => {
    if (mode === selectedMode) return
    
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
        // Display value based on mode
        const display = selectedMode === 'PREMIER' 
          ? `${value / 1000}K` 
          : value.toString()
        
        return { value, display }
      })
    }
    
    return []
  }

  const currentRatingPoints = getRatingPoints(false)
  const targetRatingPoints = getRatingPoints(true)

  const calculatePrice = async () => {
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

    setIsCalculating(true)
    try {
      // Chamar API para calcular preço dinamicamente
      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game: gameId,
          gameMode: selectedMode,
          current: currentValue,
          target: targetValue,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        showError('Erro ao calcular preço', error.error || 'Não foi possível calcular o preço')
        setPrice(0)
        return
      }

      const data = await response.json()
      setPrice(data.data.price)
    } catch (error) {
      console.error('Error calculating price:', error)
      showError('Erro', 'Não foi possível calcular o preço. Tente novamente.')
      setPrice(0)
    } finally {
      setIsCalculating(false)
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
        <Card className="bg-brand-black-light border border-white/5">
          <CardContent className="p-6">
            <p className="text-white text-center">Configuração do jogo não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-brand-black-light border border-white/5 hover:border-brand-purple/50 transition-colors">
        <CardHeader className="py-3 pb-2">
          <CardTitle className="text-lg md:text-2xl font-bold font-orbitron text-center">
            <span className="text-brand-purple-light">{gameConfig.displayName}</span>
            <span className="text-white"> CALCULATOR</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mode Selector */}
          {gameConfig.modes && Object.keys(gameConfig.modes).length > 1 && (
            <div className="mb-4">
              <Tabs value={selectedMode} onValueChange={(value) => handleModeChange(value as GameMode)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-brand-black-light border border-brand-purple/30 rounded-lg p-1 gap-1 h-auto">
                  <TabsTrigger
                    value="PREMIER"
                    className="font-rajdhani font-bold transition-all duration-300 rounded-md py-2 px-3
                      data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                      data-[state=inactive]:text-brand-gray-500 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-brand-purple/20"
                  >
                    Premier
                  </TabsTrigger>
                  <TabsTrigger
                    value="GAMERS_CLUB"
                    className="font-rajdhani font-bold transition-all duration-300 rounded-md py-2 px-3
                      data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                      data-[state=inactive]:text-brand-gray-500 data-[state=inactive]:hover:text-white data-[state=inactive]:hover:bg-brand-purple/20"
                  >
                    Gamers Club
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}



          {/* Warning for Active Orders */}
          {user && hasActiveOrderInMode && (
            <Card className="bg-amber-500/20 border border-amber-500/70 mb-6 animate-pulse">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm md:text-base font-bold text-amber-500 font-rajdhani mb-2">
                      Você já possui um boost ativo nesta modalidade
                    </h3>
                    <p className="text-xs md:text-sm text-brand-gray-300 font-rajdhani mb-3">
                      Você tem {activeOrders.length} pedido{activeOrders.length > 1 ? 's' : ''} {activeOrders[0].status === 'PENDING' ? 'pendente' : activeOrders[0].status === 'PAID' ? 'pago' : 'em andamento'} de boost {selectedMode === 'PREMIER' ? 'Premier' : 'Gamers Club'}.
                      Finalize ou cancele o pedido anterior antes de criar um novo.
                    </p>
                    <Link
                      href="/dashboard"
                      className="inline-block bg-amber-500 hover:bg-amber-500/80 text-black font-bold py-2 px-4 rounded-lg transition-colors text-xs md:text-sm font-rajdhani"
                    >
                      Ver Meus Pedidos
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {/* Rating Selection - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Current Rating */}
              <div>
                <h3 className="text-base md:text-lg font-bold text-white font-orbitron mb-2">
                  {selectedMode === 'PREMIER' ? 'PONTUAÇÃO ATUAL:' : 'NÍVEL ATUAL:'}
                </h3>
                <div className={`grid gap-1.5 ${selectedMode === 'PREMIER' ? 'grid-cols-5' : 'grid-cols-6'}`}>
                  {currentRatingPoints.map((point) => {
                    const displayValue = selectedMode === 'PREMIER' ? (point.value / 1000).toString() : point.value.toString()
                    const isSelected = selectedCurrent === displayValue

                    return (
                      <button
                        key={point.value}
                        onClick={() => handleCurrentSelect(point.value)}
                        className={`p-1.5 md:p-2 rounded-md border-2 transition-all duration-200 font-rajdhani font-bold text-xs
                          ${isSelected
                            ? 'bg-brand-purple border-brand-purple-light text-white shadow-glow scale-105'
                            : 'bg-brand-black-light border-white/10 text-brand-gray-300 hover:border-brand-purple/50 hover:bg-brand-purple/20 hover:text-white'
                          }`}
                      >
                        {point.display}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Target Rating */}
              <div>
                <h3 className="text-base md:text-lg font-bold text-white font-orbitron mb-2">
                  {selectedMode === 'PREMIER' ? 'PONTUAÇÃO DESEJADA:' : 'NÍVEL DESEJADO:'}
                </h3>
                <div className={`grid gap-1.5 ${selectedMode === 'PREMIER' ? 'grid-cols-5' : 'grid-cols-6'}`}>
                  {targetRatingPoints.map((point) => {
                    const displayValue = selectedMode === 'PREMIER' ? (point.value / 1000).toString() : point.value.toString()
                    const isSelected = selectedTarget === displayValue

                    return (
                      <button
                        key={point.value}
                        onClick={() => handleTargetSelect(point.value)}
                        className={`p-1.5 md:p-2 rounded-md border-2 transition-all duration-200 font-rajdhani font-bold text-xs
                          ${isSelected
                            ? 'bg-brand-purple border-brand-purple-light text-white shadow-glow scale-105'
                            : 'bg-brand-black-light border-white/10 text-brand-gray-300 hover:border-brand-purple/50 hover:bg-brand-purple/20 hover:text-white'
                          }`}
                      >
                        {point.display}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Calculate Button and Result */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Calculate Button */}
              <div className="flex justify-center lg:justify-start">
                <button
                  onClick={calculatePrice}
                  disabled={!selectedCurrent || !selectedTarget || isCalculating}
                  className="bg-brand-purple hover:bg-brand-purple-light text-white font-bold py-2 px-6 rounded-lg transition-all 
                    shadow-glow hover:shadow-glow-hover
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-purple disabled:hover:shadow-glow
                    font-rajdhani text-sm flex items-center gap-2"
                >
                  {isCalculating ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Calculando...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5" />
                      CALCULAR PREÇO
                    </>
                  )}
                </button>
              </div>

              {/* Price Result */}
              <div className="bg-brand-purple/10 border border-brand-purple/30 rounded-xl p-3 md:p-4">
                <h3 className="text-lg md:text-xl font-bold font-orbitron mb-2">
                  <span className="text-brand-purple-light">PREÇO</span>
                  <span className="text-white"> ESTIMADO</span>
                </h3>

                {isCalculating ? (
                  <div className="text-center py-2">
                    <div className="inline-flex items-center gap-3 text-brand-purple-light">
                      <svg className="animate-spin h-6 w-6 md:h-8 md:w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm md:text-base font-rajdhani font-semibold">
                        Calculando preço...
                      </span>
                    </div>
                  </div>
                ) : price > 0 ? (
                  <div className="text-center">
                    <div className="text-2xl md:text-4xl font-bold text-brand-purple-light font-orbitron mb-1">
                      R$ {price.toFixed(2)}
                    </div>
                    <p className="text-xs md:text-sm text-brand-gray-300 font-rajdhani mb-3">
                      {selectedMode === 'PREMIER'
                        ? `${selectedCurrent}K → ${selectedTarget}K pontos`
                        : `Nível ${selectedCurrent} → Nível ${selectedTarget}`}
                    </p>
                    {user && hasActiveOrderInMode ? (
                      <div>
                        <button
                          disabled={true}
                          className="w-full bg-brand-black-light text-brand-gray-500 font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg opacity-50 cursor-not-allowed text-sm md:text-base mb-2 font-rajdhani"
                        >
                          BOOST JÁ ATIVO NESTA MODALIDADE
                        </button>
                        <p className="text-xs text-amber-500 font-rajdhani">
                          Finalize seu pedido atual para contratar um novo
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleHire}
                        disabled={isLoading}
                        className="w-full bg-brand-purple-dark hover:bg-brand-purple text-white font-bold py-3 px-6 rounded-lg transition-all 
                          shadow-glow hover:shadow-glow-hover
                          disabled:opacity-50 disabled:cursor-not-allowed
                          font-rajdhani text-sm md:text-base flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processando...
                          </>
                        ) : (
                          <>
                            <Zap className="h-5 w-5" />
                            CONTRATAR AGORA
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-xs md:text-sm text-brand-gray-500 font-rajdhani py-4">
                    {selectedMode === 'PREMIER'
                      ? 'Selecione as pontuações e clique em "Calcular Preço"'
                      : 'Selecione os níveis e clique em "Calcular Preço"'}
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
