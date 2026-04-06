'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useLoading } from '@/hooks/use-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Wallet,
  RefreshCw,
  Lock,
} from 'lucide-react'
import { StatCard } from '@/components/common/stat-card'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { SkeletonOrdersList, SkeletonStatsGrid } from '@/components/common/skeletons'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'
import { showSuccess, showError } from '@/lib/toast'
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

interface Withdrawal {
  id: number
  amount: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED' | 'CANCELLED'
  pixKeyType: string
  pixKey: string
  createdAt: string
  completedAt: string | null
  receiptUrl: string | null
}

interface LockedCommission {
  id: number
  amount: number
  availableForWithdrawalAt: string
  orderId: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BoosterPaymentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // ── Commissions ──
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<CommissionStats | null>(null)
  const { loading: commissionsLoading, withLoading: withCommissionsLoading } = useLoading({ initialLoading: true })
  const [commissionFilter, setCommissionFilter] = useState('all')

  // ── Withdrawals ──
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [availableBalance, setAvailableBalance] = useState(0)
  const [lockedBalance, setLockedBalance] = useState(0)
  const [lockedCommissions, setLockedCommissions] = useState<LockedCommission[]>([])
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [pixKeyType, setPixKeyType] = useState<string>('')
  const [pixKey, setPixKey] = useState('')

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'BOOSTER') {
      router.replace(user.role === 'ADMIN' ? '/admin' : user.role === 'CLIENT' ? '/dashboard' : '/')
    }
  }, [user, authLoading, router])

  // ── Initial data fetch ──
  useEffect(() => {
    if (user?.role === 'BOOSTER') {
      fetchCommissions()
      fetchWithdrawals()
    }
  }, [user?.id])

  // Re-fetch commissions when filter changes
  useEffect(() => {
    if (user?.role === 'BOOSTER') fetchCommissions()
  }, [commissionFilter])

  // ─── Fetchers ─────────────────────────────────────────────────────────────

  const fetchCommissions = async () => {
    await withCommissionsLoading(async () => {
      try {
        const status = commissionFilter === 'all' ? '' : commissionFilter
        const url = status ? `/api/booster/payments?status=${status}` : '/api/booster/payments'
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setCommissions(data.commissions || [])
          setStats(data.stats || null)
        }
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error)
      }
    })
  }

  const fetchWithdrawals = async () => {
    try {
      setWithdrawLoading(true)
      const response = await fetch('/api/booster/withdraw')
      const data = await response.json()
      if (response.ok) {
        setWithdrawals(data.withdrawals || [])
        setAvailableBalance(data.availableBalance || 0)
        setLockedBalance(data.lockedBalance || 0)
        setLockedCommissions(data.lockedCommissions || [])
      } else {
        showError('Erro ao carregar saques')
      }
    } catch (error) {
      console.error('Erro ao buscar saques:', error)
    } finally {
      setWithdrawLoading(false)
    }
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountInCents = Math.round(parseFloat(amount) * 100)
    if (!amountInCents || amountInCents < 350) { showError('Valor mínimo para saque é R$ 3,50'); return }
    if (amountInCents > availableBalance) { showError('Saldo insuficiente'); return }
    if (!pixKeyType || !pixKey) { showError('Preencha a chave PIX'); return }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/booster/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInCents, pixKeyType, pixKey }),
      })
      const data = await response.json()
      if (response.ok) {
        showSuccess('Saque solicitado com sucesso!')
        setAmount('')
        setPixKey('')
        setPixKeyType('')
        fetchWithdrawals()
      } else {
        showError(data.message || 'Erro ao solicitar saque')
      }
    } catch {
      showError('Erro ao processar solicitação')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getCommissionStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge className="bg-green-500/20 text-green-300 border-green-500/50">Pago</Badge>
      case 'PENDING': return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">Pendente</Badge>
      case 'CANCELLED': return <Badge className="bg-red-500/20 text-red-300 border-red-500/50">Cancelado</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const getWithdrawStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETE': return <Badge className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>
      case 'PENDING': case 'PROCESSING': return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
      case 'FAILED': case 'CANCELLED': return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  }

  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'PENDING' || w.status === 'PROCESSING')

  // ─── Render ───────────────────────────────────────────────────────────────

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
          description={`Olá, ${user.name || user.email}! Visualize suas comissões e gerencie seus saques.`}
        />

        <Tabs defaultValue="comissoes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-brand-black/30 border border-brand-purple/50 mb-6">
            <TabsTrigger value="comissoes" className="data-[state=active]:bg-brand-purple/20">
              <DollarSign className="h-4 w-4 mr-2" />Comissões
            </TabsTrigger>
            <TabsTrigger value="saques" className="data-[state=active]:bg-green-500/20">
              <Wallet className="h-4 w-4 mr-2" />Saques
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Comissões ────────────────────────────────────────────── */}
          <TabsContent value="comissoes">
            {commissionsLoading && !stats ? (
              <SkeletonStatsGrid count={5} />
            ) : stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
                <StatCard title="Total Recebido" value={formatPrice(stats.totalEarnings)} description="Comissões pagas" icon={CheckCircle2} iconColor="text-green-500" valueColor="text-green-300" />
                <StatCard title="Pendente" value={formatPrice(stats.pendingEarnings)} description="Aguardando pagamento" icon={Clock} iconColor="text-yellow-500" valueColor="text-yellow-300" />
                <StatCard title="Total de Comissões" value={stats.totalCommissions} description="Todas as comissões" icon={DollarSign} iconColor="text-brand-purple" />
                <StatCard title="Pagas" value={stats.paidCommissions} description="Comissões pagas" icon={CheckCircle2} iconColor="text-green-500" />
                <StatCard title="Pendentes" value={stats.pendingCommissions} description="Aguardando pagamento" icon={Clock} iconColor="text-yellow-500" />
              </div>
            ) : null}

            <Tabs value={commissionFilter} onValueChange={setCommissionFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-brand-black/30 border border-brand-purple/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-brand-purple/20">Todas</TabsTrigger>
                <TabsTrigger value="PENDING" className="data-[state=active]:bg-yellow-500/20">Pendentes</TabsTrigger>
                <TabsTrigger value="PAID" className="data-[state=active]:bg-green-500/20">Pagas</TabsTrigger>
                <TabsTrigger value="CANCELLED" className="data-[state=active]:bg-red-500/20">Canceladas</TabsTrigger>
              </TabsList>
              <TabsContent value={commissionFilter} className="mt-6">
                {commissionsLoading ? (
                  <SkeletonOrdersList count={3} />
                ) : commissions.length === 0 ? (
                  <EmptyState
                    title="Nenhuma comissão encontrada"
                    description={`Não há comissões ${commissionFilter === 'all' ? '' : commissionFilter === 'PENDING' ? 'pendentes' : commissionFilter === 'PAID' ? 'pagas' : 'canceladas'}.`}
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
                                {commission.order.gameMode || commission.order.serviceType}
                              </CardTitle>
                              <CardDescription className="text-brand-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                                Pedido #{commission.order.id}
                              </CardDescription>
                            </div>
                            {getCommissionStatusBadge(commission.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <OrderInfoItem label="Valor da Comissão" value={<span className="text-lg font-bold text-green-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(commission.amount)} ({(commission.percentage * 100).toFixed(0)}%)</span>} />
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

          {/* ── Tab: Saques ───────────────────────────────────────────────── */}
          <TabsContent value="saques">
            <div className="max-w-4xl space-y-6">
              {/* Saldo disponível e bloqueado */}
              <div className={`grid gap-4 ${lockedBalance > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                <Card className="bg-gradient-to-br from-brand-purple/20 to-brand-purple-dark/10 border-brand-purple/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-brand-purple-light" />
                        <div>
                          <p className="text-gray-400 text-sm font-rajdhani">Saldo Disponível</p>
                          <p className="text-2xl font-bold text-white font-orbitron">
                            {withdrawLoading ? '...' : formatPrice(availableBalance / 100)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={fetchWithdrawals} disabled={withdrawLoading}>
                        <RefreshCw className={`w-4 h-4 ${withdrawLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {lockedBalance > 0 && (
                  <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/40">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Lock className="w-8 h-8 text-yellow-400" />
                        <div>
                          <p className="text-gray-400 text-sm font-rajdhani">Saldo Bloqueado</p>
                          <p className="text-2xl font-bold text-yellow-300 font-orbitron">
                            {formatPrice(lockedBalance / 100)}
                          </p>
                          <p className="text-xs text-yellow-500 font-rajdhani mt-1">Aguardando período de espera</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Comissões bloqueadas */}
              {lockedCommissions.length > 0 && (
                <Card className="bg-brand-black/30 backdrop-blur-md border-yellow-500/30">
                  <CardHeader>
                    <CardTitle className="text-yellow-300 font-orbitron flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Comissões em Período de Espera
                    </CardTitle>
                    <CardDescription className="text-gray-400 font-rajdhani">
                      Estas comissões serão liberadas para saque nas datas abaixo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lockedCommissions.map((commission) => {
                        const releaseDate = new Date(commission.availableForWithdrawalAt)
                        const now = new Date()
                        const diffMs = releaseDate.getTime() - now.getTime()
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
                        return (
                          <div key={commission.id} className="flex items-center justify-between p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                            <div>
                              <p className="text-white font-bold font-orbitron">{formatPrice(commission.amount)}</p>
                              <p className="text-gray-400 text-xs font-rajdhani">Pedido #{commission.orderId}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-yellow-300 text-sm font-medium">
                                {diffDays === 0
                                  ? (diffHours <= 1 ? 'Libera em breve' : `Libera em ${diffHours}h`)
                                  : diffDays === 1 ? 'Libera amanhã' : `Libera em ${diffDays} dias`}
                              </p>
                              <p className="text-gray-500 text-xs font-rajdhani">{formatDate(commission.availableForWithdrawalAt)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Formulário de saque */}
              <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
                <CardHeader>
                  <CardTitle className="text-white font-orbitron">Novo Saque</CardTitle>
                  <CardDescription className="text-gray-400 font-rajdhani">Valor mínimo: R$ 3,50</CardDescription>
                </CardHeader>
                <CardContent>
                  {hasPendingWithdrawal ? (
                    <Alert className="bg-yellow-500/10 border-yellow-500/30">
                      <AlertDescription className="text-yellow-300">
                        Você já tem um saque pendente. Aguarde a conclusão para solicitar outro.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-white">Valor (R$)</Label>
                        <Input id="amount" type="number" step="0.01" min="3.50" max={availableBalance / 100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="bg-brand-black/50 border-brand-purple/50 text-white" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pixKeyType" className="text-white">Tipo de Chave PIX</Label>
                        <Select value={pixKeyType} onValueChange={setPixKeyType}>
                          <SelectTrigger className="bg-brand-black/50 border-brand-purple/50 text-white">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CPF">CPF</SelectItem>
                            <SelectItem value="CNPJ">CNPJ</SelectItem>
                            <SelectItem value="EMAIL">E-mail</SelectItem>
                            <SelectItem value="PHONE">Celular</SelectItem>
                            <SelectItem value="RANDOM">Chave Aleatória</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pixKey" className="text-white">Chave PIX</Label>
                        <Input id="pixKey" type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Digite sua chave PIX" className="bg-brand-black/50 border-brand-purple/50 text-white" required />
                      </div>
                      <Button type="submit" className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-bold" disabled={isSubmitting || availableBalance < 350}>
                        {isSubmitting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processando...</> : 'Solicitar Saque'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de saques */}
              <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
                <CardHeader>
                  <CardTitle className="text-white font-orbitron">Histórico de Saques</CardTitle>
                </CardHeader>
                <CardContent>
                  {withdrawLoading ? (
                    <div className="flex items-center justify-center py-8 text-gray-400 gap-3">
                      <RefreshCw className="w-5 h-5 animate-spin" />Carregando...
                    </div>
                  ) : withdrawals.length === 0 ? (
                    <p className="text-gray-400 text-center py-8 font-rajdhani">Nenhum saque realizado ainda.</p>
                  ) : (
                    <div className="space-y-4">
                      {withdrawals.map((withdrawal) => (
                        <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-brand-purple/20">
                          <div>
                            <p className="text-white font-bold">{formatPrice(withdrawal.amount / 100)}</p>
                            <p className="text-gray-400 text-sm font-rajdhani">{withdrawal.pixKeyType}: {withdrawal.pixKey.substring(0, 10)}...</p>
                            <p className="text-gray-500 text-xs font-rajdhani">{formatDate(withdrawal.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            {getWithdrawStatusBadge(withdrawal.status)}
                            {withdrawal.receiptUrl && withdrawal.status === 'COMPLETE' && (
                              <a href={withdrawal.receiptUrl} target="_blank" rel="noopener noreferrer" className="block text-brand-purple-light text-xs mt-1 hover:underline">
                                Ver comprovante
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  )
}
