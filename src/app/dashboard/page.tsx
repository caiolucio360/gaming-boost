'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Order } from '@/types'
import { apiGet } from '@/lib/api-client'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Package,
  X,
  Filter,
  ArrowUpDown,
  ImageIcon,
  ExternalLink,
} from 'lucide-react'
import { StatusBadge } from '@/components/common/status-badge'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { DashboardCard } from '@/components/common/dashboard-card'
import { OrderChat } from '@/components/order/order-chat'
import { SkeletonOrdersList } from '@/components/common/skeletons'
import { showSuccess, showError, handleApiError } from '@/lib/toast'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { ActionButton } from '@/components/common/action-button'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'

import { useRealtime } from '@/hooks/use-realtime'
import { RetentionProgress } from '@/components/common/retention-progress'

// Filtros de status do dashboard. Cores por status (active/inactive) mantidas
// em dados para renderizar via <Button> em vez de <button> cru duplicado.
const STATUS_FILTERS: { value: string; label: string; active: string; inactive: string }[] = [
  {
    value: '',
    label: 'Todos',
    active: 'bg-gradient-to-r from-brand-purple/20 to-brand-purple-dark/20 border-brand-purple-light text-brand-purple-light shadow-lg shadow-brand-purple/20',
    inactive: 'bg-brand-black/50 border-brand-purple/30 text-brand-gray-500 hover:border-brand-purple/50 hover:text-brand-purple-light hover:bg-brand-purple/10',
  },
  {
    value: 'PENDING',
    label: 'Pendentes',
    active: 'bg-yellow-500/20 border-yellow-400 text-yellow-300',
    inactive: 'bg-brand-black/50 border-yellow-500/30 text-brand-gray-500 hover:border-yellow-500/50 hover:text-yellow-300',
  },
  {
    value: 'PAID',
    label: 'Pagos',
    active: 'bg-cyan-500/20 border-cyan-400 text-cyan-300',
    inactive: 'bg-brand-black/50 border-cyan-500/30 text-brand-gray-500 hover:border-cyan-500/50 hover:text-cyan-300',
  },
  {
    value: 'IN_PROGRESS',
    label: 'Em Progresso',
    active: 'bg-blue-500/20 border-blue-400 text-blue-300',
    inactive: 'bg-brand-black/50 border-blue-500/30 text-brand-gray-500 hover:border-blue-500/50 hover:text-blue-300',
  },
  {
    value: 'COMPLETED',
    label: 'Concluídos',
    active: 'bg-green-500/20 border-green-400 text-green-300',
    inactive: 'bg-brand-black/50 border-green-500/30 text-brand-gray-500 hover:border-green-500/50 hover:text-green-300',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelados',
    active: 'bg-red-500/20 border-red-400 text-red-300',
    inactive: 'bg-brand-black/50 border-red-500/30 text-brand-gray-500 hover:border-red-500/50 hover:text-red-300',
  },
]

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [currentDiscountPct, setCurrentDiscountPct] = useState<number>(0)

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

  const fetchOrders = useCallback(async (isRefresh = false) => {
    await withLoading(async () => {
      const data = await apiGet<{ orders: Order[] }>('/api/orders')
      setOrders(data.orders || [])
    }, isRefresh)
  }, [withLoading])

  useEffect(() => {
    if (user && user.role === 'CLIENT') {
      fetchOrders()
      apiGet<{ user: { currentDiscountPct?: number | null } }>('/api/auth/me')
        .then((data) => setCurrentDiscountPct(data.user?.currentDiscountPct ?? 0))
        .catch(() => {})
    }
  }, [user, fetchOrders])

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

  // Filtrar e ordenar pedidos
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]

    // Filtro por status
    if (filterStatus) {
      filtered = filtered.filter(order => order.status === filterStatus)
    }

    // Filtro por jogo
    // Ordenação: primeiro por status (na ordem dos filtros), depois por data
    const statusOrder: Record<string, number> = {
      'PENDING': 1,
      'PAID': 2,
      'IN_PROGRESS': 3,
      'COMPLETED': 4,
      'CANCELLED': 5,
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
  }, [orders, filterStatus, sortOrder])

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
      const response = await fetch(`/api/orders/${orderToCancel}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'Cancelado pelo cliente via dashboard',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess(data.message || 'Pedido cancelado com sucesso!')
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


  const completedOrders = (orders ?? [])
    .filter((o) => o.status === 'COMPLETED' && o.targetRating != null)
    .map((o) => ({
      id: o.id,
      targetRating: o.targetRating as number,
      targetRank: o.targetRank ?? null,
      gameMode: o.gameMode ?? '',
      completedAt: o.updatedAt ?? o.createdAt,
    }))

  // Loading de tela inteira apenas para autenticação
  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          highlight="MEU"
          title="DASHBOARD"
          description={`Olá, ${user.name || user.email}! Aqui estão suas solicitações de boost.`}
        />

        {/* Filtros */}
        <Card className="group relative bg-gradient-to-br from-brand-black/40 via-brand-black/30 to-brand-black/40 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light/80 hover:shadow-xl hover:shadow-brand-purple/20 transition-colors duration-200 mb-6 overflow-hidden">
          {/* Efeito de brilho sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/5 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
          <CardContent className="pt-4 pb-4 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {/* Filtros de Status - Badges Compactos */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap">
                <Filter className="h-4 w-4 text-brand-purple-light mr-1 flex-shrink-0" />
                {STATUS_FILTERS.map((f) => (
                  <Button
                    key={f.value || 'all'}
                    type="button"
                    variant="outline"
                    onClick={() => setFilterStatus(f.value)}
                    className={`flex-shrink-0 h-auto min-h-0 px-3 py-1.5 font-rajdhani text-xs font-medium ${
                      filterStatus === f.value ? f.active : f.inactive
                    }`}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>

              {/* Botão de Ordenação */}
              <div className="flex flex-1 gap-2 md:ml-auto md:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="w-32 h-auto min-h-0 px-3 py-1.5 font-rajdhani text-xs font-medium bg-brand-black/50 border-brand-purple/30 text-brand-gray-500 hover:border-brand-purple/50 hover:text-brand-purple-light hover:bg-brand-purple/10"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  {sortOrder === 'newest' ? 'Mais recentes' : 'Mais antigos'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currently only PREMIER mode is shown. GC support can be added by rendering a second widget with gameMode="GC" */}
        {completedOrders.length > 0 && (
          <div className="mb-6">
            <RetentionProgress
              completedOrders={completedOrders}
              currentDiscountPct={currentDiscountPct}
              gameMode="PREMIER"
            />
            <div className="mt-3 flex justify-end">
              <Link href="/dashboard/retencao">
                <Button variant="ghost" size="sm" className="text-brand-purple-light hover:text-brand-purple-light text-sm">
                  Ver programa de fidelidade →
                </Button>
              </Link>
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonOrdersList count={3} />
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
            {filteredOrders.map((order) => {
              return (
                <DashboardCard
                  key={order.id}
                  title={order.serviceName || 'Serviço'}
                  description={`${order.serviceType === 'DUO_BOOST' ? 'Duo Boost' : 'Boost'} CS2 - ${order.gameMode || 'Premier'}`}
                  status={order.status as 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'}
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
                        value={<span className="text-lg font-bold text-brand-purple-light font-orbitron">{formatPrice(order.total)}</span>}
                      />
                      <OrderInfoItem label="Data da Solicitação" value={formatDate(order.createdAt)} />
                      <OrderInfoItem label="Jogo" value={order.game || 'CS2'} />
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

                      {order.status === 'PAID' && (
                        <ActionButton
                          onClick={() => handleCancelClick(order.id)}
                          variant="danger"
                          icon={X}
                          iconPosition="right"
                          className="w-full md:w-auto"
                        >
                          Cancelar e Solicitar Reembolso
                        </ActionButton>
                      )}

                      {order.status === 'COMPLETED' && order.completionProofUrl && (
                        <div className="w-full space-y-2 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                          <p className="text-xs text-green-400 font-rajdhani font-semibold flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5" />
                            Comprovante do booster
                          </p>
                          {/* Comprovante enviado pelo usuário (dimensões arbitrárias) — migração p/ next/image exige QA visual */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={order.completionProofUrl}
                            alt="Comprovante de conclusão"
                            className="w-full max-w-xs rounded-md border border-green-500/20 object-cover"
                          />
                          <a
                            href={order.completionProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-purple-light hover:text-brand-purple-lighter font-rajdhani"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver em tamanho original
                          </a>
                        </div>
                      )}

                    </div>

                    {(order.status === 'PAID' && order.boosterId) && (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <div className="mb-3 p-3 bg-brand-purple/10 border border-brand-purple/30 rounded-lg">
                          <p className="text-brand-purple-light text-sm font-rajdhani">
                            Seu booster está pronto! Envie suas credenciais Steam pelo chat para iniciar o boost.
                          </p>
                        </div>
                        <OrderChat orderId={order.id} />
                      </div>
                    )}
                    {order.status === 'IN_PROGRESS' && (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <OrderChat orderId={order.id} />
                      </div>
                    )}
                  </div>
                </DashboardCard>
              )
            })}
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-brand-gray-500 font-rajdhani">
              Mostrando {filteredOrders.length} de {orders.length} pedido{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        <ConfirmDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          title="Cancelar Pedido"
          description={
            orderToCancel && orders.find(o => o.id === orderToCancel)?.status === 'PAID'
              ? 'Tem certeza que deseja cancelar este pedido? O pagamento será reembolsado e o valor retornará para sua conta em até 5 dias úteis.'
              : 'Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.'
          }
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

