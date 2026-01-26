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

interface Commission {
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
  }
}

interface Stats {
  totalEarnings: number
  pendingEarnings: number
  totalCommissions: number
  paidCommissions: number
  pendingCommissions: number
}

export default function BoosterPaymentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const { loading, refreshing, withLoading } = useLoading({ initialLoading: true })
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'BOOSTER') {
      if (user.role === 'ADMIN') {
        router.replace('/admin')
      } else if (user.role === 'CLIENT') {
        router.replace('/dashboard')
      } else {
        router.replace('/')
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'BOOSTER') {
      fetchPayments()
    }
  }, [user?.id, activeTab])

  const fetchPayments = async () => {
    await withLoading(async () => {
      try {
        const status = activeTab === 'all' ? '' : activeTab
        const url = status ? `/api/booster/payments?status=${status}` : '/api/booster/payments'
        
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setCommissions(data.commissions || [])
          setStats(data.stats || null)
        } else {
          console.error('Erro ao buscar pagamentos')
        }
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error)
      }
    })
  }

  // Loading de tela inteira apenas para autenticação
  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user || user.role !== 'BOOSTER') {
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
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Removido RefreshingBanner para evitar piscar - atualizações são silenciosas */}
        
        <div className="mb-6">
          <Link href="/booster">
            <Button variant="ghost" className="text-brand-purple-light hover:text-brand-purple-light mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Dashboard
            </Button>
          </Link>
        </div>

        <PageHeader
          highlight="MEUS"
          title="PAGAMENTOS"
          description={`Olá, ${user.name || user.email}! Visualize suas comissões e ganhos.`}
        />

        {/* Cards de Estatísticas */}
        {loading && !stats ? (
          <StatsGridSkeleton count={5} />
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <StatCard
              title="Total Recebido"
              value={formatPrice(stats.totalEarnings)}
              description="Comissões pagas"
              icon={CheckCircle2}
              iconColor="text-green-500"
              valueColor="text-green-300"
            />
            <StatCard
              title="Pendente"
              value={formatPrice(stats.pendingEarnings)}
              description="Aguardando pagamento"
              icon={Clock}
              iconColor="text-yellow-500"
              valueColor="text-yellow-300"
            />
            <StatCard
              title="Total de Comissões"
              value={stats.totalCommissions}
              description="Todas as comissões"
              icon={DollarSign}
              iconColor="text-brand-purple"
            />
            <StatCard
              title="Pagas"
              value={stats.paidCommissions}
              description="Comissões pagas"
              icon={CheckCircle2}
              iconColor="text-green-500"
            />
            <StatCard
              title="Pendentes"
              value={stats.pendingCommissions}
              description="Aguardando pagamento"
              icon={Clock}
              iconColor="text-yellow-500"
            />
          </div>
        ) : null}

        {/* Tabs de Comissões */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-brand-black/30 border border-brand-purple/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-brand-purple/20">
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
            ) : commissions.length === 0 ? (
              <EmptyState
                title="Nenhuma comissão encontrada"
                description={`Não há comissões ${activeTab === 'all' ? '' : activeTab === 'PENDING' ? 'pendentes' : activeTab === 'PAID' ? 'pagas' : 'canceladas'}.`}
                icon={DollarSign}
              />
            ) : (
              <div className="grid gap-4 lg:gap-6">
                {commissions.map((commission) => (
                  <Card key={commission.id} className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            {commission.order.service.name}
                          </CardTitle>
                          <CardDescription className="text-brand-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                            Pedido #{commission.order.id}
                          </CardDescription>
                        </div>
                        {getStatusBadge(commission.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <OrderInfoItem 
                          label="Valor da Comissão" 
                          value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(commission.amount)} ({(commission.percentage * 100).toFixed(0)}%)</span>}
                        />
                        <OrderInfoItem 
                          label="Valor Total do Pedido" 
                          value={<span className="text-lg font-bold text-brand-purple-light font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(commission.orderTotal)}</span>}
                        />
                        <OrderInfoItem label="Cliente" value={commission.order.user.name || commission.order.user.email} />
                        {commission.status === 'PAID' && commission.paidAt && (
                          <OrderInfoItem label="Data do Pagamento" value={formatDate(commission.paidAt)} />
                        )}
                        <OrderInfoItem label="Data da Comissão" value={formatDate(commission.createdAt)} />
                        <OrderInfoItem label="Status do Pedido" value={commission.order.status} />
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

