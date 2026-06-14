'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Button } from '@/components/ui/button'
import {
  Package,
  CheckCircle2,
  DollarSign,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatCard } from '@/components/common/stat-card'
import { StatsGrid } from '@/components/common/stats-grid'
import { OrderStatus } from '@/components/common/status-badge'
import { OrderCardShell } from '@/components/common/order-card-shell'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { SkeletonOrdersList, SkeletonStatsGrid } from '@/components/common/skeletons'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ActionButton } from '@/components/common/action-button'
import { RefreshingBanner } from '@/components/common/refreshing-banner'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'
import { api, ApiError } from '@/lib/api-client'
import { showSuccess, showError } from '@/lib/toast'
import { OrderChat } from '@/components/order/order-chat'
import { CompletionProofDialog } from '@/app/booster/_components/completion-proof-dialog'
import { useRealtime } from '@/hooks/use-realtime'

interface Order {
  id: number
  status: OrderStatus
  total: number
  boosterCommission?: number | null
  boosterPercentage?: number | null
  createdAt: string
  boosterId?: number | null
  user: {
    id: number
    email: string
    name?: string
  }
  service: {
    id: number
    name: string
    game: string
    type: string
    description: string
  }
  booster?: {
    id: number
    email: string
    name?: string
  }
  commission?: {
    id: number
    amount: number
    percentage: number
    status: string
    paidAt?: string | null
  } | null
}

interface Stats {
  available: number
  assigned: number
  completed: number
  totalEarnings: number
  pendingEarnings: number
}

/** The booster's commission line, with the snapshot/legacy fallback. `withStatus` appends the paid/pending marker. */
function CommissionInfoItem({ order, withStatus = false }: { order: Order; withStatus?: boolean }) {
  if (order.commission) {
    const statusSuffix = withStatus
      ? ` ${order.commission.status === 'PAID' ? '✓ Pago' : '⏳ Pendente'}`
      : ''
    return (
      <OrderInfoItem
        label="Sua Comissão"
        value={<span className="text-lg font-bold text-foreground dark:text-green-300 font-orbitron">{formatPrice(order.commission.amount)} ({(order.commission.percentage * 100).toFixed(0)}%){statusSuffix}</span>}
      />
    )
  }
  if (order.boosterCommission) {
    return (
      <OrderInfoItem
        label="Sua Comissão"
        value={<span className="text-lg font-bold text-foreground dark:text-green-300 font-orbitron">{formatPrice(order.boosterCommission)} ({(order.boosterPercentage ? order.boosterPercentage * 100 : 70).toFixed(0)}%)</span>}
      />
    )
  }
  return null
}

