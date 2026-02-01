'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  User,
  UserCheck,
  CreditCard,
  Calendar,
  GamepadIcon,
  TrendingUp,
  DollarSign,
} from 'lucide-react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { PageHeader } from '@/components/common/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge, OrderStatus } from '@/components/common/status-badge'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'

interface Order {
  id: number
  status: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  total: number
  createdAt: string
  updatedAt: string
  game: string
  gameMode: string | null
  gameType: string | null
  currentRank: string | null
  targetRank: string | null
  currentRating: number | null
  targetRating: number | null
  steamProfileUrl: string | null
  user: {
    id: number
    email: string
    name: string | null
  }
  booster: {
    id: number
    email: string
    name: string | null
  } | null
  service: {
    id: number
    name: string
    game: string
    type: string
  }
  payments: {
    id: number
    status: string
    total: number
    createdAt: string
  }[]
  commission: {
    id: number
    amount: number
    percentage: number
    status: string
  } | null
  revenues: {
    id: number
    amount: number
    percentage: number
    status: string
    admin: {
      id: number
      name: string | null
    }
  }[]
}

export default function AdminOrderDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [alert, setAlert] = useState<{ title: string; description: string; variant?: 'default' | 'destructive' } | null>(null)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.replace('/')
    } else if (user && user.role === 'ADMIN' && orderId) {
      fetchOrder()
    }
  }, [user, authLoading, router, orderId])

  const fetchOrder = async () => {
    await withLoading(async () => {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        setAlert({
          title: 'Erro',
          description: 'Pedido não encontrado',
          variant: 'destructive',
        })
      }
    })
  }

  const handleStatusUpdate = async (newStatus: string) => {
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
        fetchOrder()
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/50">Pago</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Pendente</Badge>
      case 'REFUNDED':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/50">Reembolsado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/50">Liberado</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Pendente</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/50">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>Pedido não encontrado</AlertDescription>
          </Alert>
          <Link href="/admin/orders" className="inline-flex items-center text-brand-purple-light hover:text-brand-purple-light font-rajdhani mt-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Pedidos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-4xl mx-auto">
        {alert && (
          <Alert variant={alert.variant} className="mb-4">
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}

        <div className="mb-8">
          <Link href="/admin/orders" className="inline-flex items-center text-brand-purple-light hover:text-brand-purple-light font-rajdhani mb-4" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Pedidos
          </Link>
          <PageHeader
            highlight="DETALHES DO"
            title={`PEDIDO #${order.id}`}
            description={order.service.name}
          />
        </div>

        {/* Status e Ações */}
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Status do Pedido
              </CardTitle>
              <StatusBadge status={order.status as OrderStatus} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-brand-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Alterar status:
              </span>
              <Select value={order.status} onValueChange={handleStatusUpdate}>
                <SelectTrigger className="w-[200px] bg-brand-black/50 border-brand-purple/50 text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-brand-black border-brand-purple/50">
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Pedido */}
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <GamepadIcon className="h-5 w-5 text-brand-purple" />
              Informações do Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <OrderInfoItem label="Jogo" value={order.game} />
              <OrderInfoItem label="Modo" value={order.gameMode || '-'} />
              <OrderInfoItem label="Tipo" value={order.service.type} />
              {order.currentRank && (
                <OrderInfoItem label="Rank Atual" value={order.currentRank} />
              )}
              {order.targetRank && (
                <OrderInfoItem label="Rank Desejado" value={order.targetRank} valueClassName="text-brand-purple-light" />
              )}
              {order.currentRating !== null && (
                <OrderInfoItem label="Rating Atual" value={order.currentRating.toLocaleString()} />
              )}
              {order.targetRating !== null && (
                <OrderInfoItem label="Rating Desejado" value={order.targetRating.toLocaleString()} valueClassName="text-brand-purple-light" />
              )}
              <OrderInfoItem
                label="Valor Total"
                value={<span className="text-lg font-bold text-brand-purple-light font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(order.total)}</span>}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cliente */}
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <User className="h-5 w-5 text-brand-purple" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OrderInfoItem label="Nome" value={order.user.name || '-'} />
              <OrderInfoItem label="Email" value={order.user.email} />
              {order.steamProfileUrl && (
                <OrderInfoItem
                  label="Steam"
                  value={
                    <a
                      href={order.steamProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-purple-light hover:underline"
                    >
                      Ver Perfil
                    </a>
                  }
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booster */}
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <UserCheck className="h-5 w-5 text-brand-purple" />
              Booster
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.booster ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <OrderInfoItem label="Nome" value={order.booster.name || '-'} />
                <OrderInfoItem label="Email" value={order.booster.email} />
              </div>
            ) : (
              <p className="text-brand-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Nenhum booster atribuído
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pagamentos */}
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <CreditCard className="h-5 w-5 text-brand-purple" />
              Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.payments.length > 0 ? (
              <div className="space-y-4">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-brand-black/50 rounded-lg border border-brand-purple/30">
                    <div>
                      <p className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        Pagamento #{payment.id}
                      </p>
                      <p className="text-brand-gray-500 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-brand-purple-light font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {formatPrice(payment.total)}
                      </span>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brand-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Nenhum pagamento registrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comissões e Receitas */}
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 mb-6">
          <CardHeader>
            <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <DollarSign className="h-5 w-5 text-brand-purple" />
              Comissões e Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Comissão do Booster */}
              {order.commission && (
                <div className="p-4 bg-brand-black/50 rounded-lg border border-brand-purple/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        Comissão do Booster
                      </p>
                      <p className="text-brand-gray-500 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        {(order.commission.percentage * 100).toFixed(0)}% do valor total
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {formatPrice(order.commission.amount)}
                      </span>
                      {getCommissionStatusBadge(order.commission.status)}
                    </div>
                  </div>
                </div>
              )}

              {/* Receitas Admin */}
              {order.revenues.map((revenue) => (
                <div key={revenue.id} className="p-4 bg-brand-black/50 rounded-lg border border-brand-purple/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        Receita Admin {revenue.admin.name ? `(${revenue.admin.name})` : ''}
                      </p>
                      <p className="text-brand-gray-500 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        {(revenue.percentage * 100).toFixed(0)}% do valor total
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {formatPrice(revenue.amount)}
                      </span>
                      {getCommissionStatusBadge(revenue.status)}
                    </div>
                  </div>
                </div>
              ))}

              {!order.commission && order.revenues.length === 0 && (
                <p className="text-brand-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Nenhuma comissão ou receita registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
          <CardHeader>
            <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <Calendar className="h-5 w-5 text-brand-purple" />
              Datas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OrderInfoItem label="Criado em" value={formatDate(order.createdAt)} />
              <OrderInfoItem label="Atualizado em" value={formatDate(order.updatedAt)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
