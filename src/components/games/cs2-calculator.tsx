'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { CartItem } from '@/types'
import { handleServiceHire } from '@/lib/cart-utils'
import { getGameConfig, GameId, ServiceType } from '@/lib/games-config'
import { showError } from '@/lib/toast'
import { AlertCircle, Sword, Users, Zap, Clock, ArrowRight, ShieldCheck, Headset, Gauge } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/common/loading-spinner'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/lib/api-client'

interface GameCalculatorProps {
  gameId?: GameId
  initialService?: ServiceType
}

interface ActiveOrder {
  id: number
  status: string
  gameMode: string
}

const gameMode = 'PREMIER'

// Valor mínimo por pedido (R$). Os gateways de PIX (Asaas) rejeitam cobranças
// abaixo de R$ 5,00, então bloqueamos a contratação ainda na calculadora.
const MIN_ORDER_PRICE = 5

const SERVICE_ICONS: Partial<Record<ServiceType, typeof Sword>> = {
  RANK_BOOST: Sword,
  DUO_BOOST: Users,
  COACHING: Clock,
}

const SERVICE_ORDER: ServiceType[] = ['RANK_BOOST', 'DUO_BOOST', 'COACHING']

export function CS2Calculator({ gameId = 'CS2', initialService = 'RANK_BOOST' }: GameCalculatorProps) {
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(initialService)
  const [price, setPrice] = useState(0)
  const [currentRating, setCurrentRating] = useState<number>(0)
  const [targetRating, setTargetRating] = useState<number>(1000)
  const [minRating, setMinRating] = useState<number>(0)
  const [maxRating, setMaxRating] = useState<number>(26000)
  const [selectedHours, setSelectedHours] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([])
  const [, setDynamicPoints] = useState<number[] | null>(null)
  const [, setAvailableHours] = useState<number[]>([])
  const [isLoadingRanges, setIsLoadingRanges] = useState(false)
  const { user } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()
  const reduceMotion = useReducedMotion()

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
        const data = await api.get<{ data?: { hours?: number[]; points?: number[]; min?: number; max?: number } }>(`/api/pricing/ranges?${params}`)
        if (data) {

          if (selectedServiceType === 'COACHING') {
            const hours = data.data?.hours
            const min = data.data?.min
            const max = data.data?.max

            if (min !== undefined) setMinRating(min)
            if (max !== undefined) setMaxRating(max)

            if (hours && hours.length > 0) {
              setAvailableHours(hours)
            } else {
              // Fallback: generate 1–10 hours
              setAvailableHours(Array.from({ length: 10 }, (_, i) => i + 1))
              setMinRating(1)
              setMaxRating(10)
            }
            setDynamicPoints(null)
          } else {
            const points = data.data?.points
            const min = data.data?.min
            const max = data.data?.max
            if (min !== undefined) setMinRating(min)
            if (max !== undefined) setMaxRating(max)

            if (points && points.length > 0) {
              setDynamicPoints(points)
              if (currentRating === 0 && targetRating === 1000) {
                setCurrentRating(min ?? 0)
                setTargetRating(Math.min((min ?? 0) + 1000, max ?? 26000))
              }
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

    // Reset ratings isolando os progress bars entre abas/jogos
    const resetRatings = () => {
      const isPremier = gameMode === 'PREMIER'
      setCurrentRating(isPremier ? 0 : 1)
      setTargetRating(isPremier ? 1000 : 2)
      setSelectedHours(1)
    }

    resetRatings()
    fetchRanges()
    // currentRating/targetRating são lidos só como guard de "default inicial"; incluí-los nas deps
    // re-rodaria o effect (resetando a seleção do usuário) a cada ajuste de slider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, gameMode, selectedServiceType])

  // Check for active orders when user is logged in
  useEffect(() => {
    const checkActiveOrders = async () => {
      if (!user) {
        setActiveOrders([])
        return
      }

      try {
        const data = await api.get<{ orders?: ActiveOrder[] }>('/api/orders')
        const orders = data.orders || []

        const activeInMode = orders.filter((order: ActiveOrder) =>
          ['PENDING', 'PAID', 'IN_PROGRESS'].includes(order.status) &&
          order.gameMode === gameMode
        )

        setActiveOrders(activeInMode)
      } catch (error) {
        console.error('Error checking active orders:', error)
      }
    }

    checkActiveOrders()
  }, [user])

  const hasActiveOrderInMode = activeOrders.length > 0
  const isBelowMinimum = price > 0 && price < MIN_ORDER_PRICE

  const handleHire = async () => {
    if (!gameConfig || !modeConfig || !selectedServiceType) return

    if (selectedServiceType === 'COACHING') {
      if (!selectedHours || price <= 0) return
    } else {
      if (currentRating >= targetRating || price <= 0) return
    }

    // Bloqueio de valor mínimo por pedido
    if (price < MIN_ORDER_PRICE) {
      showError(
        'Valor mínimo não atingido',
        `O valor mínimo por pedido é R$ ${MIN_ORDER_PRICE.toFixed(2)}. Aumente o intervalo para continuar.`
      )
      return
    }

    setIsLoading(true)
    const typeLabel = serviceTypeInfo?.displayName || 'Boost'

    let cartItem: CartItem

    if (selectedServiceType === 'COACHING') {
      cartItem = {
        game: gameId,
        serviceName: `${typeLabel} ${gameConfig.displayName} ${modeConfig.displayName}: ${selectedHours}h`,
        description: `${typeLabel} profissional no ${gameConfig.name} ${modeConfig.name} — ${selectedHours} hora${(selectedHours as number) > 1 ? 's' : ''}`,
        currentRank: `${selectedHours}h`,
        targetRank: `${selectedHours}h`,
        price,
        duration: `${selectedHours} hora${(selectedHours as number) > 1 ? 's' : ''}`,
        metadata: {
          hours: selectedHours,
          gameType: `${gameId}_${gameMode}`,
          mode: gameMode,
          serviceType: selectedServiceType,
        },
      }
    } else {
      const currentValue = currentRating
      const targetValue = targetRating
      const displayCurrent = currentValue.toLocaleString('pt-BR')
      const displayTarget = targetValue.toLocaleString('pt-BR')

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
    setCurrentRating(minRating)
    setTargetRating(Math.min(minRating + 1000, maxRating))
    setPrice(0)

    if (type === 'COACHING') {
      setSelectedHours(null)
    } else {
      setSelectedHours(null)
    }
  }

  // Obter pontos de rating (dynamic from API or fallback to static)
  const calculatePrice = async () => {
    // Disable calculate manual caching if needed
    // Calculate is handled by effect now
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
        const data = await api.post<{ data: { price: number } }>('/api/pricing/calculate', {
          game: gameId,
          gameMode,
          serviceType: selectedServiceType,
          hours: selectedHours,
        })
        setPrice(data.data.price)
      } catch (error) {
        console.error('Error calculating price:', error)
        showError('Erro ao calcular preço', error instanceof ApiError ? error.message : 'Não foi possível calcular o preço. Tente novamente.')
        setPrice(0)
      } finally {
        setIsCalculating(false)
      }
      return
    }

    const current = currentRating
    const target = targetRating

    if (current >= target) {
      setPrice(0)
      return
    }

    const currentValue = current
    const targetValue = target

    setIsCalculating(true)
    try {
      const data = await api.post<{ data: { price: number } }>('/api/pricing/calculate', {
        game: gameId,
        gameMode,
        serviceType: selectedServiceType,
        current: currentValue,
        target: targetValue,
      })
      setPrice(data.data.price)
    } catch (error) {
      console.error('Error calculating price:', error)
      showError('Erro ao calcular preço', error instanceof ApiError ? error.message : 'Não foi possível calcular o preço. Tente novamente.')
      setPrice(0)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleCurrentChange = (value: number) => {
    setCurrentRating(Math.min(value, targetRating - 1))
  }

  const handleTargetChange = (value: number) => {
    setTargetRating(Math.max(value, currentRating + 1))
  }

  // Auto-calculate effect
  useEffect(() => {
    const isCoaching = selectedServiceType === 'COACHING'
    if (isCoaching && !selectedHours) {
      setPrice(0)
      return
    }
    if (!isCoaching && currentRating >= targetRating) {
      setPrice(0)
      return
    }

    const timer = setTimeout(() => {
      calculatePrice()
    }, 400)

    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRating, targetRating, selectedHours, selectedServiceType, gameId, gameMode])

  if (!gameConfig || !modeConfig) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="border border-border">
          <CardContent className="p-6">
            <p className="text-center text-foreground">Configuração do jogo não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCoaching = selectedServiceType === 'COACHING'
  const priceSubline = price > 0
    ? (isCoaching
        ? `${selectedHours} hora${selectedHours && selectedHours > 1 ? 's' : ''} de coaching`
        : `${currentRating.toLocaleString('pt-BR')} → ${targetRating.toLocaleString('pt-BR')} pontos`)
    : (isCoaching
        ? 'Selecione as horas para ver o preço'
        : 'Selecione o intervalo para ver o preço')

  return (
    <div className="mx-auto max-w-6xl">
      {/* ── Barra de seleção do tipo de serviço (segmented control) ─────────── */}
      <div className="mb-8">
        <Tabs
          value={selectedServiceType ?? 'RANK_BOOST'}
          onValueChange={(v) => handleServiceTypeChange(v as ServiceType)}
        >
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 rounded-2xl border border-border bg-muted/60 p-1.5">
            {SERVICE_ORDER.map((type) => {
              const Icon = SERVICE_ICONS[type] ?? Sword
              const label = gameConfig.serviceTypeInfo?.[type]?.displayName || type
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="h-auto flex-col gap-1.5 rounded-xl py-3 font-rajdhani font-bold data-[state=active]:border-transparent data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs sm:text-sm">{label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
        {serviceTypeInfo && (
          <p className="mt-3 text-center font-rajdhani text-sm text-muted-foreground">
            {serviceTypeInfo.description}
          </p>
        )}
      </div>

      {/* ── Configurador: configuração (esq.) + resumo fixo (dir.) ──────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Coluna de configuração */}
        <div className="lg:col-span-3">
          <motion.div
            key={selectedServiceType}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-5"
          >
            {/* Aviso de pedido ativo */}
            {user && hasActiveOrderInMode && (
              <Card className="border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="flex items-start gap-3 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500" />
                  <div className="flex-1">
                    <h3 className="font-rajdhani font-bold text-foreground dark:text-yellow-300">
                      Você já possui um serviço ativo
                    </h3>
                    <p className="mt-1 font-rajdhani text-sm text-muted-foreground">
                      Finalize ou cancele o serviço atual antes de contratar um novo.
                    </p>
                    <Button asChild size="sm" className="mt-3 bg-yellow-500 text-black hover:bg-yellow-400">
                      <Link href="/dashboard">Ver meus pedidos</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Painel de configuração */}
            <Card className="border-border">
              <CardContent className="p-5 sm:p-6">
                {isCoaching ? (
                  isLoadingRanges ? (
                    <div>
                      <Skeleton className="mb-5 h-4 w-40" />
                      <Skeleton className="mx-auto h-14 w-48 rounded-md" />
                      <Skeleton className="mt-8 h-2 w-full rounded-full" />
                      <div className="mt-3 flex justify-between">
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="mb-5 font-orbitron text-sm font-bold uppercase tracking-wide text-foreground">
                        Horas de coaching
                      </h3>
                      <div className="mx-auto w-48">
                        <Input
                          type="number"
                          min={minRating || 1}
                          max={maxRating || 10}
                          value={selectedHours || minRating || 1}
                          onChange={(e) => setSelectedHours(Number(e.target.value))}
                          className="h-14 border-brand-purple text-center font-orbitron text-2xl font-bold text-brand-purple-light"
                        />
                      </div>
                      <div className="mt-8 px-1">
                        <Slider
                          min={minRating || 1}
                          max={maxRating || 10}
                          step={1}
                          value={[selectedHours || minRating || 1]}
                          onValueChange={(val) => setSelectedHours(val[0])}
                          className="cursor-pointer py-2"
                        />
                        <div className="mt-3 flex justify-between font-rajdhani text-xs font-medium text-muted-foreground">
                          <span>{minRating || 1}h</span>
                          <span>{maxRating || 10}h</span>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  isLoadingRanges ? (
                    <div>
                      <Skeleton className="mb-5 h-4 w-44" />
                      <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-2">
                          <Skeleton className="mx-auto h-3 w-16" />
                          <Skeleton className="h-12 w-full rounded-md" />
                        </div>
                        <Skeleton className="mb-3 h-5 w-5 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="mx-auto h-3 w-16" />
                          <Skeleton className="h-12 w-full rounded-md" />
                        </div>
                      </div>
                      <Skeleton className="mt-8 h-2 w-full rounded-full" />
                      <div className="mt-3 flex justify-between">
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="mb-5 font-orbitron text-sm font-bold uppercase tracking-wide text-foreground">
                        Intervalo de pontuação
                      </h3>
                      <div className="flex items-end gap-3 sm:gap-4">
                        <div className="flex-1">
                          <label className="mb-2 block text-center font-rajdhani text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Atual
                          </label>
                          <Input
                            type="number"
                            min={minRating}
                            max={targetRating - 1}
                            step={maxRating > 1000 ? 100 : 1}
                            value={currentRating}
                            onChange={(e) => handleCurrentChange(Number(e.target.value))}
                            className="h-12 text-center font-orbitron text-base font-bold sm:text-lg"
                          />
                        </div>
                        <ArrowRight className="mb-3 h-5 w-5 flex-shrink-0 text-brand-purple-light" />
                        <div className="flex-1">
                          <label className="mb-2 block text-center font-rajdhani text-xs font-bold uppercase tracking-wider text-brand-purple-light">
                            Desejado
                          </label>
                          <Input
                            type="number"
                            min={currentRating + 1}
                            max={maxRating}
                            step={maxRating > 1000 ? 100 : 1}
                            value={targetRating}
                            onChange={(e) => handleTargetChange(Number(e.target.value))}
                            className="h-12 border-brand-purple text-center font-orbitron text-base font-bold text-brand-purple-light sm:text-lg"
                          />
                        </div>
                      </div>
                      <div className="mt-8 px-1">
                        <Slider
                          min={minRating}
                          max={maxRating}
                          step={maxRating > 1000 ? 100 : 1}
                          value={[currentRating, targetRating]}
                          onValueChange={(val) => {
                            setCurrentRating(val[0])
                            setTargetRating(val[1])
                          }}
                          className="cursor-pointer py-2"
                        />
                        <div className="mt-3 flex justify-between font-rajdhani text-xs font-medium text-muted-foreground">
                          <span>{minRating.toLocaleString('pt-BR')}</span>
                          <span>{maxRating.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Coluna de resumo (checkout) */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24">
            <Card className="relative overflow-hidden border-brand-purple/40">
              {/* acento superior em gradiente roxo */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-purple to-transparent" />
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="font-rajdhani text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Preço estimado
                  </p>
                  <div className="mt-1 flex min-h-12 items-center">
                    {isCalculating ? (
                      <div className="flex items-center gap-3 text-brand-purple-light">
                        <Spinner size="md" />
                        <span className="font-rajdhani text-sm font-semibold">Calculando…</span>
                      </div>
                    ) : price > 0 ? (
                      <motion.div
                        key={price}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="font-orbitron text-4xl font-bold tabular-nums text-brand-purple-light sm:text-5xl"
                      >
                        R$ {price.toFixed(2)}
                      </motion.div>
                    ) : (
                      <div className="font-orbitron text-4xl font-bold text-muted-foreground sm:text-5xl">—</div>
                    )}
                  </div>
                  <p className="mt-2 font-rajdhani text-sm text-muted-foreground">
                    {priceSubline}
                    {price > 0 && selectedServiceType === 'DUO_BOOST' && (
                      <span className="ml-1 text-brand-purple-light">· Duo</span>
                    )}
                  </p>
                </div>

                <div className="h-px bg-border" />

                <ul className="space-y-2.5 font-rajdhani text-sm text-muted-foreground">
                  {!isCoaching && (
                    <li className="flex items-center gap-2.5">
                      <Gauge className="h-4 w-4 flex-shrink-0 text-brand-purple-light" />
                      Entrega estimada: 2–5 dias
                    </li>
                  )}
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 flex-shrink-0 text-brand-purple-light" />
                    Pagamento 100% seguro via PIX
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Headset className="h-4 w-4 flex-shrink-0 text-brand-purple-light" />
                    Acompanhamento pelo painel
                  </li>
                </ul>

                {user && hasActiveOrderInMode ? (
                  <div className="space-y-2">
                    <Button disabled size="lg" variant="secondary" className="w-full">
                      Boost já ativo nesta modalidade
                    </Button>
                    <p className="font-rajdhani text-xs text-yellow-600 dark:text-yellow-500">
                      Finalize seu pedido atual para contratar um novo.
                    </p>
                  </div>
                ) : isBelowMinimum ? (
                  <div className="space-y-2">
                    <Button disabled size="lg" variant="secondary" className="w-full">
                      Valor abaixo do mínimo
                    </Button>
                    <p className="font-rajdhani text-xs text-yellow-600 dark:text-yellow-500">
                      O mínimo por pedido é R$ {MIN_ORDER_PRICE.toFixed(2)}. Aumente o intervalo
                      {isCoaching ? ' de horas' : ' de pontuação'} para continuar.
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleHire}
                    disabled={isLoading || price <= 0}
                    size="lg"
                    className="w-full text-base"
                  >
                    {isLoading ? (
                      <>
                        <Spinner size="md" />
                        Processando…
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        Contratar agora
                      </>
                    )}
                  </Button>
                )}

                <p className="text-center font-rajdhani text-xs text-muted-foreground">
                  Sem assinatura · Pague apenas pelo serviço
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
