'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
} from 'lucide-react'
import { StatCard } from '@/components/common/stat-card'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { OrdersListSkeleton, StatsGridSkeleton } from '@/components/common/loading-skeletons'
import { RefreshingBanner } from '@/components/common/refreshing-banner'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Revenue {
  id: number
  orderTotal: number
  percentage: number
  amount: number
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  paidAt: string | null
  createdAt: string
  order: {
    id: number
    status: string
    user: {
      id: number
      email: string
      name: string | null
    }
    service: {
      id: number
      name: string
      game: string
    }
    booster: {
      id: number
      email: string
      name: string | null
    } | null
  }
}

interface Stats {
  totalRevenue: number
  pendingRevenue: number
  totalRevenues: number
  paidRevenues: number
  pendingRevenues: number
}

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const { loading, refreshing, withLoading } = useLoading({ initialLoading: true })
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'ADMIN') {
      if (user.role === 'BOOSTER') {
        router.replace('/booster')
      } else if (user.role === 'CLIENT') {
        router.replace('/dashboard')
      } else {
        router.replace('/')
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchPayments()
    }
  }, [user?.id, activeTab])

  const fetchPayments = async () => {
    await withLoading(async () => {
      try {
        const status = activeTab === 'all' ? '' : activeTab
        const url = status ? `/api/admin/payments?status=${status}` : '/api/admin/payments'
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setRevenues(data.revenues || [])
          setStats(data.stats || null)
        } else {
          console.error('Erro ao buscar receitas')
        }
      } catch (error) {
        console.error('Erro ao buscar receitas:', error)
      }
    })
  }

  // Loading de tela inteira apenas para autenticação
  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/50">Pago</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Pendente</Badge>
      case 'CANCELLED':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/50">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Removido RefreshingBanner para evitar piscar - atualizações são silenciosas */}
        
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="text-purple-300 hover:text-purple-200 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Dashboard
            </Button>
          </Link>
        </div>

        <PageHeader
          highlight="MINHAS"
          title="RECEITAS"
          description={`Olá, ${user.name || user.email}! Visualize suas receitas.`}
        />

        {/* Cards de Estatísticas */}
        {loading && !stats ? (
          <StatsGridSkeleton count={5} />
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <StatCard
              title="Total Recebido"
              value={formatPrice(stats.totalRevenue)}
              description="Receitas pagas"
              icon={CheckCircle2}
              iconColor="text-green-500"
              valueColor="text-green-300"
            />
            <StatCard
              title="Pendente"
              value={formatPrice(stats.pendingRevenue)}
              description="Aguardando pagamento"
              icon={Clock}
              iconColor="text-yellow-500"
              valueColor="text-yellow-300"
            />
            <StatCard
              title="Total de Receitas"
              value={stats.totalRevenues}
              description="Todas as receitas"
              icon={DollarSign}
              iconColor="text-purple-500"
            />
            <StatCard
              title="Pagas"
              value={stats.paidRevenues}
              description="Receitas pagas"
              icon={CheckCircle2}
              iconColor="text-green-500"
            />
            <StatCard
              title="Pendentes"
              value={stats.pendingRevenues}
              description="Aguardando pagamento"
              icon={Clock}
              iconColor="text-yellow-500"
            />
          </div>
        ) : null}

        {/* Tabs de Receitas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-black/30 border border-purple-500/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-500/20">
              Todas
            </TabsTrigger>
            <TabsTrigger value="PENDING" className="data-[state=active]:bg-yellow-500/20">
              Pendentes
            </TabsTrigger>
            <TabsTrigger value="PAID" className="data-[state=active]:bg-green-500/20">
              Pagas
            </TabsTrigger>
            <TabsTrigger value="CANCELLED" className="data-[state=active]:bg-red-500/20">
              Canceladas
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <OrdersListSkeleton count={3} />
            ) : revenues.length === 0 ? (
              <EmptyState
                title="Nenhuma receita encontrada"
                description={`Não há receitas ${activeTab === 'all' ? '' : activeTab === 'PENDING' ? 'pendentes' : activeTab === 'PAID' ? 'pagas' : 'canceladas'}.`}
                icon={DollarSign}
              />
            ) : (
              <div className="grid gap-4 lg:gap-6">
                {revenues.map((revenue) => (
                  <Card key={revenue.id} className="bg-black/30 backdrop-blur-md border-purple-500/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            {revenue.order.service.name}
                          </CardTitle>
                          <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            Pedido #{revenue.order.id}
                          </CardDescription>
                        </div>
                        {getStatusBadge(revenue.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <OrderInfoItem 
                          label="Valor da Receita" 
                          value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(revenue.amount)} ({(revenue.percentage * 100).toFixed(0)}%)</span>}
                        />
                        <OrderInfoItem 
                          label="Valor Total do Pedido" 
                          value={<span className="text-lg font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(revenue.orderTotal)}</span>}
                        />
                        <OrderInfoItem label="Cliente" value={revenue.order.user.name || revenue.order.user.email} />
                        {revenue.order.booster && (
                          <OrderInfoItem label="Booster" value={revenue.order.booster.name || revenue.order.booster.email} />
                        )}
                        {revenue.status === 'PAID' && revenue.paidAt && (
                          <OrderInfoItem label="Data do Pagamento" value={formatDate(revenue.paidAt)} />
                        )}
                        <OrderInfoItem label="Data da Receita" value={formatDate(revenue.createdAt)} />
                        <OrderInfoItem label="Status do Pedido" value={revenue.order.status} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

