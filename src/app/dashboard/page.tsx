'use client'

import { useEffect, useState } from 'react'
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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const { loading, refreshing, withLoading } = useLoading({ initialLoading: true })
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null)
  const [alert, setAlert] = useState<{ 
    title: string
    description: string
    variant: 'default' | 'destructive'
  } | null>(null)

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

  const fetchOrders = async (isRefresh = false) => {
    await withLoading(async () => {
      const data = await apiGet<{ orders: Order[] }>('/api/orders')
      setOrders(data.orders || [])
    }, isRefresh)
  }

  const handlePayment = (orderId: number) => {
    router.push(`/payment?orderId=${orderId}`)
  }

  const handleCancelClick = (orderId: number) => {
    setOrderToCancel(orderId)
    setCancelDialogOpen(true)
  }

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return

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
      setCancelDialogOpen(false)
      setOrderToCancel(null)
    }
  }


  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          highlight="MEU"
          title="DASHBOARD"
          description={`Olá, ${user.name || user.email}! Aqui estão suas solicitações de boost.`}
        />

        {refreshing && <RefreshingBanner />}

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
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            onClick={() => handlePayment(order.id)}
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
                    </div>
                  </div>
                </DashboardCard>
              )
            })}
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
        />
      </div>
    </div>
  )
}

