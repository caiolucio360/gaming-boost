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
  services: {
    total: number
  }
  revenue: {
    total: number
  }
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
    <div className="min-h-screen bg-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <StatCard
            title="Total de Usuários"
            value={stats.users.total}
            description={`${stats.users.clients} clientes • ${stats.users.boosters} boosters`}
            icon={Users}
          />
          <StatCard
            title="Total de Pedidos"
            value={stats.orders.total}
            description={`${stats.orders.pending} pendentes • ${stats.orders.completed} concluídos`}
            icon={ShoppingCart}
          />
          <StatCard
            title="Serviços Disponíveis"
            value={stats.services.total}
            description="Ativos na plataforma"
            icon={Package}
          />
          <StatCard
            title="Receita Total"
            value={formatPrice(stats.revenue.total)}
            description="Pedidos concluídos"
            icon={DollarSign}
            valueColor="text-purple-300"
          />
        </div>

        {/* Cards de Ações Rápidas - Modern Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 mb-8 lg:mb-10">
          
          {/* Gerenciar Usuários */}
          <Link href="/admin/users" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
              {/* Glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25 group-hover:scale-110 group-hover:shadow-purple-500/40 transition-all duration-300">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-orbitron group-hover:text-purple-200 transition-colors" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Usuários
                </h3>
                <p className="text-gray-400 text-sm font-rajdhani group-hover:text-gray-300 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Gerenciar todos os usuários da plataforma
                </p>
                <div className="flex items-center mt-4 text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Gerenciar Pedidos */}
          <Link href="/admin/orders" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:shadow-blue-500/40 transition-all duration-300">
                  <ShoppingCart className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-orbitron group-hover:text-blue-200 transition-colors" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Pedidos
                </h3>
                <p className="text-gray-400 text-sm font-rajdhani group-hover:text-gray-300 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Visualizar e gerenciar status dos pedidos
                </p>
                <div className="flex items-center mt-4 text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Gerenciar Serviços */}
          <Link href="/admin/services" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/25 group-hover:scale-110 group-hover:shadow-cyan-500/40 transition-all duration-300">
                  <Package className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-orbitron group-hover:text-cyan-200 transition-colors" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Serviços
                </h3>
                <p className="text-gray-400 text-sm font-rajdhani group-hover:text-gray-300 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Criar e editar serviços disponíveis
                </p>
                <div className="flex items-center mt-4 text-cyan-400 text-sm font-medium group-hover:text-cyan-300 transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Receitas */}
          <Link href="/admin/payments" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-white/10 hover:border-green-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-1">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-green-500/25 group-hover:scale-110 group-hover:shadow-green-500/40 transition-all duration-300">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-orbitron group-hover:text-green-200 transition-colors" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Receitas
                </h3>
                <p className="text-gray-400 text-sm font-rajdhani group-hover:text-gray-300 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Acompanhar pagamentos e receitas
                </p>
                <div className="flex items-center mt-4 text-green-400 text-sm font-medium group-hover:text-green-300 transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Configurar Comissões */}
          <Link href="/admin/commission-config" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-white/10 hover:border-orange-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/25 group-hover:scale-110 group-hover:shadow-orange-500/40 transition-all duration-300">
                  <SettingsIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-orbitron group-hover:text-orange-200 transition-colors" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Comissões
                </h3>
                <p className="text-gray-400 text-sm font-rajdhani group-hover:text-gray-300 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Configurar porcentagens de comissão
                </p>
                <div className="flex items-center mt-4 text-orange-400 text-sm font-medium group-hover:text-orange-300 transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Aplicações de Booster */}
          <Link href="/admin/boosters" className="group">
            <div className="relative h-full p-6 rounded-2xl bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-800/40 backdrop-blur-xl border border-white/10 hover:border-yellow-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-yellow-500/10 hover:-translate-y-1">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/25 group-hover:scale-110 group-hover:shadow-yellow-500/40 transition-all duration-300">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-orbitron group-hover:text-yellow-200 transition-colors" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Boosters
                </h3>
                <p className="text-gray-400 text-sm font-rajdhani group-hover:text-gray-300 transition-colors" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Aprovar ou rejeitar candidatos
                </p>
                <div className="flex items-center mt-4 text-yellow-400 text-sm font-medium group-hover:text-yellow-300 transition-colors">
                  Acessar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

        </div>

        {/* Pedidos Recentes */}
        <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
          <CardHeader>
            <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Pedidos Recentes
            </CardTitle>
            <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
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
                      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
                      icon: Clock,
                    },
                    IN_PROGRESS: {
                      label: 'Em Progresso',
                      color: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
                      icon: Loader2,
                    },
                    COMPLETED: {
                      label: 'Concluído',
                      color: 'bg-green-500/20 text-green-300 border-green-500/50',
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
                      className="group flex items-center justify-between p-4 bg-gradient-to-br from-black/50 via-black/40 to-black/50 rounded-lg border border-purple-500/20 hover:border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.01] transition-all duration-300"
                      style={{
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-white font-rajdhani font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            {order.service.name}
                          </p>
                          <Badge className={`${statusInfo.color} border font-rajdhani flex items-center gap-1`} style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {order.user.name || order.user.email} • {order.service.game} • {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
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

