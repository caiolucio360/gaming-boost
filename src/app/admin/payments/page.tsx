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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
  Settings,
  Save,
  AlertCircle,
  Percent,
} from 'lucide-react'
import { StatCard } from '@/components/common/stat-card'
import { PageHeader } from '@/components/common/page-header'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { EmptyState } from '@/components/common/empty-state'
import { OrdersListSkeleton, StatsGridSkeleton, ProfileSkeleton } from '@/components/common/loading-skeletons'
import { OrderInfoItem } from '@/components/common/order-info-item'
import { formatPrice, formatDate } from '@/lib/utils'
import { showSuccess, showError } from '@/lib/toast'
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

interface CommissionConfig {
  id: number
  boosterPercentage: number
  adminPercentage: number
  withdrawalWaitingDays: number
  enabled: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // ── Revenues ──
  const [revenues, setRevenues] = useState<Revenue[]>([])
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const { loading: revenueLoading, withLoading: withRevenueLoading } = useLoading({ initialLoading: true })
  const [revenueFilter, setRevenueFilter] = useState('all')

  // ── Withdrawals ──
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [availableBalance, setAvailableBalance] = useState(0)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [pixKeyType, setPixKeyType] = useState<string>('')
  const [pixKey, setPixKey] = useState('')

  // ── Commission config ──
  const { loading: configLoading, withLoading: withConfigLoading } = useLoading({ initialLoading: true })
  const [config, setConfig] = useState<CommissionConfig | null>(null)
  const [boosterPercentage, setBoosterPercentage] = useState('70')
  const [adminPercentage, setAdminPercentage] = useState('30')
  const [withdrawalWaitingDays, setWithdrawalWaitingDays] = useState('7')
  const [saving, setSaving] = useState(false)
  const [configAlert, setConfigAlert] = useState<{
    title: string; description: string; variant: 'default' | 'destructive'
  } | null>(null)

