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
  Wallet,
} from 'lucide-react'
import { StatCard } from '@/components/common/stat-card'
import { PaymentStatusBadge } from '@/components/common/payment-status-badge'
import { StatsGrid } from '@/components/common/stats-grid'
import { AdminPageShell } from '@/components/common/admin-page-shell'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { SkeletonRevenueList, SkeletonStatsGrid } from '@/components/common/skeletons'
import { LoadingSwap } from '@/components/common/loading-swap'
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

  const fetchRevenues = useCallback(async () => {
    await withRevenueLoading(async () => {
      try {
        const status = revenueFilter === 'all' ? '' : revenueFilter
        const url = status ? `/api/admin/payments?status=${status}` : '/api/admin/payments'
        const data = await api.get<{ revenues?: typeof revenues; stats?: typeof revenueStats }>(url)
        setRevenues(data.revenues || [])
        setRevenueStats(data.stats || null)
      } catch (error) {
        console.error('Erro ao buscar receitas:', error)
      }
    })
  }, [withRevenueLoading, revenueFilter])

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchRevenues()
  }, [user?.role, fetchRevenues])

  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'ADMIN') return null

  return (
    <AdminPageShell
      highlight="FINANCEIRO"
      title="ADMIN"
      description={`Olá, ${user.name || user.email}! Gerencie receitas e comissões.`}
    >
        <div className="flex justify-end mb-4">
          <Link href="/admin/withdraw">
            <Button variant="outline" className="border-brand-purple/50 text-brand-purple-light hover:bg-brand-purple/10">
              <Wallet className="h-4 w-4 mr-2" />Ver Saques
            </Button>
          </Link>
        </div>

        {revenueLoading && !revenueStats ? (
          <div className="mb-6 lg:mb-8">
            <SkeletonStatsGrid count={5} />
          </div>
        ) : revenueStats ? (
          <StatsGrid columns={5} className="mb-6 lg:mb-8">
            <StatCard title="Total Recebido" value={formatPrice(revenueStats.totalRevenue)} description="Receitas pagas" icon={CheckCircle2} iconColor="text-green-500" valueColor="text-foreground dark:text-green-300" />
            <StatCard title="Pendente" value={formatPrice(revenueStats.pendingRevenue)} description="Aguardando pagamento" icon={Clock} iconColor="text-yellow-500" valueColor="text-foreground dark:text-yellow-300" />
            <StatCard title="Total de Receitas" value={revenueStats.totalRevenues} description="Todas as receitas" icon={DollarSign} iconColor="text-brand-purple" />
            <StatCard title="Pagas" value={revenueStats.paidRevenues} description="Receitas pagas" icon={CheckCircle2} iconColor="text-green-500" />
            <StatCard title="Pendentes" value={revenueStats.pendingRevenues} description="Aguardando pagamento" icon={Clock} iconColor="text-yellow-500" />
          </StatsGrid>
        ) : null}

        <Tabs value={revenueFilter} onValueChange={setRevenueFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
            <TabsTrigger value="all" className="data-[state=active]:bg-brand-purple/20">Todas</TabsTrigger>
            <TabsTrigger value="PENDING" className="data-[state=active]:bg-yellow-500/20">Pendentes</TabsTrigger>
            <TabsTrigger value="PAID" className="data-[state=active]:bg-green-500/20">Pagas</TabsTrigger>
            <TabsTrigger value="CANCELLED" className="data-[state=active]:bg-red-500/20">Canceladas</TabsTrigger>
          </TabsList>
          <TabsContent value={revenueFilter} className="mt-6">
            <LoadingSwap loading={revenueLoading} skeleton={<SkeletonRevenueList count={3} />}>
              {revenues.length === 0 ? (
              <EmptyState
                title="Nenhuma receita encontrada"
                description={`Não há receitas ${revenueFilter === 'all' ? '' : revenueFilter === 'PENDING' ? 'pendentes' : revenueFilter === 'PAID' ? 'pagas' : 'canceladas'}.`}
                icon={DollarSign}
              />
            ) : (
              <div className="grid gap-4 lg:gap-6">
                {revenues.map((revenue) => (
                  <Card key={revenue.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-foreground font-orbitron text-lg mb-2">
                            {revenue.order.service.name}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground font-rajdhani">
                            Pedido #{revenue.order.id}
                          </CardDescription>
                        </div>
                        <PaymentStatusBadge status={revenue.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <OrderInfoItem label="Valor da Receita" value={<span className="text-lg font-bold text-foreground dark:text-green-300 font-orbitron">{formatPrice(revenue.amount)} ({(revenue.percentage * 100).toFixed(0)}%)</span>} />
                        <OrderInfoItem label="Valor Total do Pedido" value={<span className="text-lg font-bold text-brand-purple-light font-orbitron">{formatPrice(revenue.orderTotal)}</span>} />
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
            </LoadingSwap>
          </TabsContent>
        </Tabs>
    </AdminPageShell>
  )
}
