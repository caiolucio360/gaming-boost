'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Package,
  CheckCircle2,
  DollarSign,
  Check,
  Loader2,
} from 'lucide-react'
import { StatCard } from '@/components/common/stat-card'
import { StatusBadge, OrderStatus } from '@/components/common/status-badge'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { DashboardCard } from '@/components/common/dashboard-card'
import Link from 'next/link'
import { OrdersListSkeleton, StatsGridSkeleton } from '@/components/common/loading-skeletons'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ActionButton } from '@/components/common/action-button'
import { RefreshingBanner } from '@/components/common/refreshing-banner'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
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


export default function BoosterDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const { loading, refreshing, withLoading } = useLoading({ initialLoading: true })
  const [activeTab, setActiveTab] = useState('available')
  const [orderToAction, setOrderToAction] = useState<number | null>(null)
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [alert, setAlert] = useState<{ title: string; description: string; variant: 'default' | 'destructive' } | null>(null)

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
    }
  }, [user?.id]) // Usar apenas user.id para evitar re-renders desnecessários

  // Recarregar quando tab muda, mas sem mostrar loading completo
  useEffect(() => {
    if (user && user.role === 'BOOSTER' && !loading) {
      fetchOrders(true)
    }
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
      const response = await fetch(`/api/booster/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setStats(data.stats || null)
      }
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

      const response = await fetch(`/api/booster/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setStats(data.stats || null)
      }
    }, isRefresh)
  }

  const handleAcceptOrderClick = (orderId: number) => {
    setOrderToAction(orderId)
    setAcceptDialogOpen(true)
  }

  const handleAcceptOrder = async () => {
    if (!orderToAction) return

    setIsAccepting(true)
    try {
      const response = await fetch(`/api/booster/orders/${orderToAction}`, {
        method: 'POST',
      })

      if (response.ok) {
        setAcceptDialogOpen(false)
        setOrderToAction(null)
        setAlert({
          title: 'Sucesso',
          description: 'Pedido aceito com sucesso!',
          variant: 'default',
        })
        fetchOrders(true) // Refresh sem loading completo
        setTimeout(() => setAlert(null), 5000)
      } else {
        const data = await response.json()
        setAlert({
          title: 'Erro',
          description: data.message || 'Erro ao aceitar pedido',
          variant: 'destructive',
        })
        setTimeout(() => setAlert(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao aceitar pedido',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleCompleteOrderClick = (orderId: number) => {
    setOrderToAction(orderId)
    setCompleteDialogOpen(true)
  }

  const handleCompleteOrder = async () => {
    if (!orderToAction) return

    setIsCompleting(true)
    try {
      const response = await fetch(`/api/booster/orders/${orderToAction}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })

      if (response.ok) {
        setCompleteDialogOpen(false)
        setOrderToAction(null)
        setAlert({
          title: 'Sucesso',
          description: 'Pedido marcado como concluído!',
          variant: 'default',
        })
        fetchOrders(true) // Refresh sem loading completo
        setTimeout(() => setAlert(null), 5000)
      } else {
        const data = await response.json()
        setAlert({
          title: 'Erro',
          description: data.message || 'Erro ao atualizar pedido',
          variant: 'destructive',
        })
        setTimeout(() => setAlert(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao atualizar pedido',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    } finally {
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
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
        {alert && (
          <Alert variant={alert.variant} className="mb-4">
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}
        <PageHeader
          highlight="MEUS"
          title="TRABALHOS"
          description={`Olá, ${user.name || user.email}! Gerencie seus pedidos e ganhos.`}
        />

        {/* Link para Pagamentos */}
        <div className="mb-6">
          <Link href="/booster/payments">
            <Button className="bg-gradient-to-r from-brand-purple to-brand-purple-light text-white shadow-lg border border-transparent hover:border-white/50 transition-all duration-200">
              <DollarSign className="h-4 w-4 mr-2" />
              Ver Meus Pagamentos
            </Button>
          </Link>
        </div>

        {/* Cards de Estatísticas e Navegação */}
        {loading && !stats ? (
          <StatsGridSkeleton count={5} />
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {/* Card de Navegação - Disponíveis */}
            <Card
              onClick={() => setActiveTab('available')}
              className={`cursor-pointer transition-all duration-200 ${
                activeTab === 'available'
                  ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/70 shadow-lg shadow-yellow-500/20'
                  : 'bg-brand-black/30 border-brand-purple/50 hover:border-yellow-500/50 hover:bg-yellow-500/5'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-gray-500 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Disponíveis
                    </p>
                    <p className="text-3xl font-bold text-yellow-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {stats.available}
                    </p>
                    <p className="text-xs text-brand-gray-500 mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Pedidos pendentes
                    </p>
                  </div>
                  <Package className={`h-8 w-8 ${activeTab === 'available' ? 'text-yellow-500' : 'text-yellow-500/50'}`} />
                </div>
              </CardContent>
            </Card>

            {/* Card de Navegação - Em Andamento */}
            <Card
              onClick={() => setActiveTab('assigned')}
              className={`cursor-pointer transition-all duration-200 ${
                activeTab === 'assigned'
                  ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/70 shadow-lg shadow-blue-500/20'
                  : 'bg-brand-black/30 border-brand-purple/50 hover:border-blue-500/50 hover:bg-blue-500/5'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-gray-500 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Em Andamento
                    </p>
                    <p className="text-3xl font-bold text-blue-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {stats.assigned}
                    </p>
                    <p className="text-xs text-brand-gray-500 mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Pedidos ativos
                    </p>
                  </div>
                  <Loader2 className={`h-8 w-8 ${activeTab === 'assigned' ? 'text-blue-500' : 'text-blue-500/50'}`} />
                </div>
              </CardContent>
            </Card>

            {/* Card de Navegação - Concluídos */}
            <Card
              onClick={() => setActiveTab('completed')}
              className={`cursor-pointer transition-all duration-200 ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/70 shadow-lg shadow-green-500/20'
                  : 'bg-brand-black/30 border-brand-purple/50 hover:border-green-500/50 hover:bg-green-500/5'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-gray-500 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Concluídos
                    </p>
                    <p className="text-3xl font-bold text-green-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {stats.completed}
                    </p>
                    <p className="text-xs text-brand-gray-500 mt-1 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Pedidos finalizados
                    </p>
                  </div>
                  <CheckCircle2 className={`h-8 w-8 ${activeTab === 'completed' ? 'text-green-500' : 'text-green-500/50'}`} />
                </div>
              </CardContent>
            </Card>

            {/* Cards de Estatísticas - Ganhos */}
            <StatCard
              title="Ganhos Totais"
              value={formatPrice(stats.totalEarnings)}
              description="Total recebido"
              icon={DollarSign}
              valueColor="text-brand-purple-light"
            />
            <StatCard
              title="Ganhos Pendentes"
              value={formatPrice(stats.pendingEarnings)}
              description="Aguardando pagamento"
              icon={DollarSign}
              valueColor="text-yellow-300"
            />
          </div>
        ) : null}

        {/* Pedidos Disponíveis */}
        {activeTab === 'available' && (
          <div className="mt-6">
            {refreshing && <RefreshingBanner />}
            {loading && !refreshing ? (
              <OrdersListSkeleton count={3} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Nenhum pedido disponível"
                description="Não há pedidos pendentes no momento."
              />
            ) : (
              <div className="grid gap-6">
                {orders.map((order, index) => {
                  return (
                    <Card
                      key={order.id}
                      className="group relative bg-gradient-to-br from-brand-black/40 via-brand-black/30 to-brand-black/40 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light/80 hover:shadow-xl hover:shadow-brand-purple/20 transition-colors duration-200 overflow-hidden"
                    >
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/5 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
                      <CardHeader className="relative z-10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white font-orbitron mb-2 group-hover:text-brand-purple-light transition-colors duration-200" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {order.service.name}
                            </CardTitle>
                            <CardDescription className="text-brand-gray-500 font-rajdhani group-hover:text-gray-300 transition-colors duration-200" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {order.service.description}
                            </CardDescription>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {order.commission && (
                              <OrderInfoItem
                                label="Sua Comissão"
                                value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.commission.amount)} ({(order.commission.percentage * 100).toFixed(0)}%)</span>}
                              />
                            )}
                            {order.boosterCommission && !order.commission && (
                              <OrderInfoItem
                                label="Sua Comissão"
                                value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.boosterCommission)} ({(order.boosterPercentage ? order.boosterPercentage * 100 : 70).toFixed(0)}%)</span>}
                              />
                            )}
                            <OrderInfoItem label="Cliente" value={order.user.name || order.user.email} />
                            <OrderInfoItem label="Jogo" value={order.service.game} />
                          </div>

                          <ActionButton
                            onClick={() => handleAcceptOrderClick(order.id)}
                            icon={Check}
                            className="w-full"
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
                      </CardContent>
                    </Card>
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
              <OrdersListSkeleton count={3} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={Loader2}
                title="Nenhum pedido em andamento"
                description="Você não tem pedidos em progresso no momento."
              />
            ) : (
              <div className="grid gap-6">
                {orders.map((order, index) => {
                  return (
                    <Card
                      key={order.id}
                      className="group relative bg-gradient-to-br from-brand-black/40 via-brand-black/30 to-brand-black/40 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light/80 hover:shadow-xl hover:shadow-brand-purple/20 transition-colors duration-200 overflow-hidden"
                    >
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/5 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
                      <CardHeader className="relative z-10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white font-orbitron mb-2 group-hover:text-brand-purple-light transition-colors duration-200" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {order.service.name}
                            </CardTitle>
                            <CardDescription className="text-brand-gray-500 font-rajdhani group-hover:text-gray-300 transition-colors duration-200" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {order.service.description}
                            </CardDescription>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {order.commission && (
                              <OrderInfoItem
                                label="Sua Comissão"
                                value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.commission.amount)} ({(order.commission.percentage * 100).toFixed(0)}%)</span>}
                              />
                            )}
                            {order.boosterCommission && !order.commission && (
                              <OrderInfoItem
                                label="Sua Comissão"
                                value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.boosterCommission)} ({(order.boosterPercentage ? order.boosterPercentage * 100 : 70).toFixed(0)}%)</span>}
                              />
                            )}
                            <OrderInfoItem label="Cliente" value={order.user.name || order.user.email} />
                            <OrderInfoItem label="Data do Pedido" value={formatDate(order.createdAt)} />
                          </div>

                          <ActionButton
                            onClick={() => handleCompleteOrderClick(order.id)}
                            variant="success"
                            icon={CheckCircle2}
                            className="w-full"
                          >
                            Marcar como Concluído
                          </ActionButton>
                          <ConfirmDialog
                            open={completeDialogOpen && orderToAction === order.id}
                            onOpenChange={setCompleteDialogOpen}
                            title="Concluir Pedido"
                            description="Tem certeza que deseja marcar este pedido como concluído? Esta ação finaliza o serviço."
                            confirmLabel="Concluir"
                            cancelLabel="Cancelar"
                            onConfirm={handleCompleteOrder}
                            variant="success"
                            loading={isCompleting}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Pedidos Concluídos */}
        {activeTab === 'completed' && (
          <div className="mt-6">
            {refreshing && <RefreshingBanner />}
            {loading && !refreshing ? (
              <OrdersListSkeleton count={3} />
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
                    <Card
                      key={order.id}
                      className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {order.service.name}
                            </CardTitle>
                            <CardDescription className="text-brand-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {order.service.description}
                            </CardDescription>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {order.commission && (
                            <OrderInfoItem
                              label="Sua Comissão"
                              value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.commission.amount)} ({(order.commission.percentage * 100).toFixed(0)}%) {order.commission.status === 'PAID' ? '✓ Pago' : '⏳ Pendente'}</span>}
                            />
                          )}
                          {order.boosterCommission && !order.commission && (
                            <OrderInfoItem
                              label="Sua Comissão"
                              value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.boosterCommission)} ({(order.boosterPercentage ? order.boosterPercentage * 100 : 70).toFixed(0)}%)</span>}
                            />
                          )}
                          <OrderInfoItem label="Cliente" value={order.user.name || order.user.email} />
                          <OrderInfoItem label="Data de Conclusão" value={formatDate(order.createdAt)} />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