export default function BoosterDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const { loading, refreshing, withLoading } = useLoading({ initialLoading: true })
  const [activeTab, setActiveTab] = useState('available')
  const initialTabSet = useRef(false)
  const [orderToAction, setOrderToAction] = useState<number | null>(null)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [hasPixKey, setHasPixKey] = useState<boolean | null>(null)
  const [hasCredentialsMap, setHasCredentialsMap] = useState<Record<number, boolean>>({})
  const [startingOrderId, setStartingOrderId] = useState<number | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      // Usar replace para redirecionamento de autenticação
      router.replace('/login')
    } else if (user && user.role !== 'BOOSTER') {
      // Redirecionar baseado no role usando replace
      if (user.role === 'ADMIN') {
        router.replace('/admin')
      } else if (user.role === 'CLIENT') {
        router.replace('/dashboard')
      } else {
        router.replace('/')
      }
    }
  }, [user, authLoading, router])

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    if (user && user.role === 'BOOSTER') {
      fetchOrders(false)
      api.get<{ pixKey?: string }>('/api/user/bank-account')
        .then((data) => setHasPixKey(!!data.pixKey))
        .catch(() => setHasPixKey(true)) // fail open — server will enforce
    }
    // Carga inicial única por usuário: fetchOrders depende de activeTab; incluí-lo aqui
    // dispararia o load COMPLETO a cada troca de tab (o refresh silencioso é feito no effect abaixo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // On first stats load, default to 'assigned' tab if booster has in-progress orders
  useEffect(() => {
    if (stats && !initialTabSet.current) {
      initialTabSet.current = true
      if (stats.assigned > 0) {
        setActiveTab('assigned')
      }
    }
  }, [stats])

  // Recarregar quando tab muda, mas sem mostrar loading completo
  useEffect(() => {
    if (user && user.role === 'BOOSTER' && !loading) {
      fetchOrders(true)
    }
    // Refresh silencioso apenas na troca de tab (deps amplas re-disparariam fetches indevidos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Função para atualizar apenas os dados sem mostrar banner de refreshing
  const updateOrdersSilently = async () => {
    const params = new URLSearchParams()
    if (activeTab === 'available') {
      params.append('type', 'available')
    } else if (activeTab === 'assigned') {
      params.append('type', 'assigned')
    } else if (activeTab === 'completed') {
      params.append('type', 'completed')
    }

    try {
      const data = await api.get<{ orders?: typeof orders; stats?: typeof stats }>(`/api/booster/orders?${params.toString()}`)
      setOrders(data.orders || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Erro ao atualizar pedidos silenciosamente:', error)
    }
  }

  // Atualizações em tempo real via SSE - atualização silenciosa
  useRealtime({
    enabled: user?.role === 'BOOSTER',
    onOrderUpdate: (data) => {
      // Atualizar silenciosamente quando houver mudanças nos pedidos disponíveis
      if (data.available !== undefined) {
        const previousAvailable = stats?.available || 0
        
        // Atualizar apenas quando o número de pedidos disponíveis mudou
        // Isso evita atualizações desnecessárias
        if (data.available !== previousAvailable) {
          // Se estiver na aba de disponíveis, atualizar a lista
          if (activeTab === 'available') {
            updateOrdersSilently()
          } else {
            // Se não está na aba de disponíveis, apenas atualizar stats
            updateOrdersSilently()
          }
        }
      }
      // Atualizar quando meus pedidos mudarem (se estiver na aba de assigned)
      if (data.myOrders !== undefined && activeTab === 'assigned') {
        updateOrdersSilently()
      }
    },
  })

  const fetchOrders = async (isRefresh = false) => {
    await withLoading(async () => {
      const params = new URLSearchParams()
      if (activeTab === 'available') {
        params.append('type', 'available')
      } else if (activeTab === 'assigned') {
        params.append('type', 'assigned')
      } else if (activeTab === 'completed') {
        params.append('type', 'completed')
      }

      try {
        const data = await api.get<{ orders?: typeof orders; stats?: typeof stats }>(`/api/booster/orders?${params.toString()}`)
        setOrders(data.orders || [])
        setStats(data.stats || null)
      } catch {
        // silencioso
      }
    }, isRefresh)
  }

  const handleStartOrder = async (orderId: number) => {
    setStartingOrderId(orderId)
    try {
      await api.post(`/api/booster/orders/${orderId}/start`)
      showSuccess('Boost iniciado com sucesso!')
      fetchOrders(true)
    } catch (e) {
      showError(e instanceof ApiError ? e.message : 'Erro ao iniciar pedido')
    } finally {
      setStartingOrderId(null)
    }
  }

  const handleAcceptOrderClick = (orderId: number) => {
    setOrderToAction(orderId)
    setAcceptDialogOpen(true)
  }

  const handleAcceptOrder = async () => {
    if (!orderToAction) return

    setIsAccepting(true)
    try {
      await api.post(`/api/booster/orders/${orderToAction}`)
      setAcceptDialogOpen(false)
      setOrderToAction(null)
      showSuccess('Pedido aceito com sucesso!')
      fetchOrders(true)
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error)
      showError('Erro ao aceitar pedido', error instanceof ApiError ? error.message : 'Tente novamente.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleCompleteOrderClick = (orderId: number) => {
    setOrderToAction(orderId)
    setCompleteDialogOpen(true)
  }

  const handleCompleteOrder = async (proofFile: File) => {
    if (!orderToAction) return

    setIsUploading(true)
    try {
      // 1. Upload the proof screenshot (FormData — the client skips JSON encoding for it)
      const formData = new FormData()
      formData.append('file', proofFile)
      const { url: completionProofUrl } = await api.post<{ url: string }>('/api/upload/completion-proof', formData)

      // 2. Mark order as completed with the proof URL
      setIsUploading(false)
      setIsCompleting(true)
      await api.put(`/api/booster/orders/${orderToAction}`, { status: 'COMPLETED', completionProofUrl })
      setCompleteDialogOpen(false)
      setOrderToAction(null)
      showSuccess('Pedido marcado como concluído!')
      fetchOrders(true)
    } catch (error) {
      console.error('Erro ao concluir pedido:', error)
      showError('Erro ao concluir pedido', error instanceof ApiError ? error.message : 'Tente novamente.')
    } finally {
      setIsUploading(false)
      setIsCompleting(false)
    }
  }


  // Loading de tela inteira apenas para autenticação
  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'BOOSTER') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        <PageHeader
          highlight="MEUS"
          title="TRABALHOS"
          description={`Olá, ${user.name || user.email}! Gerencie seus pedidos e ganhos.`}
        />

        {hasPixKey === false && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-xl flex items-center gap-3">
            <div className="flex-1">
              <p className="text-foreground dark:text-yellow-300 font-semibold font-orbitron text-sm">
                CHAVE PIX NÃO CADASTRADA
              </p>
              <p className="text-yellow-400/80 text-sm font-rajdhani mt-0.5">
                Você precisa cadastrar sua chave PIX para aceitar pedidos e receber pagamentos.
              </p>
            </div>
            <Link href="/profile">
              <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold flex-shrink-0">
                Cadastrar PIX
              </Button>
            </Link>
          </div>
        )}

        {/* Cards de Estatísticas e Navegação */}
        {loading && !stats ? (
          <SkeletonStatsGrid count={4} />
        ) : stats ? (
          <StatsGrid columns={4} className="mb-6 lg:mb-8">
            <StatCard
              title="Disponíveis"
              value={stats.available}
              description="Pedidos pendentes"
              icon={Package}
              iconColor="text-yellow-500"
              valueColor="text-foreground dark:text-yellow-500"
            />
            <StatCard
              title="Em Andamento"
              value={stats.assigned}
              description="Pedidos ativos"
              icon={Loader2}
              iconColor="text-blue-500"
              valueColor="text-foreground dark:text-blue-500"
            />
            <StatCard
              title="Concluídos"
              value={stats.completed}
              description="Pedidos finalizados"
              icon={CheckCircle2}
              iconColor="text-green-500"
              valueColor="text-foreground dark:text-green-500"
            />
            <StatCard
              title="Ganhos Pendentes"
              value={formatPrice(stats.pendingEarnings)}
              description="Aguardando pagamento"
              icon={DollarSign}
              valueColor="text-foreground dark:text-yellow-300"
            />
          </StatsGrid>
        ) : null}

        {/* Tabs de navegação */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-card border border-brand-purple/30 rounded-lg p-1 gap-1 h-auto">
            <TabsTrigger
              value="available"
              className="font-rajdhani font-bold transition-all duration-200 rounded-md py-2 px-4
                data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-brand-purple-light data-[state=inactive]:hover:bg-brand-purple/20"
            >
              Disponíveis
              {stats && stats.available > 0 && (
                <span className="ml-2 bg-yellow-500/20 text-foreground dark:text-yellow-300 text-xs px-1.5 py-0.5 rounded font-bold">
                  {stats.available}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="assigned"
              className="font-rajdhani font-bold transition-all duration-200 rounded-md py-2 px-4
                data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-brand-purple-light data-[state=inactive]:hover:bg-brand-purple/20"
            >
              Em Andamento
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="font-rajdhani font-bold transition-all duration-200 rounded-md py-2 px-4
                data-[state=active]:bg-brand-purple data-[state=active]:text-white data-[state=active]:shadow-glow
                data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-brand-purple-light data-[state=inactive]:hover:bg-brand-purple/20"
            >
              Concluídos
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pedidos Disponíveis */}
        {activeTab === 'available' && (
          <div className="mt-6">
            {refreshing && <RefreshingBanner />}
            {loading && !refreshing ? (
              <SkeletonOrdersList count={3} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Nenhum pedido disponível"
                description="Não há pedidos pendentes no momento."
              />
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => {
                  return (
                    <OrderCardShell
                      key={order.id}
                      title={order.service.name}
                      description={order.service.description}
                      status={order.status}
                    >
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <CommissionInfoItem order={order} />
                          <OrderInfoItem label="Cliente" value={order.user.name || order.user.email} />
                          <OrderInfoItem label="Jogo" value={order.service.game} />
                        </div>

                        <ActionButton
                          onClick={() => handleAcceptOrderClick(order.id)}
                          icon={Check}
                          className="w-full"
                          disabled={!hasPixKey}
                          title={!hasPixKey ? 'Cadastre sua chave PIX no perfil para aceitar pedidos' : undefined}
                        >
                          Aceitar Pedido
                        </ActionButton>
                        <ConfirmDialog
                          open={acceptDialogOpen && orderToAction === order.id}
                          onOpenChange={setAcceptDialogOpen}
                          title="Aceitar Pedido"
                          description="Tem certeza que deseja aceitar este pedido? Você será responsável por completar o serviço."
                          confirmLabel="Aceitar"
                          cancelLabel="Cancelar"
                          onConfirm={handleAcceptOrder}
                          loading={isAccepting}
                        />
                      </div>
                    </OrderCardShell>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Pedidos em Andamento */}
        {activeTab === 'assigned' && (
          <div className="mt-6">
            {refreshing && <RefreshingBanner />}
            {loading && !refreshing ? (
              <SkeletonOrdersList count={3} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={Loader2}
                title="Nenhum pedido em andamento"
                description="Você não tem pedidos em progresso no momento."
              />
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => {
                  return (
                    <OrderCardShell
                      key={order.id}
                      title={order.service.name}
                      description={order.service.description}
                      status={order.status}
                    >
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CommissionInfoItem order={order} />
                            <OrderInfoItem label="Cliente" value={order.user.name || order.user.email} />
                            <OrderInfoItem label="Data do Pedido" value={formatDate(order.createdAt)} />
                          </div>

                          {/* Chat for PAID orders awaiting credentials */}
                          {order.status === 'PAID' && (
                            <div className="border-t border-border pt-4">
                              <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-foreground dark:text-yellow-300 text-sm font-rajdhani">
                                  Aguardando credenciais Steam do cliente. Peça ao cliente para enviar pelo chat abaixo.
                                </p>
                              </div>
                              <OrderChat
                                orderId={order.id}
                                onMessagesUpdate={(messages) => {
                                  const hasCreds = messages.some(
                                    (m) => m.messageType === 'STEAM_CREDENTIALS' && !m.isExpired
                                  )
                                  setHasCredentialsMap((prev) => ({ ...prev, [order.id]: hasCreds }))
                                }}
                              />
                              <div className="mt-3 flex justify-end">
                                <Button
                                  onClick={() => handleStartOrder(order.id)}
                                  disabled={!hasCredentialsMap[order.id] || startingOrderId === order.id}
                                  className="bg-green-600 hover:bg-green-500 text-white font-bold disabled:opacity-40"
                                  title={!hasCredentialsMap[order.id] ? 'Aguardando credenciais Steam do cliente' : undefined}
                                >
                                  {startingOrderId === order.id ? (
                                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Iniciando…</>
                                  ) : (
                                    'Iniciar Boost'
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Chat + complete button for IN_PROGRESS orders */}
                          {order.status === 'IN_PROGRESS' && (
                            <>
                              <div className="border-t border-border pt-4">
                                <OrderChat orderId={order.id} />
                              </div>
                              <ActionButton
                                onClick={() => handleCompleteOrderClick(order.id)}
                                variant="success"
                                icon={CheckCircle2}
                                className="w-full"
                              >
                                Marcar como Concluído
                              </ActionButton>
                            </>
                          )}

                        </div>
                    </OrderCardShell>
                  )
                })}
              </div>
            )}

            {/* Single completion proof dialog — outside the map to avoid shared state issues */}
            <CompletionProofDialog
              open={completeDialogOpen}
              onOpenChange={setCompleteDialogOpen}
              onConfirm={handleCompleteOrder}
              submitting={isUploading || isCompleting}
              submittingLabel={isUploading ? 'Enviando print…' : 'Concluindo…'}
            />
          </div>
        )}

        {/* Pedidos Concluídos */}
        {activeTab === 'completed' && (
          <div className="mt-6">
            {refreshing && <RefreshingBanner />}
            {loading && !refreshing ? (
              <SkeletonOrdersList count={3} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nenhum pedido concluído"
                description="Você ainda não concluiu nenhum pedido."
              />
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => {
                  return (
                    <OrderCardShell
                      key={order.id}
                      title={order.service.name}
                      description={order.service.description}
                      status={order.status}
                      glow={false}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <CommissionInfoItem order={order} withStatus />
                        <OrderInfoItem label="Cliente" value={order.user.name || order.user.email} />
                        <OrderInfoItem label="Data de Conclusão" value={formatDate(order.createdAt)} />
                      </div>
                    </OrderCardShell>
                  )
                })}
              </div>
            )}
          </div>
        )}
    </div>
  )
}

