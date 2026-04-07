// src/components/common/withdraw-content.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Wallet, RefreshCw, Clock, CheckCircle2, XCircle, Lock } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { showSuccess, showError } from '@/lib/toast'

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

interface WithdrawContentProps {
  /** API base path: '/api/booster/withdraw' or '/api/admin/withdraw' */
  apiBasePath: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETE':
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle2 className="w-3 h-3 mr-1" />Concluído</Badge>
    case 'PENDING':
    case 'PROCESSING':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>
    case 'FAILED':
    case 'CANCELLED':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function WithdrawContent({ apiBasePath }: WithdrawContentProps) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [availableBalance, setAvailableBalance] = useState(0)
  const [lockedBalance, setLockedBalance] = useState(0)
  const [lockedCommissions, setLockedCommissions] = useState<LockedCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState('')
  const [pixKeyType, setPixKeyType] = useState('')
  const [pixKey, setPixKey] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(apiBasePath)
      const data = await res.json()
      if (res.ok) {
        setWithdrawals(data.withdrawals || [])
        setAvailableBalance(data.availableBalance || 0)
        setLockedBalance(data.lockedBalance || 0)
        setLockedCommissions(data.lockedCommissions || [])
      } else {
        showError(data.message || 'Erro ao carregar saques')
      }
    } catch {
      showError('Erro ao carregar saques')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [apiBasePath])

  const hasPendingWithdrawal = withdrawals.some(
    (w) => w.status === 'PENDING' || w.status === 'PROCESSING'
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountInCents = Math.round(parseFloat(amount) * 100)
    if (!amountInCents || amountInCents < 350) { showError('Valor mínimo para saque é R$ 3,50'); return }
    if (amountInCents > availableBalance) { showError('Saldo insuficiente'); return }
    if (!pixKeyType || !pixKey) { showError('Preencha a chave PIX'); return }

    try {
      setIsSubmitting(true)
      const res = await fetch(apiBasePath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInCents, pixKeyType, pixKey }),
      })
      const data = await res.json()
      if (res.ok) {
        showSuccess('Saque solicitado com sucesso!')
        setAmount('')
        setPixKey('')
        setPixKeyType('')
        fetchData()
      } else {
        showError(data.message || 'Erro ao solicitar saque')
      }
    } catch {
      showError('Erro ao processar solicitação')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Balance cards */}
      <div className={`grid gap-4 ${lockedBalance > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        <Card className="bg-gradient-to-br from-brand-purple/20 to-brand-purple-dark/10 border-brand-purple/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-brand-purple-light" />
                <div>
                  <p className="text-gray-400 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Saldo Disponível</p>
                  <p className="text-2xl font-bold text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {loading ? '...' : formatPrice(availableBalance / 100)}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
                  <p className="text-gray-400 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Saldo Bloqueado</p>
                  <p className="text-2xl font-bold text-yellow-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {formatPrice(lockedBalance / 100)}
                  </p>
                  <p className="text-xs text-yellow-500 font-rajdhani mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Aguardando período de espera</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Locked commissions */}
      {lockedCommissions.length > 0 && (
        <Card className="bg-brand-black/30 backdrop-blur-md border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-yellow-300 font-orbitron flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <Clock className="w-5 h-5" />Comissões em Período de Espera
            </CardTitle>
            <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Estas comissões serão liberadas para saque nas datas abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lockedCommissions.map((commission) => {
                const releaseDate = new Date(commission.availableForWithdrawalAt)
                const diffMs = releaseDate.getTime() - Date.now()
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
                return (
                  <div key={commission.id} className="flex items-center justify-between p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                    <div>
                      <p className="text-white font-bold font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>{formatPrice(commission.amount)}</p>
                      <p className="text-gray-400 text-xs font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Pedido #{commission.orderId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-300 text-sm font-medium">
                        {diffDays === 0
                          ? (diffHours <= 1 ? 'Libera em breve' : `Libera em ${diffHours}h`)
                          : diffDays === 1 ? 'Libera amanhã' : `Libera em ${diffDays} dias`}
                      </p>
                      <p className="text-gray-500 text-xs font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{formatDate(commission.availableForWithdrawalAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdrawal form */}
      <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
        <CardHeader>
          <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>Novo Saque</CardTitle>
          <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Valor mínimo: R$ 3,50</CardDescription>
        </CardHeader>
        <CardContent>
          {hasPendingWithdrawal ? (
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertDescription className="text-yellow-300">
                Você já tem um saque pendente. Aguarde a conclusão para solicitar outro.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Valor (R$)</Label>
                <Input type="number" step="0.01" min="3.50" max={availableBalance / 100} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="bg-brand-black/50 border-brand-purple/50 text-white" required />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Tipo de Chave PIX</Label>
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
                <Label className="text-white">Chave PIX</Label>
                <Input type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="Digite sua chave PIX" className="bg-brand-black/50 border-brand-purple/50 text-white" required />
              </div>
              <Button type="submit" className="w-full bg-brand-purple hover:bg-brand-purple-dark text-white font-bold" disabled={isSubmitting || availableBalance < 350}>
                {isSubmitting ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processando...</> : 'Solicitar Saque'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal history */}
      <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
        <CardHeader>
          <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>Histórico de Saques</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-400 gap-3">
              <RefreshCw className="w-5 h-5 animate-spin" />Carregando...
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="text-gray-400 text-center py-8 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Nenhum saque realizado ainda.</p>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-brand-purple/20">
                  <div>
                    <p className="text-white font-bold">{formatPrice(w.amount / 100)}</p>
                    <p className="text-gray-400 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{w.pixKeyType}: {w.pixKey.substring(0, 10)}...</p>
                    <p className="text-gray-500 text-xs font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{formatDate(w.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(w.status)}
                    {w.receiptUrl && w.status === 'COMPLETE' && (
                      <a href={w.receiptUrl} target="_blank" rel="noopener noreferrer" className="block text-brand-purple-light text-xs mt-1 hover:underline">
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
  )
}
