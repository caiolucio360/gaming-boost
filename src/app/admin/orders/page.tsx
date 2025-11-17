'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
} from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/common/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge, OrderStatus } from '@/components/common/status-badge'
import { EmptyState } from '@/components/common/empty-state'
import { OrdersListSkeleton } from '@/components/common/loading-skeletons'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'

interface Order {
  id: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  total: number
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
  }
  booster?: {
    id: number
    email: string
    name?: string
  }
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [alert, setAlert] = useState<{ title: string; description: string; variant?: 'default' | 'destructive' } | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      // Usar replace para redirecionamento de autenticação
      router.replace('/')
    } else if (user && user.role === 'ADMIN') {
      fetchOrders()
    }
  }, [user, authLoading, router, filterStatus])

  const fetchOrders = async () => {
    await withLoading(async () => {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)

      const response = await fetch(`/api/admin/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    })
  }

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setAlert({
          title: 'Sucesso',
          description: 'Status atualizado com sucesso!',
          variant: 'default',
        })
        fetchOrders()
        setTimeout(() => setAlert(null), 5000)
      } else {
        const data = await response.json()
        setAlert({
          title: 'Erro',
          description: data.message || 'Erro ao atualizar status',
          variant: 'destructive',
        })
        setTimeout(() => setAlert(null), 5000)
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      setAlert({
        title: 'Erro',
        description: 'Erro ao atualizar status',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    }
  }


  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {alert && (
          <Alert variant={alert.variant} className="mb-4">
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-purple-300 hover:text-purple-200 font-rajdhani mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
          <PageHeader
            highlight="GERENCIAR"
            title="PEDIDOS"
            description="Visualize e gerencie todos os pedidos da plataforma"
          />
        </div>

        {/* Filtro */}
        <Card className="bg-black/30 backdrop-blur-md border-purple-500/50 mb-6">
          <CardContent className="pt-6">
            <Select value={filterStatus || undefined} onValueChange={(value) => setFilterStatus(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-full md:w-[200px] bg-black/50 border-purple-500/50 text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent className="bg-black border-purple-500/50">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                <SelectItem value="COMPLETED">Concluídos</SelectItem>
                <SelectItem value="CANCELLED">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        {loading ? (
          <OrdersListSkeleton count={5} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Nenhum pedido encontrado"
            description="Tente ajustar o filtro de status"
          />
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
              return (
                <Card
                  key={order.id}
                  className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {order.service.name}
                        </CardTitle>
                        <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {order.user.name || order.user.email} • {order.service.game}
                        </CardDescription>
                      </div>
                      <StatusBadge status={order.status as OrderStatus} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <OrderInfoItem
                          label="Valor Total"
                          value={<span className="text-lg font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.total)}</span>}
                        />
                        <OrderInfoItem label="Data da Solicitação" value={formatDate(order.createdAt)} />
                        <OrderInfoItem label="Tipo de Serviço" value={order.service.type} />
                        {order.booster && (
                          <OrderInfoItem
                            label="Booster Atribuído"
                            value={order.booster.name || order.booster.email}
                            valueClassName="text-purple-300"
                          />
                        )}
                      </div>

                      {/* Atualizar Status */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-purple-500/20">
                        <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                          <SelectTrigger className="w-full md:w-[200px] bg-black/50 border-purple-500/50 text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-purple-500/50">
                            <SelectItem value="PENDING">Pendente</SelectItem>
                            <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                            <SelectItem value="COMPLETED">Concluído</SelectItem>
                            <SelectItem value="CANCELLED">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 font-rajdhani"
                          style={{ fontFamily: 'Rajdhani, sans-serif' }}
                        >
                          <Link href={`/admin/orders/${order.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Detalhes
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Total: {orders.length} pedido{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