  // ── Auth guard ──
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user && user.role !== 'ADMIN') {
      router.replace(user.role === 'BOOSTER' ? '/booster' : user.role === 'CLIENT' ? '/dashboard' : '/')
    }
  }, [user, authLoading, router])

  // ── Initial data fetch ──
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchRevenues()
      fetchWithdrawals()
      fetchCommissionConfig()
    }
  }, [user?.id])

  // Re-fetch revenues when filter changes
  useEffect(() => {
    if (user?.role === 'ADMIN') fetchRevenues()
  }, [revenueFilter])

  // ─── Fetchers ─────────────────────────────────────────────────────────────

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

  const fetchWithdrawals = async () => {
    try {
      setWithdrawLoading(true)
      const response = await fetch('/api/admin/withdraw')
      const data = await response.json()
      if (response.ok) {
        setWithdrawals(data.withdrawals || [])
        setAvailableBalance(data.availableBalance || 0)
      } else {
        showError('Erro ao carregar saques')
      }
    } catch (error) {
      console.error('Erro ao buscar saques:', error)
    } finally {
      setWithdrawLoading(false)
    }
  }

  const fetchCommissionConfig = async () => {
    await withConfigLoading(async () => {
      try {
        const response = await fetch('/api/admin/commission-config')
        if (response.ok) {
          const data = await response.json()
          setConfig(data.config)
          setBoosterPercentage((data.config.boosterPercentage * 100).toFixed(0))
          setAdminPercentage((data.config.adminPercentage * 100).toFixed(0))
          setWithdrawalWaitingDays(String(data.config.withdrawalWaitingDays ?? 7))
        }
      } catch (error) {
        console.error('Erro ao buscar configuração:', error)
      }
    })
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
      const response = await fetch('/api/admin/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInCents, pixKeyType, pixKey }),
      })
      const data = await response.json()
      if (response.ok) {
        showSuccess('Saque solicitado com sucesso!')
        setAmount('')
        setPixKey('')
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

  const handleSaveConfig = async () => {
    setSaving(true)
    setConfigAlert(null)
    const booster = parseFloat(boosterPercentage)
    const admin = parseFloat(adminPercentage)
    const waitingDays = parseInt(withdrawalWaitingDays, 10)

    if (isNaN(booster) || isNaN(admin)) {
      setConfigAlert({ title: 'Erro', description: 'Porcentagens devem ser números válidos', variant: 'destructive' })
      setSaving(false); return
    }
    if (booster < 0 || booster > 100 || admin < 0 || admin > 100) {
      setConfigAlert({ title: 'Erro', description: 'Porcentagens devem estar entre 0 e 100', variant: 'destructive' })
      setSaving(false); return
    }
    if (Math.abs(booster + admin - 100) > 0.01) {
      setConfigAlert({ title: 'Erro', description: 'A soma das porcentagens deve ser 100%', variant: 'destructive' })
      setSaving(false); return
    }
    if (isNaN(waitingDays) || waitingDays < 0) {
      setConfigAlert({ title: 'Erro', description: 'Período de espera deve ser um número inteiro não negativo', variant: 'destructive' })
      setSaving(false); return
    }

    try {
      const response = await fetch('/api/admin/commission-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boosterPercentage: booster / 100, adminPercentage: admin / 100, withdrawalWaitingDays: waitingDays }),
      })
      const data = await response.json()
      if (response.ok) {
        setConfig(data.config)
        showSuccess('Configuração atualizada com sucesso!')
      } else {
        showError(data.message || 'Erro ao atualizar configuração')
      }
    } catch {
      showError('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getRevenueStatusBadge = (status: string) => {
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
  const percentSum = parseFloat(boosterPercentage) + parseFloat(adminPercentage)

  // ─── Render ───────────────────────────────────────────────────────────────

  if (authLoading) return <LoadingSpinner />
  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen bg-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-7xl mx-auto">
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
          description={`Olá, ${user.name || user.email}! Gerencie receitas, saques e comissões.`}
        />

        <Tabs defaultValue="receitas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-brand-black/30 border border-brand-purple/50 mb-6">
            <TabsTrigger value="receitas" className="data-[state=active]:bg-brand-purple/20">
              <DollarSign className="h-4 w-4 mr-2" />Receitas
            </TabsTrigger>
            <TabsTrigger value="saques" className="data-[state=active]:bg-green-500/20">
              <Wallet className="h-4 w-4 mr-2" />Saques
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="data-[state=active]:bg-amber-500/20">
              <Settings className="h-4 w-4 mr-2" />Configurações
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Receitas ─────────────────────────────────────────────── */}
          <TabsContent value="receitas">
            {revenueLoading && !revenueStats ? (
              <StatsGridSkeleton count={5} />
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
                  <OrdersListSkeleton count={3} />
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

          {/* ── Tab: Saques ───────────────────────────────────────────────── */}
          <TabsContent value="saques">
            <div className="max-w-4xl space-y-6">
              {/* Saldo disponível */}
              <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-8 h-8 text-green-400" />
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

              {/* Formulário de saque */}
              <Card className="bg-black/30 backdrop-blur-md border-green-500/50">
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
                        <Input id="amount" type="number" step="0.01" min="3.50" max={availableBalance / 100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="bg-black/50 border-green-500/50 text-white" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pixKeyType" className="text-white">Tipo de Chave PIX</Label>
                        <Select value={pixKeyType} onValueChange={setPixKeyType}>
                          <SelectTrigger className="bg-black/50 border-green-500/50 text-white">
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
                        <Input id="pixKey" type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Digite sua chave PIX" className="bg-black/50 border-green-500/50 text-white" required />
                      </div>
                      <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold" disabled={isSubmitting || availableBalance < 350}>
                        {isSubmitting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processando...</> : 'Solicitar Saque'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de saques */}
              <Card className="bg-black/30 backdrop-blur-md border-green-500/50">
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
                        <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-green-500/20">
                          <div>
                            <p className="text-white font-bold">{formatPrice(withdrawal.amount / 100)}</p>
                            <p className="text-gray-400 text-sm font-rajdhani">{withdrawal.pixKeyType}: {withdrawal.pixKey.substring(0, 10)}...</p>
                            <p className="text-gray-500 text-xs font-rajdhani">{formatDate(withdrawal.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            {getWithdrawStatusBadge(withdrawal.status)}
                            {withdrawal.receiptUrl && withdrawal.status === 'COMPLETE' && (
                              <a href={withdrawal.receiptUrl} target="_blank" rel="noopener noreferrer" className="block text-green-400 text-xs mt-1 hover:underline">
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

          {/* ── Tab: Configurações ────────────────────────────────────────── */}
          <TabsContent value="configuracoes">
            <div className="max-w-4xl">
              {configAlert && (
                <Alert variant={configAlert.variant} className="mb-6">
                  {configAlert.variant === 'default' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{configAlert.title}</AlertTitle>
                  <AlertDescription>{configAlert.description}</AlertDescription>
                </Alert>
              )}

              {configLoading ? (
                <ProfileSkeleton />
              ) : (
                <Card className="bg-brand-black/30 border-brand-purple/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="h-5 w-5 text-brand-purple-light" />
                      Porcentagens de Comissão
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure como o valor dos pedidos será distribuído entre boosters e administradores
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="boosterPercentage" className="text-gray-400 flex items-center gap-2">
                          <Percent className="h-4 w-4" />Porcentagem do Booster (%)
                        </Label>
                        <Input
                          id="boosterPercentage"
                          type="number" min="0" max="100" step="0.1" placeholder="70"
                          value={boosterPercentage}
                          onChange={(e) => {
                            setBoosterPercentage(e.target.value)
                            const b = parseFloat(e.target.value)
                            if (!isNaN(b) && b >= 0 && b <= 100) setAdminPercentage((100 - b).toFixed(1))
                          }}
                          className="bg-brand-black/50 border-brand-purple/50 text-white text-lg font-bold"
                        />
                        <p className="text-xs text-gray-500">Valor que o booster receberá por cada pedido concluído</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPercentage" className="text-gray-400 flex items-center gap-2">
                          <Percent className="h-4 w-4" />Porcentagem do Admin (%)
                        </Label>
                        <Input
                          id="adminPercentage"
                          type="number" min="0" max="100" step="0.1" placeholder="30"
                          value={adminPercentage}
                          onChange={(e) => {
                            setAdminPercentage(e.target.value)
                            const a = parseFloat(e.target.value)
                            if (!isNaN(a) && a >= 0 && a <= 100) setBoosterPercentage((100 - a).toFixed(1))
                          }}
                          className="bg-brand-black/50 border-brand-purple/50 text-white text-lg font-bold"
                        />
                        <p className="text-xs text-gray-500">Valor que o administrador receberá por cada pedido concluído</p>
                      </div>
                    </div>

                    <div className="p-4 bg-brand-purple/10 border border-brand-purple/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Soma das porcentagens:</span>
                        <span className={`text-lg font-bold ${Math.abs(percentSum - 100) < 0.01 ? 'text-green-300' : 'text-red-300'}`}>
                          {percentSum.toFixed(1)}%
                        </span>
                      </div>
                      {Math.abs(percentSum - 100) >= 0.01 && (
                        <p className="text-xs text-red-400 mt-2">A soma deve ser exatamente 100%</p>
                      )}
                    </div>

                    {config && (
                      <div className="p-4 bg-brand-black/50 border border-brand-purple/30 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Exemplo de cálculo (pedido de R$ 100,00):</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Booster receberá:</p>
                            <p className="text-green-300 font-bold">R$ {(100 * parseFloat(boosterPercentage) / 100).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Admin receberá:</p>
                            <p className="text-brand-purple-light font-bold">R$ {(100 * parseFloat(adminPercentage) / 100).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-brand-purple/30 space-y-2">
                      <Label htmlFor="withdrawalWaitingDays" className="text-gray-400 flex items-center gap-2">
                        <Clock className="h-4 w-4" />Período de Espera para Saque (dias)
                      </Label>
                      <Input
                        id="withdrawalWaitingDays"
                        type="number" min="0" step="1" placeholder="7"
                        value={withdrawalWaitingDays}
                        onChange={(e) => setWithdrawalWaitingDays(e.target.value)}
                        className="bg-brand-black/50 border-brand-purple/50 text-white text-lg font-bold max-w-xs"
                      />
                      <p className="text-xs text-gray-500">
                        Quantos dias após a conclusão de um pedido o booster deve aguardar para sacar a comissão.
                        Use <span className="text-brand-purple-light font-medium">0</span> para liberação imediata.
                      </p>
                    </div>

                    <Button
                      onClick={handleSaveConfig}
                      disabled={saving || Math.abs(percentSum - 100) >= 0.01}
                      className="w-full bg-brand-purple text-white border border-transparent hover:border-white/50"
                    >
                      {saving ? <><span className="animate-spin mr-2">⏳</span>Salvando...</> : <><Save className="h-4 w-4 mr-2" />Salvar Configuração</>}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
