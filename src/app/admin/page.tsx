'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
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
  RefreshCw
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
    id: string
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

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
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar estatísticas'
      setError(errorMessage)
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            highlight="PAINEL"
            title="ADMINISTRATIVO"
            description={`Bem-vindo, ${user.name || user.email}. Gerencie a plataforma GameBoost Pro.`}
          />
          <Card className="bg-black/30 backdrop-blur-md border-red-500/50">
            <CardContent className="p-6 text-center">
              <p className="text-red-300 font-rajdhani text-lg" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Erro ao carregar estatísticas. Por favor, tente novamente.
              </p>
              <Button
                onClick={() => fetchStats()}
                className="mt-4 bg-purple-500 hover:bg-purple-400 text-white"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <PageHeader
            highlight="PAINEL"
            title="ADMINISTRATIVO"
            description={`Bem-vindo, ${user.name || user.email}. Gerencie a plataforma GameBoost Pro.`}
          />
          <Button
            onClick={() => fetchStats(true)}
            disabled={refreshing || loading}
            variant="outline"
            className="bg-black/30 border-purple-500/50 hover:border-purple-400 text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-500/20 border-red-500/50">
            <AlertTitle className="text-red-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Erro
            </AlertTitle>
            <AlertDescription className="text-red-200 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/users">
            <Card className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <Users className="h-5 w-5 text-purple-500" />
                  Gerenciar Usuários
                </CardTitle>
                <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Ver, editar e gerenciar todos os usuários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-purple-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                  Acessar <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/orders">
            <Card className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <ShoppingCart className="h-5 w-5 text-purple-500" />
                  Gerenciar Pedidos
                </CardTitle>
                <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Visualizar e atualizar status dos pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-purple-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                  Acessar <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/services">
            <Card className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <Package className="h-5 w-5 text-purple-500" />
                  Gerenciar Serviços
                </CardTitle>
                <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Criar, editar e gerenciar serviços
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-purple-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}>
                  Acessar <ArrowRight className="ml-2 h-4 w-4" />
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
                      className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors"
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
      </div>
    </div>
  )
}

