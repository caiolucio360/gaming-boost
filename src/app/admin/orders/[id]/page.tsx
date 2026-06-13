'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  User,
  UserCheck,
  CreditCard,
  Calendar,
  GamepadIcon,
  DollarSign,
  ImageIcon,
  ExternalLink,
} from 'lucide-react'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AdminPageShell } from '@/components/common/admin-page-shell'
import { OrderDetailSkeleton } from '@/app/admin/orders/[id]/_components/order-detail-skeleton'
import { BackButton } from '@/components/common/back-button'
import { api, ApiError } from '@/lib/api-client'
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
  completionProofUrl: string | null
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

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

// Valid status transitions — mirrors VALID_TRANSITIONS in the admin orders API
// (src/app/api/admin/orders/[id]/route.ts). The admin can only move an order
// to one of the statuses reachable from its current status.
const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
}

export default function AdminOrderDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [boosters, setBoosters] = useState<{ id: number; name: string | null; email: string }[]>([])
  const [assigning, setAssigning] = useState(false)
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [alert, setAlert] = useState<{ title: string; description: string; variant?: 'default' | 'destructive' } | null>(null)

  const fetchBoosters = useCallback(async () => {
    try {
      const data = await api.get<{ users?: { id: number; name: string | null; email: string }[] }>('/api/admin/users?role=BOOSTER&limit=100')
      const list = (data.users ?? []).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      }))
      setBoosters(list)
    } catch (error) {
      console.error('Erro ao buscar boosters:', error)
    }
  }, [])

  const fetchOrder = useCallback(async () => {
    await withLoading(async () => {
      try {
        const data = await api.get<{ order: typeof order }>(`/api/admin/orders/${orderId}`)
        setOrder(data.order)
      } catch {
        setAlert({
          title: 'Erro',
          description: 'Pedido não encontrado',
          variant: 'destructive',
        })
      }
    })
  }, [withLoading, orderId])

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.replace(!user ? '/login' : user.role === 'BOOSTER' ? '/booster' : '/dashboard')
    } else if (user && user.role === 'ADMIN' && orderId) {
      fetchOrder()
      fetchBoosters()
    }
  }, [user, authLoading, router, orderId, fetchOrder, fetchBoosters])

  const handleStatusUpdate = async (newStatus: string) => {
    // Re-selecting the current status is a no-op (avoids an invalid-transition 400)
    if (order && newStatus === order.status) return
    try {
      await api.put(`/api/admin/orders/${orderId}`, { status: newStatus })
      setAlert({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso!',
        variant: 'default',
      })
      fetchOrder()
      setTimeout(() => setAlert(null), 5000)
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      setAlert({
        title: 'Erro',
        description: error instanceof ApiError ? error.message : 'Erro ao atualizar status',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    }
  }

  const handleAssignBooster = async (value: string) => {
    // 'none' clears the assignment; otherwise parse the booster id
    const boosterId = value === 'none' ? null : parseInt(value, 10)
    setAssigning(true)
    try {
      await api.put(`/api/admin/orders/${orderId}`, { boosterId })
      setAlert({
        title: 'Sucesso',
        description: boosterId === null ? 'Booster removido do pedido.' : 'Booster atribuído com sucesso!',
        variant: 'default',
      })
      fetchOrder()
      setTimeout(() => setAlert(null), 5000)
    } catch (error) {
      console.error('Erro ao atribuir booster:', error)
      setAlert({
        title: 'Erro',
        description: error instanceof ApiError ? error.message : 'Erro ao atribuir booster',
        variant: 'destructive',
      })
      setTimeout(() => setAlert(null), 5000)
    } finally {
      setAssigning(false)
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500/20 text-foreground dark:text-green-300 border-green-500/50">Pago</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-500/20 text-foreground dark:text-yellow-300 border-yellow-500/50">Pendente</Badge>
      case 'REFUNDED':
        return <Badge className="bg-red-500/20 text-foreground dark:text-red-300 border-red-500/50">Reembolsado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500/20 text-foreground dark:text-green-300 border-green-500/50">Liberado</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-500/20 text-foreground dark:text-yellow-300 border-yellow-500/50">Pendente</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-500/20 text-foreground dark:text-red-300 border-red-500/50">Cancelado</Badge>
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
    return (
      <AdminPageShell
        highlight="DETALHES DO"
        title="PEDIDO"
      >
        <OrderDetailSkeleton />
      </AdminPageShell>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>Pedido não encontrado</AlertDescription>
          </Alert>
          <BackButton href="/admin/orders">Voltar para Pedidos</BackButton>
      </div>
    )
  }

  return (
    <AdminPageShell
      highlight="DETALHES DO"
      title={`PEDIDO #${order.id}`}
      description={order.service.name}
    >
        {alert && (
          <Alert variant={alert.variant} className="mb-4">
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        )}

        {/* Status e Ações */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground font-orbitron">
                Status do Pedido
              </CardTitle>
              <StatusBadge status={order.status as OrderStatus} />
            </div>
          </CardHeader>
          <CardContent>
            {STATUS_TRANSITIONS[order.status]?.length > 0 ? (
              <div className="flex flex-wrap gap-4 items-center">
                <span className="text-muted-foreground font-rajdhani">
                  Alterar status:
                </span>
                <Select value={order.status} onValueChange={handleStatusUpdate}>
                  <SelectTrigger className="w-52 bg-background/50 border-brand-purple/50 text-foreground font-rajdhani">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-brand-purple/50">
                    {/* Current status — shown so the trigger has a label, not an action */}
                    <SelectItem value={order.status}>{STATUS_LABELS[order.status]} (atual)</SelectItem>
                    {STATUS_TRANSITIONS[order.status].map((next) => (
                      <SelectItem key={next} value={next}>{STATUS_LABELS[next]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-muted-foreground font-rajdhani">
                Este pedido está {STATUS_LABELS[order.status]?.toLowerCase()} e não pode mais mudar de status.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Informações do Pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-foreground font-orbitron flex items-center gap-2">
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
                value={<span className="text-lg font-bold text-brand-purple-light font-orbitron">{formatPrice(order.total)}</span>}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cliente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-foreground font-orbitron flex items-center gap-2">
              <User className="h-5 w-5 text-brand-purple" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OrderInfoItem label="Nome" value={order.user.name || '-'} />
              <OrderInfoItem label="Email" value={order.user.email} />
            </div>
          </CardContent>
        </Card>

        {/* Booster */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-foreground font-orbitron flex items-center gap-2">
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
              <p className="text-muted-foreground font-rajdhani">
                Nenhum booster atribuído
              </p>
            )}

            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-brand-purple/20 pt-4">
                <span className="text-muted-foreground font-rajdhani">
                  {order.booster ? 'Trocar booster:' : 'Atribuir booster:'}
                </span>
                <Select
                  value={order.booster ? String(order.booster.id) : 'none'}
                  onValueChange={handleAssignBooster}
                  disabled={assigning}
                >
                  <SelectTrigger className="w-64 bg-background/50 border-brand-purple/50 text-foreground font-rajdhani">
                    <SelectValue placeholder="Selecione um booster" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-brand-purple/50">
                    <SelectItem value="none">Nenhum (remover)</SelectItem>
                    {boosters.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name || b.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {boosters.length === 0 && (
                  <span className="text-muted-foreground text-sm font-rajdhani">
                    Nenhum booster verificado disponível.
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagamentos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-foreground font-orbitron flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-purple" />
              Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.payments.length > 0 ? (
              <div className="space-y-4">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-brand-purple/30">
                    <div>
                      <p className="text-foreground font-rajdhani">
                        Pagamento #{payment.id}
                      </p>
                      <p className="text-muted-foreground text-sm font-rajdhani">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-brand-purple-light font-orbitron">
                        {formatPrice(payment.total)}
                      </span>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground font-rajdhani">
                Nenhum pagamento registrado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Comissões e Receitas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-foreground font-orbitron flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-brand-purple" />
              Comissões e Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Comissão do Booster */}
              {order.commission && (
                <div className="p-4 bg-background/50 rounded-lg border border-brand-purple/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-rajdhani">
                        Comissão do Booster
                      </p>
                      <p className="text-muted-foreground text-sm font-rajdhani">
                        {(order.commission.percentage * 100).toFixed(0)}% do valor total
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-foreground dark:text-green-300 font-orbitron">
                        {formatPrice(order.commission.amount)}
                      </span>
                      {getCommissionStatusBadge(order.commission.status)}
                    </div>
                  </div>
                </div>
              )}

              {/* Receitas Admin */}
              {order.revenues.map((revenue) => (
                <div key={revenue.id} className="p-4 bg-background/50 rounded-lg border border-brand-purple/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground font-rajdhani">
                        Receita Admin {revenue.admin.name ? `(${revenue.admin.name})` : ''}
                      </p>
                      <p className="text-muted-foreground text-sm font-rajdhani">
                        {(revenue.percentage * 100).toFixed(0)}% do valor total
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-foreground dark:text-green-300 font-orbitron">
                        {formatPrice(revenue.amount)}
                      </span>
                      {getCommissionStatusBadge(revenue.status)}
                    </div>
                  </div>
                </div>
              ))}

              {!order.commission && order.revenues.length === 0 && (
                <p className="text-muted-foreground font-rajdhani">
                  Nenhuma comissão ou receita registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comprovante de Conclusão */}
        {order.completionProofUrl && (
          <Card className="bg-background/30 backdrop-blur-md border-green-500/40 mb-6">
            <CardHeader>
              <CardTitle className="text-foreground font-orbitron flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-green-400" />
                Comprovante de Conclusão
              </CardTitle>
              <CardDescription className="text-muted-foreground font-rajdhani">
                Print enviado pelo booster comprovando o rank atingido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Comprovante enviado pelo usuário (dimensões arbitrárias) — migração p/ next/image exige QA visual */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.completionProofUrl}
                  alt="Comprovante de conclusão"
                  className="w-full max-w-lg rounded-lg border border-green-500/30 object-cover"
                />
                <a
                  href={order.completionProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-purple-light hover:text-brand-purple-lighter font-rajdhani"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver em tamanho original
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Datas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground font-orbitron flex items-center gap-2">
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
    </AdminPageShell>
  )
}
