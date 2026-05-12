'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { CartItem } from '@/types'
import { handleServiceHire } from '@/lib/cart-utils'
import { getGameConfig, GameId, ServiceType } from '@/lib/games-config'
import { showError } from '@/lib/toast'
import { AlertCircle, Calculator, Sword, Users, Zap, Clock } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/common/loading-spinner'

interface GameCalculatorProps {
  gameId?: GameId
}

interface ActiveOrder {
  id: number
  status: string
  gameMode: string
}

const gameMode = 'PREMIER'

export function CS2Calculator({ gameId = 'CS2' }: GameCalculatorProps) {
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>('RANK_BOOST')
  const [price, setPrice] = useState(0)
  const [selectedCurrent, setSelectedCurrent] = useState('')
  const [selectedTarget, setSelectedTarget] = useState('')
  const [selectedHours, setSelectedHours] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([])
  const [dynamicPoints, setDynamicPoints] = useState<number[] | null>(null)
  const [availableHours, setAvailableHours] = useState<number[]>([])
  const [isLoadingRanges, setIsLoadingRanges] = useState(false)
  const { user } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()

  const gameConfig = getGameConfig(gameId)
  const modeConfig = gameConfig?.modes?.[gameMode]
  const serviceTypeInfo = selectedServiceType ? gameConfig?.serviceTypeInfo?.[selectedServiceType] : undefined

  // Fetch dynamic rating points or coaching hours from API
  useEffect(() => {
    if (!selectedServiceType) return

    const fetchRanges = async () => {
      setIsLoadingRanges(true)
      try {
        const params = new URLSearchParams({
          game: gameId,
          gameMode,
          serviceType: selectedServiceType,
        })
        const response = await fetch(`/api/pricing/ranges?${params}`)
        if (response.ok) {
          const data = await response.json()

          if (selectedServiceType === 'COACHING') {
            const hours = data.data?.hours
            if (hours && hours.length > 0) {
              setAvailableHours(hours)
            } else {
              // Fallback: generate 1–10 hours
              setAvailableHours(Array.from({ length: 10 }, (_, i) => i + 1))
            }
            setDynamicPoints(null)
          } else {
            const points = data.data?.points
            if (points && points.length > 0) {
              setDynamicPoints(points)
            } else {
              setDynamicPoints(null)
            }
            setAvailableHours([])
          }
        } else {
          setDynamicPoints(null)
          if (selectedServiceType === 'COACHING') {
            setAvailableHours(Array.from({ length: 10 }, (_, i) => i + 1))
          }
        }
      } catch {
        setDynamicPoints(null)
        if (selectedServiceType === 'COACHING') {
          setAvailableHours(Array.from({ length: 10 }, (_, i) => i + 1))
        }
      } finally {
        setIsLoadingRanges(false)
      }
    }

    fetchRanges()
  }, [gameId, selectedServiceType])

  // Check for active orders when user is logged in
  useEffect(() => {
    const checkActiveOrders = async () => {
      if (!user) {
        setActiveOrders([])
        return
      }

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

          const activeInMode = orders.filter((order: ActiveOrder) =>
            ['PENDING', 'PAID', 'IN_PROGRESS'].includes(order.status) &&
            order.gameMode === gameMode
          )

          setActiveOrders(activeInMode)
        }
      } catch (error) {
        console.error('Error checking active orders:', error)
      }
    }

    checkActiveOrders()
  }, [user])

  const hasActiveOrderInMode = activeOrders.length > 0

  const handleHire = async () => {
    if (!gameConfig || !modeConfig || !selectedServiceType) return

    if (selectedServiceType === 'COACHING') {
      if (!selectedHours || price <= 0) return
    } else {
      if (!selectedCurrent || !selectedTarget || price <= 0) return
    }

    setIsLoading(true)
    const typeLabel = serviceTypeInfo?.displayName || 'Boost'

    let cartItem: CartItem

    if (selectedServiceType === 'COACHING') {
      cartItem = {
        game: gameId,
        serviceName: `${typeLabel} ${gameConfig.displayName} ${modeConfig.displayName}: ${selectedHours}h`,
        description: `${typeLabel} profissional no ${gameConfig.name} ${modeConfig.name} — ${selectedHours} hora${selectedHours > 1 ? 's' : ''}`,
        currentRank: `${selectedHours}h`,
        targetRank: `${selectedHours}h`,
        price,
        duration: `${selectedHours} hora${selectedHours > 1 ? 's' : ''}`,
        metadata: {
          hours: selectedHours,
          gameType: `${gameId}_${gameMode}`,
          mode: gameMode,
          serviceType: selectedServiceType,
        },
      }
    } else {
      const currentValue = parseInt(selectedCurrent) * 1000
      const targetValue = parseInt(selectedTarget) * 1000
      const displayCurrent = `${selectedCurrent}K`
      const displayTarget = `${selectedTarget}K`

      cartItem = {
        game: gameId,
        serviceName: `${typeLabel} ${gameConfig.displayName} ${modeConfig.displayName}: ${displayCurrent} → ${displayTarget}`,
        description: `${typeLabel} profissional no ${gameConfig.name} ${modeConfig.name} de ${displayCurrent} para ${displayTarget}`,
        currentRank: displayCurrent,
        targetRank: displayTarget,
        price,
        duration: '2-5 dias',
        metadata: {
          currentRating: currentValue,
          targetRating: targetValue,
          gameType: `${gameId}_${gameMode}`,
          mode: gameMode,
          serviceType: selectedServiceType,
        },
      }
    }

    try {
      const result = await handleServiceHire(
        cartItem,
        !!user,
        addItem,
        () => {
          router.replace('/login')
        }
      )

      if (result.orderCreated && result.orderId) {
        router.replace(`/payment?orderId=${result.orderId}&total=${result.price}`)
      }
    } catch (error) {
      console.error('Erro ao contratar serviço:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao contratar serviço. Tente novamente.'
      showError('Erro', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset seleções ao mudar de tipo de serviço
  const handleServiceTypeChange = (type: ServiceType) => {
    if (type === selectedServiceType) return

    setSelectedServiceType(type)
    setSelectedCurrent('')
    setSelectedTarget('')
    setPrice(0)

    if (type === 'COACHING') {
      setSelectedHours(null)
    } else {
      setSelectedHours(null)
    }
  }

  // Obter pontos de rating (dynamic from API or fallback to static)
  const getRatingPoints = (isTarget: boolean = false) => {
    if (!modeConfig) return []

    const basePoints = dynamicPoints || modeConfig.ratingPoints
    if (!basePoints) return []

    const filteredPoints = isTarget
      ? basePoints
      : basePoints.filter(p => p < basePoints[basePoints.length - 1])

    return filteredPoints.map(value => ({
      value,
      display: `${value / 1000}K`,
    }))
  }

  const currentRatingPoints = getRatingPoints(false)
  const targetRatingPoints = getRatingPoints(true)

  const calculatePrice = async () => {
    if (!modeConfig || !selectedServiceType) {
      setPrice(0)
      return
    }

    if (selectedServiceType === 'COACHING') {
      if (!selectedHours) {
        setPrice(0)
        return
      }

      setIsCalculating(true)
      try {
        const response = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game: gameId,
            gameMode,
            serviceType: selectedServiceType,
            hours: selectedHours,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          showError('Erro ao calcular preço', error.message || 'Não foi possível calcular o preço')
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
      return
    }

    if (!selectedCurrent || !selectedTarget) {
      setPrice(0)
      return
    }

    const current = parseInt(selectedCurrent)
    const target = parseInt(selectedTarget)

    if (current >= target) {
      setPrice(0)
      return
    }

    const currentValue = current * 1000
    const targetValue = target * 1000

    setIsCalculating(true)
    try {
      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: gameId,
          gameMode,
          serviceType: selectedServiceType,
          current: currentValue,
          target: targetValue,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        showError('Erro ao calcular preço', error.message || 'Não foi possível calcular o preço')
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
    setSelectedCurrent((value / 1000).toString())
  }

  const handleTargetSelect = (value: number) => {
    setSelectedTarget((value / 1000).toString())
  }

  const isCalculateDisabled = selectedServiceType === 'COACHING'
    ? !selectedHours || isCalculating
    : !selectedCurrent || !selectedTarget || isCalculating

  const getServiceIcon = (type: ServiceType) => {
    if (type === 'RANK_BOOST') return Sword
    if (type === 'DUO_BOOST') return Users
    return Clock
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
          {/* Service Type Selection — Phase A (full cards) or Phase B (compact bar) */}
          {selectedServiceType === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {([
                {
                  type: 'RANK_BOOST' as ServiceType,
                  Icon: Sword,
                  title: 'Rank Boost',
                  description: 'Nosso booster joga por você e sobe seu rank profissionalmente.',
                },
                {
                  type: 'DUO_BOOST' as ServiceType,
                  Icon: Users,
                  title: 'Duo Boost',
                  description: 'Você joga ao lado de um booster profissional para subir juntos.',
                },
                {
                  type: 'COACHING' as ServiceType,
                  Icon: Clock,
                  title: 'Coaching',
                  description: 'Aulas com um profissional para melhorar suas habilidades.',
                },
              ] as const).map(({ type, Icon, title, description }) => (
                <button
                  key={type}
                  onClick={() => handleServiceTypeChange(type)}
                  className="bg-brand-black-light border border-brand-purple/30 rounded-xl p-6 cursor-pointer
                    hover:border-brand-purple hover:shadow-glow transition-all duration-300
                    flex flex-col items-center text-center"
                >
                  <Icon className="h-10 w-10 text-brand-purple-light mb-3" />
                  <h3 className="text-lg font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {title}
                  </h3>
                  <p className="text-sm text-brand-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {description}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {(['RANK_BOOST', 'DUO_BOOST', 'COACHING'] as ServiceType[]).map((type) => {
                const info = gameConfig.serviceTypeInfo?.[type]
                const isSelected = selectedServiceType === type
                const Icon = getServiceIcon(type)
                return (
                  <button
                    key={type}
                    onClick={() => handleServiceTypeChange(type)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 font-rajdhani font-bold text-sm
                      ${isSelected
                        ? 'bg-brand-purple border border-transparent text-white shadow-glow'
                        : 'bg-brand-black-light border border-white/10 text-brand-gray-400 hover:border-brand-purple/50 hover:text-white'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {info?.displayName || type}
                  </button>
                )
              })}
            </div>
          )}

          {selectedServiceType !== null && (
            <div key={selectedServiceType} className="animate-fadeInUp">
              {/* Service Type Description */}
              {serviceTypeInfo && (
                <p className="text-xs text-brand-gray-400 text-center mb-3 font-rajdhani">
                  {serviceTypeInfo.description}
                </p>
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
                          Você tem {activeOrders.length} pedido{activeOrders.length > 1 ? 's' : ''}{' '}
                          {activeOrders[0].status === 'PENDING' ? 'pendente' : activeOrders[0].status === 'PAID' ? 'pago' : 'em andamento'} de boost Premier.
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
                {/* Coaching: hours selector */}
                {selectedServiceType === 'COACHING' ? (
                  isLoadingRanges ? (
                    <div>
                      <Skeleton className="h-6 w-40 mb-2 bg-white/5" />
                      <div className="grid grid-cols-5 gap-1.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <Skeleton key={i} className="h-9 bg-white/5 rounded-md" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-white font-orbitron mb-2">
                        QUANTIDADE DE HORAS:
                      </h3>
                      <div className="grid grid-cols-5 gap-1.5">
                        {availableHours.map((h) => {
                          const isSelected = selectedHours === h
                          return (
                            <button
                              key={h}
                              onClick={() => { setSelectedHours(h); setPrice(0) }}
                              className={`p-1.5 md:p-2 rounded-md border-2 transition-all duration-200 font-rajdhani font-bold text-xs
                                ${isSelected
                                  ? 'bg-brand-purple border-brand-purple-light text-white shadow-glow'
                                  : 'bg-brand-black-light border-white/10 text-brand-gray-300 hover:border-brand-purple/50 hover:bg-brand-purple/20 hover:text-white'
                                }`}
                            >
                              {h}h
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  /* Rank Boost / Duo Boost: current and target rating */
                  isLoadingRanges ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Skeleton className="h-6 w-40 mb-2 bg-white/5" />
                        <div className="grid grid-cols-5 gap-1.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 bg-white/5 rounded-md" />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Skeleton className="h-6 w-44 mb-2 bg-white/5" />
                        <div className="grid grid-cols-5 gap-1.5">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton key={i} className="h-9 bg-white/5 rounded-md" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Current Rating */}
                      <div>
                        <h3 className="text-base md:text-lg font-bold text-white font-orbitron mb-2">
                          PONTUAÇÃO ATUAL:
                        </h3>
                        <div className="grid grid-cols-5 gap-1.5">
                          {currentRatingPoints.map((point) => {
                            const displayValue = (point.value / 1000).toString()
                            const isSelected = selectedCurrent === displayValue

                            return (
                              <button
                                key={point.value}
                                onClick={() => handleCurrentSelect(point.value)}
                                className={`p-1.5 md:p-2 rounded-md border-2 transition-all duration-200 font-rajdhani font-bold text-xs
                                  ${isSelected
                                    ? 'bg-brand-purple border-brand-purple-light text-white shadow-glow'
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
                          PONTUAÇÃO DESEJADA:
                        </h3>
                        <div className="grid grid-cols-5 gap-1.5">
                          {targetRatingPoints.map((point) => {
                            const displayValue = (point.value / 1000).toString()
                            const isSelected = selectedTarget === displayValue

                            return (
                              <button
                                key={point.value}
                                onClick={() => handleTargetSelect(point.value)}
                                className={`p-1.5 md:p-2 rounded-md border-2 transition-all duration-200 font-rajdhani font-bold text-xs
                                  ${isSelected
                                    ? 'bg-brand-purple border-brand-purple-light text-white shadow-glow'
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
                  )
                )}

                {/* Calculate Button and Result */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Calculate Button */}
                  <div className="flex justify-center lg:justify-start">
                    <button
                      onClick={calculatePrice}
                      disabled={isCalculateDisabled}
                      className="bg-brand-purple hover:bg-brand-purple-light text-white font-bold py-2 px-6 rounded-lg transition-all
                        shadow-glow hover:shadow-glow-hover
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-purple disabled:hover:shadow-glow
                        font-rajdhani text-sm flex items-center gap-2"
                    >
                      {isCalculating ? (
                        <>
                          <Spinner size="md" />
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
                          <Spinner size="md" />
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
                          {selectedServiceType === 'COACHING'
                            ? `${selectedHours} hora${selectedHours && selectedHours > 1 ? 's' : ''} de coaching`
                            : `${selectedCurrent}K → ${selectedTarget}K pontos`}
                          {selectedServiceType === 'DUO_BOOST' && (
                            <span className="text-brand-purple-light ml-1">(Duo Boost)</span>
                          )}
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
                                <Spinner size="md" />
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
                        {selectedServiceType === 'COACHING'
                          ? 'Selecione a quantidade de horas e clique em "Calcular Preço"'
                          : 'Selecione as pontuações e clique em "Calcular Preço"'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
