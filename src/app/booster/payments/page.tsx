'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { api } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Wallet,
} from 'lucide-react'
import { StatCard } from '@/components/common/stat-card'
import { PaymentStatusBadge } from '@/components/common/payment-status-badge'
import { StatsGrid } from '@/components/common/stats-grid'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { SkeletonRevenueList, SkeletonStatsGrid } from '@/components/common/skeletons'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

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
    serviceType: string
    gameMode: string | null
    currentRating: number | null
    targetRating: number | null
    user: { id: number; email: string; name: string | null }
  }
}

interface CommissionStats {
  totalEarnings: number
  pendingEarnings: number
  totalCommissions: number
  paidCommissions: number
  pendingCommissions: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BoosterPaymentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<CommissionStats | null>(null)
  const { loading: commissionsLoading, withLoading: withCommissionsLoading } = useLoading({ initialLoading: true })
  const [commissionFilter, setCommissionFilter] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'BOOSTER') {
      router.replace(user.role === 'ADMIN' ? '/admin' : user.role === 'CLIENT' ? '/dashboard' : '/')
    }
  }, [user, authLoading, router])

  const fetchCommissions = useCallback(async () => {
    await withCommissionsLoading(async () => {
      try {
        const status = commissionFilter === 'all' ? '' : commissionFilter
        const url = status ? `/api/booster/payments?status=${status}` : '/api/booster/payments'
        const data = await api.get<{ commissions?: typeof commissions; stats?: typeof stats }>(url)
        setCommissions(data.commissions || [])
        setStats(data.stats || null)
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error)
      }
    })
  }, [withCommissionsLoading, commissionFilter])

  useEffect(() => {
    if (user?.role === 'BOOSTER') fetchCommissions()
  }, [user?.role, fetchCommissions])

  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'BOOSTER') return null

  return (
    <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
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
          description={`Olá, ${user.name || user.email}! Visualize suas comissões.`}
        />

        <div className="flex justify-end mb-4">
          <Link href="/booster/withdraw">
            <Button variant="outline" className="border-brand-purple/50 text-brand-purple-light hover:bg-brand-purple/10">
              <Wallet className="h-4 w-4 mr-2" />Ver Saques
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="comissoes" className="w-full">
          <TabsList className="grid w-full grid-cols-1 bg-background/30 border border-brand-purple/50 mb-6">
            <TabsTrigger value="comissoes" className="data-[state=active]:bg-brand-purple/20">
              <DollarSign className="h-4 w-4 mr-2" />Comissões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comissoes">
            {commissionsLoading && !stats ? (
              <div className="mb-6 lg:mb-8">
                <SkeletonStatsGrid count={5} />
              </div>
            ) : stats ? (
              <StatsGrid columns={5} className="mb-6 lg:mb-8">
                <StatCard title="Total Recebido" value={formatPrice(stats.totalEarnings)} description="Comissões pagas" icon={CheckCircle2} iconColor="text-green-500" valueColor="text-foreground dark:text-green-300" />
                <StatCard title="Pendente" value={formatPrice(stats.pendingEarnings)} description="Aguardando pagamento" icon={Clock} iconColor="text-yellow-500" valueColor="text-foreground dark:text-yellow-300" />
                <StatCard title="Total de Comissões" value={stats.totalCommissions} description="Todas as comissões" icon={DollarSign} iconColor="text-brand-purple" />
                <StatCard title="Pagas" value={stats.paidCommissions} description="Comissões pagas" icon={CheckCircle2} iconColor="text-green-500" />
                <StatCard title="Pendentes" value={stats.pendingCommissions} description="Aguardando pagamento" icon={Clock} iconColor="text-yellow-500" />
              </StatsGrid>
            ) : null}

            <Tabs value={commissionFilter} onValueChange={setCommissionFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-background/30 border border-brand-purple/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-brand-purple/20">Todas</TabsTrigger>
                <TabsTrigger value="PENDING" className="data-[state=active]:bg-yellow-500/20">Pendentes</TabsTrigger>
                <TabsTrigger value="PAID" className="data-[state=active]:bg-green-500/20">Pagas</TabsTrigger>
                <TabsTrigger value="CANCELLED" className="data-[state=active]:bg-red-500/20">Canceladas</TabsTrigger>
              </TabsList>
              <TabsContent value={commissionFilter} className="mt-6">
                {commissionsLoading ? (
                  <SkeletonRevenueList count={3} />
                ) : commissions.length === 0 ? (
                  <EmptyState
                    title="Nenhuma comissão encontrada"
                    description={`Não há comissões ${commissionFilter === 'all' ? '' : commissionFilter === 'PENDING' ? 'pendentes' : commissionFilter === 'PAID' ? 'pagas' : 'canceladas'}.`}
                    icon={DollarSign}
                  />
                ) : (
                  <div className="grid gap-4 lg:gap-6">
                    {commissions.map((commission) => (
                      <Card key={commission.id} className="bg-background/30 backdrop-blur-md border-brand-purple/50">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-foreground font-orbitron mb-2">
                                {commission.order.gameMode || commission.order.serviceType}
                              </CardTitle>
                              <CardDescription className="text-muted-foreground font-rajdhani">
                                Pedido #{commission.order.id}
                              </CardDescription>
                            </div>
                            <PaymentStatusBadge status={commission.status} />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <OrderInfoItem label="Valor da Comissão" value={<span className="text-lg font-bold text-foreground dark:text-green-300 font-orbitron">{formatPrice(commission.amount)} ({(commission.percentage * 100).toFixed(0)}%)</span>} />
                            <OrderInfoItem label="Cliente" value={commission.order.user.name || commission.order.user.email} />
                            {commission.status === 'PAID' && commission.paidAt && <OrderInfoItem label="Data do Pagamento" value={formatDate(commission.paidAt)} />}
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
          </TabsContent>
        </Tabs>
    </div>
  )
}
