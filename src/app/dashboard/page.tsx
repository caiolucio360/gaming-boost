'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Order } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight,
  Package,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { StatusBadge, OrderStatus } from '@/components/common/status-badge'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { DashboardCard } from '@/components/common/dashboard-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null)
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
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handlePayment = (orderId: string) => {
    router.push(`/payment?orderId=${orderId}`)
  }

  const handleCancelClick = (orderId: string) => {
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
        setAlert({
          title: 'Sucesso',
          description: 'Pedido cancelado com sucesso!',
          variant: 'default',
        })
        setCancelDialogOpen(false)
        setOrderToCancel(null)
        // Recarregar pedidos sem mostrar loading completo
        fetchOrders(true)
      } else {
        setAlert({
          title: 'Erro',
          description: data.message || 'Erro ao cancelar pedido',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao cancelar pedido. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setCancelDialogOpen(false)
      setOrderToCancel(null)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
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

        {refreshing && (
          <div className="mb-4 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-300 font-rajdhani text-center" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              <Loader2 className="h-4 w-4 inline-block mr-2 animate-spin" />
              Atualizando...
            </p>
          </div>
        )}

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

        {orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhuma solicitação encontrada"
            description="Você ainda não fez nenhuma solicitação de boost."
            actionLabel="Solicitar Boost"
            actionHref="/services"
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
                      <div>
                        <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          Valor Total
                        </p>
                        <p className="text-lg font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          Data da Solicitação
                        </p>
                        <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          Jogo
                        </p>
                        <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {order.service?.game || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.status === 'PENDING' && (
                        <>
                          <Button
                            onClick={() => handlePayment(order.id)}
                            className="w-full md:w-auto bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
                            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                          >
                            Realizar Pagamento
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleCancelClick(order.id)}
                            variant="outline"
                            className="w-full md:w-auto border-red-500/50 text-red-300 hover:bg-red-500/10 hover:text-red-200 font-rajdhani"
                            style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                          >
                            Cancelar Pedido
                            <X className="ml-2 h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </DashboardCard>
              )
            })}
          </div>
        )}

        {/* Dialog de confirmação de cancelamento */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent className="bg-black/95 border-purple-500/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Cancelar Pedido
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-purple-500/50 text-white hover:bg-purple-500/10 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Não, manter pedido
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelConfirm}
                className="bg-red-500 hover:bg-red-600 text-white font-rajdhani"
                style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
              >
                Sim, cancelar pedido
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

