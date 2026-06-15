'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { api } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ShoppingCart,
  Edit,
} from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { AdminPageShell } from '@/components/common/admin-page-shell'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OrderStatus } from '@/components/common/status-badge'
import { OrderCardShell } from '@/components/common/order-card-shell'
import { PaymentStatusBadge } from '@/components/common/payment-status-badge'
import { EmptyState } from '@/components/common/empty-state'
import { SkeletonOrdersList } from '@/components/common/skeletons'
import { LoadingSwap } from '@/components/common/loading-swap'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { PaginationControls } from '@/components/common/pagination-controls'
import { formatPrice, formatDate } from '@/lib/utils'

const PAGE_SIZE = 20

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
  payments?: {
    id: number
    status: string
  }[]
}

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchOrders = useCallback(async () => {
    await withLoading(async () => {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      params.append('limit', String(PAGE_SIZE))
      params.append('offset', String((page - 1) * PAGE_SIZE))

      try {
        const data = await api.get<{ orders: Order[]; total: number }>(`/api/admin/orders?${params.toString()}`)
        setOrders(data.orders || [])
        setTotal(data.total ?? 0)
      } catch {
        // silencioso — mantém o comportamento anterior (lista vazia em erro)
      }
    })
  }, [withLoading, filterStatus, page])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.replace(!user ? '/login' : user.role === 'BOOSTER' ? '/booster' : '/dashboard')
    } else if (user && user.role === 'ADMIN') {
      fetchOrders()
    }
  }, [user, authLoading, router, fetchOrders])

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <AdminPageShell
      highlight="GERENCIAR"
      title="PEDIDOS"
      description="Visualize e gerencie todos os pedidos da plataforma"
    >
        {/* Filtro */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Select value={filterStatus || undefined} onValueChange={(value) => { setFilterStatus(value === 'all' ? '' : value); setPage(1) }}>
              <SelectTrigger className="w-full md:w-52 bg-background/50 border-brand-purple/50 text-foreground font-rajdhani">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent className="bg-background border-brand-purple/50">
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
        <LoadingSwap loading={loading} skeleton={<SkeletonOrdersList count={5} />}>
          {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Nenhum pedido encontrado"
            description="Tente ajustar o filtro de status"
          />
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
              return (
                <OrderCardShell
                  key={order.id}
                  title={order.service.name}
                  description={`${order.user.name || order.user.email} • ${order.service.game}`}
                  status={order.status as OrderStatus}
                  glow={false}
                >
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                        <OrderInfoItem
                          label="Valor Total"
                          value={<span className="text-lg font-bold text-brand-purple-light font-orbitron">{formatPrice(order.total)}</span>}
                        />
                        <OrderInfoItem label="Data da Solicitação" value={formatDate(order.createdAt)} />
                        <OrderInfoItem label="Tipo de Serviço" value={order.service.type} />
                        {order.booster && (
                          <OrderInfoItem
                            label="Booster Atribuído"
                            value={order.booster.name || order.booster.email}
                            valueClassName="text-brand-purple-light"
                          />
                        )}
                      </div>

                      {/* Informações de Pagamento */}
                      {order.payments && order.payments.length > 0 && (
                        <div className="pt-2 border-t border-brand-purple/20">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Status do Pagamento:</span>
                            <PaymentStatusBadge status={order.payments.some(p => p.status === 'PAID') ? 'PAID' : 'PENDING'} />
                          </div>
                        </div>
                      )}

                      {/* Ações — alteração de status acontece na tela de detalhes */}
                      <div className="flex flex-wrap gap-2 pt-4 border-t border-brand-purple/20">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-brand-purple/50 text-brand-purple-light hover:bg-brand-purple/10 font-rajdhani"
                        >
                          <Link href={`/admin/orders/${order.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Detalhes
                          </Link>
                        </Button>
                      </div>
                    </div>
                </OrderCardShell>
              )
            })}
          </div>
          )}
        </LoadingSwap>

        <PaginationControls
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          itemLabel="pedido"
        />
    </AdminPageShell>
  )
}

