'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Order } from '@/types'
import { apiGet } from '@/lib/api-client'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  Package,
  X,
  AlertCircle,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { StatusBadge, OrderStatus } from '@/components/common/status-badge'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { DashboardCard } from '@/components/common/dashboard-card'
import { OrdersListSkeleton } from '@/components/common/loading-skeletons'
import { showSuccess, showError, handleApiError } from '@/lib/toast'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ActionButton } from '@/components/common/action-button'
import { RefreshingBanner } from '@/components/common/refreshing-banner'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GameId } from '@/lib/games-config'
import { useRealtime } from '@/hooks/use-realtime'
import { ReviewModal } from '@/components/reviews/review-modal'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const { loading, refreshing, withLoading } = useLoading({ initialLoading: true })
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [alert, setAlert] = useState<{ 
    title: string
    description: string
    variant: 'default' | 'destructive'
  } | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterGame, setFilterGame] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    if (!authLoading && !user) {
      // Usar replace para redirecionamento de autenticação
      router.replace('/login')
    } else if (user) {
      // Redirecionar baseado no role usando replace
      if (user.role === 'ADMIN') {
        router.replace('/admin')
      } else if (user.role === 'BOOSTER') {
        router.replace('/booster')
      }
      // Se for CLIENT, permanece na página
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'CLIENT') {
      fetchOrders()
    }
  }, [user?.id]) // Usar apenas user.id para evitar re-renders desnecessários

  // Função para atualizar apenas os dados sem mostrar banner de refreshing
  const updateOrdersSilently = async () => {
    try {
      const data = await apiGet<{ orders: Order[] }>('/api/orders')
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Erro ao atualizar pedidos silenciosamente:', error)
    }
  }

  // Atualizações em tempo real via SSE - atualização silenciosa
  useRealtime({
    enabled: user?.role === 'CLIENT',
    onOrderUpdate: (data) => {
      // Quando há atualização de pedidos, atualizar silenciosamente
      if (data.pending !== undefined || data.inProgress !== undefined) {
        updateOrdersSilently()
      }
    },
  })

  const fetchOrders = async (isRefresh = false) => {
    await withLoading(async () => {
      const data = await apiGet<{ orders: Order[] }>('/api/orders')
      setOrders(data.orders || [])
    }, isRefresh)
  }

  // Filtrar e ordenar pedidos
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]

    // Filtro por status
    if (filterStatus) {
      filtered = filtered.filter(order => order.status === filterStatus)
    }

    // Filtro por jogo
    if (filterGame) {
      filtered = filtered.filter(order => order.service?.game === filterGame)
    }

    // Ordenação: primeiro por status (na ordem dos filtros), depois por data
    const statusOrder: Record<string, number> = {
      'PENDING': 1,
      'IN_PROGRESS': 2,
      'COMPLETED': 3,
      'CANCELLED': 4,
    }

    filtered.sort((a, b) => {
      // Se não há filtro de status, ordenar por status primeiro
      if (!filterStatus) {
        const statusA = statusOrder[a.status] || 999
        const statusB = statusOrder[b.status] || 999
        
        if (statusA !== statusB) {
          return statusA - statusB
        }
      }
      
      // Depois ordenar por data dentro do mesmo status
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [orders, filterStatus, filterGame, sortOrder])

  // Obter jogos únicos dos pedidos
  const availableGames = useMemo(() => {
    const games = new Set<GameId>()
    orders.forEach(order => {
      if (order.service?.game) {
        games.add(order.service.game as GameId)
      }
    })
    return Array.from(games)
  }, [orders])

  const handlePayment = (orderId: number, total: number) => {
    router.replace(`/payment?orderId=${orderId}&total=${total}`)
  }

  const handleCancelClick = (orderId: number) => {
    setOrderToCancel(orderId)
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/orders/${orderToCancel}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess('Pedido cancelado com sucesso!')
        setCancelDialogOpen(false)
        setOrderToCancel(null)
        // Recarregar pedidos sem mostrar loading completo
        fetchOrders(true)
      } else {
        showError('Erro ao cancelar pedido', data.message || 'Não foi possível cancelar o pedido')
      }
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      handleApiError(error, 'Erro ao cancelar pedido')
    } finally {
      setIsCancelling(false)
      setCancelDialogOpen(false)
      setOrderToCancel(null)
    }
  }


  // Loading de tela inteira apenas para autenticação
  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          highlight="MEU"
          title="DASHBOARD"
          description={`Olá, ${user.name || user.email}! Aqui estão suas solicitações de boost.`}
        />

        {/* Removido RefreshingBanner para evitar piscar - atualizações são silenciosas */}
        {alert && (
          <Alert 
            variant={alert.variant} 
            className="mb-6"
          >
            {alert.variant === 'destructive' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 mb-6 overflow-hidden">
          {/* Efeito de brilho sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
          <CardContent className="pt-4 pb-4 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {/* Filtros de Status - Badges Compactos */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-purple-300 mr-1" />
                <button
                  onClick={() => setFilterStatus('')}
                  className={`px-3 py-1.5 rounded-md font-rajdhani text-xs font-medium transition-colors duration-200 ${
                    !filterStatus
                      ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-400 text-purple-300 shadow-lg shadow-purple-500/20'
                      : 'bg-black/50 border border-purple-500/30 text-gray-400 hover:border-purple-500/50 hover:text-purple-300 hover:bg-purple-500/10'
                  }`}
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterStatus('PENDING')}
                  className={`px-3 py-1.5 rounded-md font-rajdhani text-xs font-medium transition-colors duration-200 ${
                    filterStatus === 'PENDING'
                      ? 'bg-yellow-500/20 border border-yellow-400 text-yellow-300'
                      : 'bg-black/50 border border-yellow-500/30 text-gray-400 hover:border-yellow-500/50 hover:text-yellow-300'
                  }`}
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setFilterStatus('IN_PROGRESS')}
                  className={`px-3 py-1.5 rounded-md font-rajdhani text-xs font-medium transition-colors duration-200 ${
                    filterStatus === 'IN_PROGRESS'
                      ? 'bg-blue-500/20 border border-blue-400 text-blue-300'
                      : 'bg-black/50 border border-blue-500/30 text-gray-400 hover:border-blue-500/50 hover:text-blue-300'
                  }`}
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Em Progresso
                </button>
                <button
                  onClick={() => setFilterStatus('COMPLETED')}
                  className={`px-3 py-1.5 rounded-md font-rajdhani text-xs font-medium transition-colors duration-200 ${
                    filterStatus === 'COMPLETED'
                      ? 'bg-green-500/20 border border-green-400 text-green-300'
                      : 'bg-black/50 border border-green-500/30 text-gray-400 hover:border-green-500/50 hover:text-green-300'
                  }`}
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Concluídos
                </button>
                <button
                  onClick={() => setFilterStatus('CANCELLED')}
                  className={`px-3 py-1.5 rounded-md font-rajdhani text-xs font-medium transition-colors duration-200 ${
                    filterStatus === 'CANCELLED'
                      ? 'bg-red-500/20 border border-red-400 text-red-300'
                      : 'bg-black/50 border border-red-500/30 text-gray-400 hover:border-red-500/50 hover:text-red-300'
                  }`}
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Cancelados
                </button>
              </div>

              {/* Filtros Adicionais - Compactos */}
              <div className="flex flex-1 gap-2 md:ml-auto md:justify-end">
                {availableGames.length > 0 && (
                  <Select value={filterGame || undefined} onValueChange={(value) => setFilterGame(value === 'all' ? '' : value)}>
                    <SelectTrigger className="w-full md:w-[160px] h-9 bg-black/50 border-purple-500/50 text-white font-rajdhani text-xs hover:border-purple-400 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      <SelectValue placeholder="Jogo" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-purple-500/50">
                      <SelectItem value="all">Todos os jogos</SelectItem>
                      {availableGames.map((game) => (
                        <SelectItem key={game} value={game}>
                          {game === 'CS2' ? 'Counter-Strike 2' : game === 'LOL' ? 'League of Legends' : game === 'VALORANT' ? 'Valorant' : game}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest')}>
                  <SelectTrigger className="w-full md:w-[140px] h-9 bg-black/50 border-purple-500/50 text-white font-rajdhani text-xs hover:border-purple-400 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-purple-500/50">
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="oldest">Mais antigos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <OrdersListSkeleton count={3} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhuma solicitação encontrada"
            description="Você ainda não fez nenhuma solicitação de boost."
            actionLabel="Solicitar Boost"
            actionHref="/games/cs2"
          />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum pedido encontrado"
            description="Tente ajustar os filtros para encontrar seus pedidos."
          />
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((order, index) => {
              return (
                <DashboardCard
                  key={order.id}
                  title={order.service?.name || 'Serviço'}
                  description={order.service?.description || 'Descrição não disponível'}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <StatusBadge status={order.status} className="mb-4" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                      <OrderInfoItem
                        label="Valor Total"
                        value={<span className="text-lg font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.total)}</span>}
                      />
                      <OrderInfoItem label="Data da Solicitação" value={formatDate(order.createdAt)} />
                      <OrderInfoItem label="Jogo" value={order.service?.game || 'N/A'} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.status === 'PENDING' && (
                        <>
                          <ActionButton
                            onClick={() => handlePayment(order.id, order.total)}
                            icon={ArrowRight}
                            iconPosition="right"
                            className="w-full md:w-auto"
                          >
                            Realizar Pagamento
                          </ActionButton>
                          <ActionButton
                            onClick={() => handleCancelClick(order.id)}
                            variant="danger"
                            icon={X}
                            iconPosition="right"
                            className="w-full md:w-auto"
                          >
                            Cancelar Pedido
                          </ActionButton>
                        </>
                      )}

                      {order.status === 'COMPLETED' && !order.review && (
                        <ReviewModal
                          orderId={order.id}
                          onSuccess={() => fetchOrders(true)}
                          trigger={
                            <Button className="w-full md:w-auto bg-yellow-500 text-black font-bold border border-transparent hover:border-black/50">
                              Avaliar Booster
                            </Button>
                          }
                        />
                      )}

                      {order.status === 'COMPLETED' && order.review && (
                        <div className="flex items-center text-yellow-400 bg-yellow-400/10 px-3 py-2 rounded-md border border-yellow-400/30">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          <span className="text-sm font-bold">Avaliado ({order.review.rating}★)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </DashboardCard>
              )
            })}
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Mostrando {filteredOrders.length} de {orders.length} pedido{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        <ConfirmDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          title="Cancelar Pedido"
          description="Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita."
          confirmLabel="Sim, cancelar pedido"
          cancelLabel="Não, manter pedido"
          onConfirm={handleCancelConfirm}
          variant="destructive"
          loading={isCancelling}
        />
      </div>
    </div>
  )
}

