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
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface Stats {
  users: { total: number; clients: number; boosters: number; admins: number }
  orders: { total: number; pending: number; inProgress: number; completed: number; cancelled: number }
  revenue: { total: number; devRevenue?: number }
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

interface ChartData {
  timeSeries: { day: string; receita: number; pedidos: number }[]
  userSeries: { day: string; usuarios: number }[]
  statusChart: { name: string; value: number; color: string }[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#1A1A1A',
  border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: '8px',
  color: '#fff',
  fontFamily: 'Rajdhani, sans-serif',
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const { loading, withLoading } = useLoading({ initialLoading: true })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'ADMIN') {
      router.replace(user.role === 'CLIENT' ? '/dashboard' : user.role === 'BOOSTER' ? '/booster' : '/')
    } else if (user && user.role === 'ADMIN') {
      fetchAll()
    }
  }, [user, authLoading, router])

  const fetchAll = async () => {
    await withLoading(async () => {
      const [statsRes, chartRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch('/api/admin/charts', { cache: 'no-store' }),
      ])
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      } else {
        setError('Erro ao buscar estatísticas')
      }
      if (chartRes.ok) {
        setChartData(await chartRes.json())
      }
    })
  }

  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 xl:px-12">
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

      {/* Stat cards */}
      {loading && !stats ? (
        <SkeletonStatsGrid count={4} />
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            <StatCard title="Total de Usuários" value={stats.users.total}
              description={`${stats.users.clients} clientes · ${stats.users.boosters} boosters · ${stats.users.admins} admins`}
              icon={Users} />
            <StatCard title="Total de Pedidos" value={stats.orders.total}
              description={`${stats.orders.pending} pendentes · ${stats.orders.completed} concluídos`}
              icon={ShoppingCart} />
            <StatCard title="Receita Total" value={formatPrice(stats.revenue.total)}
              description="Pedidos concluídos" icon={DollarSign} valueColor="text-brand-purple-light" />
            {stats.isDevAdmin && (
              <StatCard title="Receita Dev" value={formatPrice(stats.revenue.devRevenue || 0)}
                description="Sua comissão (10%)" icon={DollarSign} valueColor="text-amber-400" />
            )}
          </div>

          {/* Pending alert */}
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

          {/* Charts */}
          {chartData && (
            <div className="space-y-6 mb-6">

              {/* Revenue area chart */}
              <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
                <CardHeader>
                  <CardTitle className="text-white font-orbitron text-base">Receita — últimos 30 dias</CardTitle>
                  <CardDescription className="text-brand-gray-500 font-rajdhani">Valor dos pedidos concluídos por dia (R$)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={chartData.timeSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false}
                        interval={4} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false}
                        tickFormatter={(v) => `R$${v}`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE}
                        formatter={(v) => [`R$ ${Number(v).toFixed(2)}`, 'Receita']} />
                      <Area type="monotone" dataKey="receita" stroke="#7C3AED" strokeWidth={2}
                        fill="url(#gradReceita)" dot={false} activeDot={{ r: 4, fill: '#A855F7' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Orders + Users row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Orders per day bar chart */}
                <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
                  <CardHeader>
                    <CardTitle className="text-white font-orbitron text-base">Pedidos por dia</CardTitle>
                    <CardDescription className="text-brand-gray-500 font-rajdhani">Novos pedidos nos últimos 30 dias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData.timeSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false}
                          interval={4} />
                        <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false}
                          allowDecimals={false} />
                        <Tooltip contentStyle={TOOLTIP_STYLE}
                          formatter={(v) => [v, 'Pedidos']} />
                        <Bar dataKey="pedidos" fill="#7C3AED" radius={[3, 3, 0, 0]}
                          activeBar={{ fill: '#A855F7' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Status donut */}
                <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
                  <CardHeader>
                    <CardTitle className="text-white font-orbitron text-base">Status dos pedidos</CardTitle>
                    <CardDescription className="text-brand-gray-500 font-rajdhani">Distribuição geral por status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {chartData.statusChart.length === 0 ? (
                      <div className="h-[200px] flex items-center justify-center text-brand-gray-500 font-rajdhani text-sm">
                        Nenhum pedido registrado
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="55%" height={200}>
                          <PieChart>
                            <Pie data={chartData.statusChart} cx="50%" cy="50%"
                              innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                              {chartData.statusChart.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={TOOLTIP_STYLE}
                              formatter={(v, _name, props) => [v, (props as { payload?: { name: string } }).payload?.name ?? '']} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                          {chartData.statusChart.map((s) => (
                            <div key={s.name} className="flex items-center justify-between text-sm font-rajdhani">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                <span className="text-brand-gray-300">{s.name}</span>
                              </div>
                              <span className="text-white font-medium">{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* New users bar chart */}
              <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
                <CardHeader>
                  <CardTitle className="text-white font-orbitron text-base">Novos usuários — últimos 30 dias</CardTitle>
                  <CardDescription className="text-brand-gray-500 font-rajdhani">Cadastros por dia</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData.userSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false}
                        interval={4} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false}
                        allowDecimals={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE}
                        formatter={(v) => [v, 'Novos usuários']} />
                      <Bar dataKey="usuarios" fill="#10B981" radius={[3, 3, 0, 0]}
                        activeBar={{ fill: '#34D399' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

            </div>
          )}

          {/* Recent orders */}
          <Card className="bg-brand-black-light/30 backdrop-blur-md border-brand-purple/50">
            <CardHeader>
              <CardTitle className="text-white font-orbitron">Pedidos Recentes</CardTitle>
              <CardDescription className="text-brand-gray-500 font-rajdhani">Últimos 5 pedidos criados</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentOrders.length === 0 ? (
                <div className="py-8">
                  <EmptyState title="Nenhum pedido encontrado"
                    description="Ainda não há pedidos registrados na plataforma." icon={ShoppingCart} />
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.recentOrders.map((order) => {
                    const statusConfigs: Record<string, { label: string; color: string; icon: typeof Clock }> = {
                      PENDING:     { label: 'Pendente',     color: 'bg-amber-500/20 text-amber-300 border-amber-500/50',            icon: Clock },
                      IN_PROGRESS: { label: 'Em Progresso', color: 'bg-brand-purple/20 text-brand-purple-light border-brand-purple/50', icon: Loader2 },
                      COMPLETED:   { label: 'Concluído',    color: 'bg-green-500/20 text-emerald-300 border-green-500/50',           icon: CheckCircle2 },
                      CANCELLED:   { label: 'Cancelado',    color: 'bg-red-500/20 text-red-300 border-red-500/50',                  icon: XCircle },
                    }
                    const statusInfo = statusConfigs[order.status] || statusConfigs.PENDING
                    const StatusIcon = statusInfo.icon
                    return (
                      <div key={order.id}
                        className="flex items-center justify-between p-4 bg-brand-black-light/50 rounded-lg border border-brand-purple/20 hover:border-brand-purple-light/60 hover:scale-[1.01] transition-all duration-300">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="text-white font-rajdhani font-bold">{order.service.name}</p>
                            <Badge className={`${statusInfo.color} border font-rajdhani flex items-center gap-1`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-brand-gray-500 font-rajdhani">
                            {order.user.name || order.user.email} · {order.service.game} · {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-brand-purple-light font-orbitron">{formatPrice(order.total)}</p>
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
