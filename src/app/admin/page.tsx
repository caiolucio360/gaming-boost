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

        {/* Cards de Ações Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Link href="/admin/users" aria-label="Gerenciar usuários - Ver, editar e gerenciar todos os usuários">
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 cursor-pointer overflow-hidden">
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardHeader className="relative z-10">
                <CardTitle className="text-white font-orbitron flex items-center gap-2 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
                    <Users className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  Gerenciar Usuários
                </CardTitle>
                <CardDescription className="text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Ver, editar e gerenciar todos os usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center text-purple-300 font-rajdhani group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                  Acessar <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/orders" aria-label="Gerenciar pedidos - Visualizar e atualizar status dos pedidos">
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardHeader className="relative z-10">
                <CardTitle className="text-white font-orbitron flex items-center gap-2 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
                    <ShoppingCart className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  Gerenciar Pedidos
                </CardTitle>
                <CardDescription className="text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Visualizar e atualizar status dos pedidos
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center text-purple-300 font-rajdhani group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                  Acessar <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/services" aria-label="Gerenciar serviços - Criar, editar e gerenciar serviços">
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardHeader className="relative z-10">
                <CardTitle className="text-white font-orbitron flex items-center gap-2 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
                    <Package className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  Gerenciar Serviços
                </CardTitle>
                <CardDescription className="text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Criar, editar e gerenciar serviços
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center text-purple-300 font-rajdhani group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                  Acessar <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/payments" aria-label="Minhas receitas - Visualizar receitas e pagamentos">
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardHeader className="relative z-10">
                <CardTitle className="text-white font-orbitron flex items-center gap-2 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors duration-300">
                    <DollarSign className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  Minhas Receitas
                </CardTitle>
                <CardDescription className="text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Visualizar receitas e pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center text-purple-300 font-rajdhani group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                  Acessar <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/commission-config" aria-label="Configurar comissões - Definir porcentagens de comissão">
            <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 cursor-pointer overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
              <CardHeader className="relative z-10">
                <CardTitle className="text-white font-orbitron flex items-center gap-2 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
                    <SettingsIcon className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  Configurar Comissões
                </CardTitle>
                <CardDescription className="text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Definir porcentagens de comissão
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center text-purple-300 font-rajdhani group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                  Acessar <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
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

