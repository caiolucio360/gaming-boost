'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/common/stat-card'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/empty-state'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SkeletonStatsGrid } from '@/components/common/skeletons'
import { formatPrice, formatDate } from '@/lib/utils'

interface Stats {
  users: {
    total: number
    clients: number
    boosters: number
    admins: number
  }
  orders: {
    total: number
    pending: number
    inProgress: number
    completed: number
    cancelled: number
  }
  revenue: {
    total: number
    devRevenue?: number
  }
  isDevAdmin?: boolean
  recentOrders: Array<{
    id: number
    status: string
    total: number
    createdAt: string
    user: { email: string; name?: string }
    service: { name: string; game: string }
  }>
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      // Usar replace para redirecionamento de autenticação
      router.replace('/login')
    } else if (user && user.role !== 'ADMIN') {
      // Redirecionar baseado no role usando replace
      if (user.role === 'CLIENT') {
        router.replace('/dashboard')
      } else if (user.role === 'BOOSTER') {
        router.replace('/booster')
      } else {
        router.replace('/')
      }
    } else if (user && user.role === 'ADMIN') {
      fetchStats()
    }
  }, [user, authLoading, router])

  const fetchStats = async (isRefresh = false) => {
    try {
      setError(null)
      await withLoading(async () => {
        const response = await fetch('/api/admin/stats', {
          cache: 'no-store',
        })
        
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats)
          setError(null)
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Erro ao buscar estatísticas' }))
          setError(errorData.message || 'Erro ao buscar estatísticas')
          console.error('Erro ao buscar estatísticas:', errorData.message)
        }
      }, isRefresh)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar estatísticas'
      setError(errorMessage)
      console.error('Erro ao buscar estatísticas:', error)
    }
  }


  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Removido banner de refreshing para evitar piscar - atualizações são silenciosas */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <PageHeader
          highlight="PAINEL"
          title="ADMINISTRATIVO"
          description={`Bem-vindo, ${user.name || user.email}. Gerencie a plataforma GameBoost.`}
        />

        {/* Cards de Estatísticas */}
        {loading && !stats ? (
          <SkeletonStatsGrid count={4} />
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <StatCard
            title="Total de Usuários"
            value={stats.users.total}
            description={`${stats.users.clients} clientes • ${stats.users.boosters} boosters • ${stats.users.admins} admins`}
            icon={Users}
          />
          <StatCard
            title="Total de Pedidos"
            value={stats.orders.total}
            description={`${stats.orders.pending} pendentes • ${stats.orders.completed} concluídos`}
            icon={ShoppingCart}
          />
          <StatCard
            title="Receita Total"
            value={formatPrice(stats.revenue.total)}
            description="Pedidos concluídos"
            icon={DollarSign}
            valueColor="text-brand-purple-light"
          />
          {stats.isDevAdmin && (
            <StatCard
              title="Receita Dev"
              value={formatPrice(stats.revenue.devRevenue || 0)}
              description="Sua comissão (10%)"
              icon={DollarSign}
              valueColor="text-amber-400"
            />
          )}
        </div>

        {/* Alert: pedidos pagos aguardando booster */}
        {stats.orders.pending > 0 && (
          <Alert className="mb-6 bg-amber-500/10 border-amber-500/50">
            <AlertTitle className="text-amber-400 font-orbitron text-sm">
              {stats.orders.pending} pedido{stats.orders.pending > 1 ? 's' : ''} aguardando booster
            </AlertTitle>
            <AlertDescription className="text-brand-gray-300 font-rajdhani text-sm">
              Há pedidos pagos sem booster atribuído.{' '}
              <Link href="/admin/orders" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                Ver pedidos →
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Pedidos Recentes */}
        <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
          <CardHeader>
            <CardTitle className="text-white font-orbitron">
              Pedidos Recentes
            </CardTitle>
            <CardDescription className="text-brand-gray-500 font-rajdhani">
              Últimos 5 pedidos criados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="Nenhum pedido encontrado"
                  description="Ainda não há pedidos registrados na plataforma."
                  icon={ShoppingCart}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => {
                  const statusConfigs: Record<string, { label: string; color: string; icon: any }> = {
                    PENDING: {
                      label: 'Pendente',
                      color: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
                      icon: Clock,
                    },
                    IN_PROGRESS: {
                      label: 'Em Progresso',
                      color: 'bg-brand-purple/20 text-brand-purple-light border-brand-purple/50',
                      icon: Loader2,
                    },
                    COMPLETED: {
                      label: 'Concluído',
                      color: 'bg-green-500/20 text-emerald-300 border-green-500/50',
                      icon: CheckCircle2,
                    },
                    CANCELLED: {
                      label: 'Cancelado',
                      color: 'bg-red-500/20 text-red-300 border-red-500/50',
                      icon: XCircle,
                    },
                  }
                  
                  const statusInfo = statusConfigs[order.status] || statusConfigs.PENDING
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={order.id}
                      className="group flex items-center justify-between p-4 bg-brand-black-light/50 rounded-lg border border-brand-purple/20 hover:border-brand-purple-light/60 hover:shadow-lg hover:shadow-brand-purple/10 hover:scale-[1.01] transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-white font-rajdhani font-bold">
                            {order.service.name}
                          </p>
                          <Badge className={`${statusInfo.color} border font-rajdhani flex items-center gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-brand-gray-500 font-rajdhani">
                          {order.user.name || order.user.email} • {order.service.game} • {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-brand-purple-light font-orbitron">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
          </>
        ) : null}
    </div>
  )
}
