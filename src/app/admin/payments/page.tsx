'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Wallet,
  Settings,
} from 'lucide-react'
import { StatCard } from '@/components/common/stat-card'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { SkeletonOrdersList, SkeletonStatsGrid } from '@/components/common/skeletons'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

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
    user: { id: number; email: string; name: string | null }
    service: { id: number; name: string; game: string }
    booster: { id: number; email: string; name: string | null } | null
  }
}

interface RevenueStats {
  totalRevenue: number
  pendingRevenue: number
  totalRevenues: number
  paidRevenues: number
  pendingRevenues: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const { loading: revenueLoading, withLoading: withRevenueLoading } = useLoading({ initialLoading: true })
  const [revenueFilter, setRevenueFilter] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'ADMIN') {
      router.replace(user.role === 'BOOSTER' ? '/booster' : user.role === 'CLIENT' ? '/dashboard' : '/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchRevenues()
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchRevenues()
  }, [revenueFilter])

  const fetchRevenues = async () => {
    await withRevenueLoading(async () => {
      try {
        const status = revenueFilter === 'all' ? '' : revenueFilter
        const url = status ? `/api/admin/payments?status=${status}` : '/api/admin/payments'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setRevenues(data.revenues || [])
          setRevenueStats(data.stats || null)
        }
      } catch (error) {
        console.error('Erro ao buscar receitas:', error)
      }
    })
  }

  const getRevenueStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge className="bg-green-500/20 text-green-300 border-green-500/50">Pago</Badge>
      case 'PENDING': return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Pendente</Badge>
      case 'CANCELLED': return <Badge className="bg-red-500/20 text-red-300 border-red-500/50">Cancelado</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="text-brand-purple-light hover:text-brand-purple-light mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Dashboard
            </Button>
          </Link>
        </div>

        <PageHeader
          highlight="FINANCEIRO"
          title="ADMIN"
          description={`Olá, ${user.name || user.email}! Gerencie receitas e comissões.`}
        />

        <div className="flex justify-end mb-4">
          <Link href="/admin/withdraw">
            <Button variant="outline" className="border-brand-purple/50 text-brand-purple-light hover:bg-brand-purple/10">
              <Wallet className="h-4 w-4 mr-2" />Ver Saques
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="receitas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-brand-black/30 border border-brand-purple/50 mb-6">
            <TabsTrigger value="receitas" className="data-[state=active]:bg-brand-purple/20">
              <DollarSign className="h-4 w-4 mr-2" />Receitas
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-amber-500/20">
              <Settings className="h-4 w-4 mr-2" />Configurações
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Receitas ─────────────────────────────────────────────── */}
          <TabsContent value="receitas">
            {revenueLoading && !revenueStats ? (
              <SkeletonStatsGrid count={5} />
            ) : revenueStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
                <StatCard title="Total Recebido" value={formatPrice(revenueStats.totalRevenue)} description="Receitas pagas" icon={CheckCircle2} iconColor="text-green-500" valueColor="text-green-300" />
                <StatCard title="Pendente" value={formatPrice(revenueStats.pendingRevenue)} description="Aguardando pagamento" icon={Clock} iconColor="text-yellow-500" valueColor="text-yellow-300" />
                <StatCard title="Total de Receitas" value={revenueStats.totalRevenues} description="Todas as receitas" icon={DollarSign} iconColor="text-brand-purple" />
                <StatCard title="Pagas" value={revenueStats.paidRevenues} description="Receitas pagas" icon={CheckCircle2} iconColor="text-green-500" />
                <StatCard title="Pendentes" value={revenueStats.pendingRevenues} description="Aguardando pagamento" icon={Clock} iconColor="text-yellow-500" />
              </div>
            ) : null}

            <Tabs value={revenueFilter} onValueChange={setRevenueFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-brand-black/30 border border-brand-purple/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-brand-purple/20">Todas</TabsTrigger>
                <TabsTrigger value="PENDING" className="data-[state=active]:bg-yellow-500/20">Pendentes</TabsTrigger>
                <TabsTrigger value="PAID" className="data-[state=active]:bg-green-500/20">Pagas</TabsTrigger>
                <TabsTrigger value="CANCELLED" className="data-[state=active]:bg-red-500/20">Canceladas</TabsTrigger>
              </TabsList>
              <TabsContent value={revenueFilter} className="mt-6">
                {revenueLoading ? (
                  <SkeletonOrdersList count={3} />
                ) : revenues.length === 0 ? (
                  <EmptyState
                    title="Nenhuma receita encontrada"
                    description={`Não há receitas ${revenueFilter === 'all' ? '' : revenueFilter === 'PENDING' ? 'pendentes' : revenueFilter === 'PAID' ? 'pagas' : 'canceladas'}.`}
                    icon={DollarSign}
                  />
                ) : (
                  <div className="grid gap-4 lg:gap-6">
                    {revenues.map((revenue) => (
                      <Card key={revenue.id} className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
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
                            {getRevenueStatusBadge(revenue.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <OrderInfoItem label="Valor da Receita" value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(revenue.amount)} ({(revenue.percentage * 100).toFixed(0)}%)</span>} />
                            <OrderInfoItem label="Valor Total do Pedido" value={<span className="text-lg font-bold text-brand-purple-light font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(revenue.orderTotal)}</span>} />
                            <OrderInfoItem label="Cliente" value={revenue.order.user.name || revenue.order.user.email} />
                            {revenue.order.booster && <OrderInfoItem label="Booster" value={revenue.order.booster.name || revenue.order.booster.email} />}
                            {revenue.status === 'PAID' && revenue.paidAt && <OrderInfoItem label="Data do Pagamento" value={formatDate(revenue.paidAt)} />}
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
          </TabsContent>

          {/* ── Tab: Configurações ────────────────────────────────────────── */}
          <TabsContent value="configuracoes">
            <Card className="bg-brand-black-light border-brand-purple/20">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <p className="text-brand-gray-300 font-rajdhani text-center max-w-sm">
                  As configurações de comissão foram movidas para uma página dedicada.
                </p>
                <Link href="/admin/commissions">
                  <Button className="bg-brand-purple hover:bg-brand-purple-light text-white">
                    Ir para Gerenciar Comissões
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
