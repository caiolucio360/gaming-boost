'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Settings as SettingsIcon
} from 'lucide-react'
import Link from 'next/link'
import { StatCard } from '@/components/common/stat-card'
import { PageHeader } from '@/components/common/page-header'
import { StatusBadge } from '@/components/common/status-badge'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/empty-state'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { StatsGridSkeleton } from '@/components/common/loading-skeletons'
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
  const { loading, refreshing, withLoading } = useLoading({ initialLoading: true })
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
    <div className="min-h-screen bg-[var(--surface-page)] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
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
          <StatsGridSkeleton count={4} />
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
            valueColor="text-[var(--action-primary-hover)]"
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

        {/* Cards de Ações Rápidas - Modern Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mb-8 lg:mb-10">
          
          {/* Gerenciar Usuários */}
          <Link href="/admin/users" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-[var(--surface-card)] backdrop-blur-xl border border-[var(--border-default)] hover:border-[var(--border-brand)]/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-[var(--action-primary)]/10 hover:-translate-y-1 card-interactive">
              {/* Glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--action-primary)]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-purple flex items-center justify-center mb-4 shadow-lg shadow-[var(--action-primary)]/25 group-hover:scale-110 group-hover:shadow-[var(--action-primary)]/40 transition-all duration-300">
                  <Users className="h-7 w-7 text-[var(--text-on-brand)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-orbitron group-hover:text-[var(--action-primary-hover)] transition-colors">
                  Usuários
                </h3>
                <p className="text-[var(--text-muted)] text-sm font-rajdhani group-hover:text-[var(--text-secondary)] transition-colors">
                  Gerenciar todos os usuários da plataforma
                </p>
                <div className="flex items-center mt-4 text-[var(--action-primary-hover)] text-sm font-medium group-hover:text-[var(--action-primary-hover)] transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Gerenciar Pedidos */}
          <Link href="/admin/orders" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-[var(--surface-card)] backdrop-blur-xl border border-[var(--border-default)] hover:border-[var(--border-brand)]/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-[var(--action-primary)]/10 hover:-translate-y-1 card-interactive">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--action-primary)]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-purple flex items-center justify-center mb-4 shadow-lg shadow-[var(--action-primary)]/25 group-hover:scale-110 group-hover:shadow-[var(--action-primary)]/40 transition-all duration-300">
                  <ShoppingCart className="h-7 w-7 text-[var(--text-on-brand)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-orbitron group-hover:text-[var(--action-primary-hover)] transition-colors">
                  Pedidos
                </h3>
                <p className="text-[var(--text-muted)] text-sm font-rajdhani group-hover:text-[var(--text-secondary)] transition-colors">
                  Visualizar e gerenciar status dos pedidos
                </p>
                <div className="flex items-center mt-4 text-[var(--action-primary-hover)] text-sm font-medium group-hover:text-[var(--action-primary-hover)] transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Receitas */}
          <Link href="/admin/payments" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-[var(--surface-card)] backdrop-blur-xl border border-[var(--border-default)] hover:border-[var(--status-success)]/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-[var(--status-success)]/10 hover:-translate-y-1 card-interactive">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--status-success)]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--status-success)] to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-[var(--status-success)]/25 group-hover:scale-110 group-hover:shadow-[var(--status-success)]/40 transition-all duration-300">
                  <DollarSign className="h-7 w-7 text-[var(--text-on-brand)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-orbitron group-hover:text-emerald-200 transition-colors">
                  Receitas
                </h3>
                <p className="text-[var(--text-muted)] text-sm font-rajdhani group-hover:text-[var(--text-secondary)] transition-colors">
                  Acompanhar pagamentos e receitas
                </p>
                <div className="flex items-center mt-4 text-[var(--status-success)] text-sm font-medium group-hover:text-emerald-300 transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Configurar Comissões */}
          <Link href="/admin/commission-config" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-[var(--surface-card)] backdrop-blur-xl border border-[var(--border-default)] hover:border-[var(--status-warning)]/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-[var(--status-warning)]/10 hover:-translate-y-1 card-interactive">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--status-warning)]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--status-warning)] to-amber-600 flex items-center justify-center mb-4 shadow-lg shadow-[var(--status-warning)]/25 group-hover:scale-110 group-hover:shadow-[var(--status-warning)]/40 transition-all duration-300">
                  <SettingsIcon className="h-7 w-7 text-[var(--text-on-brand)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-orbitron group-hover:text-amber-200 transition-colors">
                  Comissões
                </h3>
                <p className="text-[var(--text-muted)] text-sm font-rajdhani group-hover:text-[var(--text-secondary)] transition-colors">
                  Configurar porcentagens de comissão
                </p>
                <div className="flex items-center mt-4 text-[var(--status-warning)] text-sm font-medium group-hover:text-amber-300 transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Aplicações de Booster */}
          <Link href="/admin/boosters" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-[var(--surface-card)] backdrop-blur-xl border border-[var(--border-default)] hover:border-[var(--border-brand)]/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-[var(--action-primary)]/10 hover:-translate-y-1 card-interactive">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--action-primary)]/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-purple flex items-center justify-center mb-4 shadow-lg shadow-[var(--action-primary)]/25 group-hover:scale-110 group-hover:shadow-[var(--action-primary)]/40 transition-all duration-300">
                  <Users className="h-7 w-7 text-[var(--text-on-brand)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 font-orbitron group-hover:text-[var(--action-primary-hover)] transition-colors">
                  Boosters
                </h3>
                <p className="text-[var(--text-muted)] text-sm font-rajdhani group-hover:text-[var(--text-secondary)] transition-colors">
                  Aprovar ou rejeitar candidatos
                </p>
                <div className="flex items-center mt-4 text-[var(--action-primary-hover)] text-sm font-medium group-hover:text-[var(--action-primary-hover)] transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* Pedidos Recentes */}
        <Card className="bg-[var(--surface-card)]/30 backdrop-blur-md border-[var(--border-brand)]/50">
          <CardHeader>
            <CardTitle className="text-[var(--text-primary)] font-orbitron">
              Pedidos Recentes
            </CardTitle>
            <CardDescription className="text-[var(--text-muted)] font-rajdhani">
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
                      color: 'bg-[var(--status-warning)]/20 text-amber-300 border-[var(--status-warning)]/50',
                      icon: Clock,
                    },
                    IN_PROGRESS: {
                      label: 'Em Progresso',
                      color: 'bg-[var(--action-primary)]/20 text-[var(--action-primary-hover)] border-[var(--action-primary)]/50',
                      icon: Loader2,
                    },
                    COMPLETED: {
                      label: 'Concluído',
                      color: 'bg-[var(--status-success)]/20 text-emerald-300 border-[var(--status-success)]/50',
                      icon: CheckCircle2,
                    },
                    CANCELLED: {
                      label: 'Cancelado',
                      color: 'bg-[var(--status-error)]/20 text-red-300 border-[var(--status-error)]/50',
                      icon: XCircle,
                    },
                  }
                  
                  const statusInfo = statusConfigs[order.status] || statusConfigs.PENDING
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={order.id}
                      className="group flex items-center justify-between p-4 bg-[var(--surface-card)]/50 rounded-lg border border-[var(--border-brand)]/20 hover:border-[var(--border-brand)]/60 hover:shadow-lg hover:shadow-[var(--action-primary)]/10 hover:scale-[1.01] transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-[var(--text-primary)] font-rajdhani font-bold">
                            {order.service.name}
                          </p>
                          <Badge className={`${statusInfo.color} border font-rajdhani flex items-center gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] font-rajdhani">
                          {order.user.name || order.user.email} • {order.service.game} • {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[var(--action-primary-hover)] font-orbitron">
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
    </div>
  )
}
