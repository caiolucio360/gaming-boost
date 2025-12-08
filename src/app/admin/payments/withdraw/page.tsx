'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Wallet, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { showSuccess, showError } from '@/lib/toast'
import { formatPrice, formatDate } from '@/lib/utils'

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

interface Stats {
  totalWithdrawals: number
  pendingWithdrawals: number
  completedWithdrawals: number
  totalWithdrawn: number
}

export default function AdminWithdrawPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [amount, setAmount] = useState('')
  const [pixKeyType, setPixKeyType] = useState<string>('')
  const [pixKey, setPixKey] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchWithdrawals()
    }
  }, [user])

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/withdraw')
      const data = await response.json()

      if (response.ok) {
        setWithdrawals(data.withdrawals || [])
        setStats(data.stats || null)
        setAvailableBalance(data.availableBalance || 0)
      } else {
        showError('Erro ao carregar saques')
      }
    } catch (error) {
      console.error('Erro ao buscar saques:', error)
      showError('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amountInCents = Math.round(parseFloat(amount) * 100)

    if (!amountInCents || amountInCents < 350) {
      showError('Valor mínimo para saque é R$ 3,50')
      return
    }

    if (amountInCents > availableBalance) {
      showError('Saldo insuficiente')
      return
    }

    if (!pixKeyType || !pixKey) {
      showError('Preencha a chave PIX')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInCents,
          pixKeyType,
          pixKey,
        }),
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
    } catch (error) {
      console.error('Erro ao solicitar saque:', error)
      showError('Erro ao processar solicitação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          Carregando...
        </div>
      </div>
    )
  }

  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'PENDING' || w.status === 'PROCESSING')

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/payments" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white font-orbitron">Solicitar Saque</h1>
            <p className="text-gray-400 font-rajdhani">Transfira suas receitas para sua conta</p>
          </div>
        </div>

        {/* Saldo disponível */}
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-gray-400 text-sm font-rajdhani">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-white font-orbitron">
                    {formatPrice(availableBalance / 100)}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchWithdrawals}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de saque */}
        <Card className="bg-black/30 backdrop-blur-md border-green-500/50">
          <CardHeader>
            <CardTitle className="text-white font-orbitron">Novo Saque</CardTitle>
            <CardDescription className="text-gray-400 font-rajdhani">
              Valor mínimo: R$ 3,50
            </CardDescription>
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
                  <Label htmlFor="amount" className="text-white">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="3.50"
                    max={availableBalance / 100}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="bg-black/50 border-green-500/50 text-white"
                    required
                  />
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
                  <Input
                    id="pixKey"
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Digite sua chave PIX"
                    className="bg-black/50 border-green-500/50 text-white"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
                  disabled={isSubmitting || availableBalance < 350}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Solicitar Saque'
                  )}
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
            {withdrawals.length === 0 ? (
              <p className="text-gray-400 text-center py-8 font-rajdhani">
                Nenhum saque realizado ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-green-500/20"
                  >
                    <div>
                      <p className="text-white font-bold">{formatPrice(withdrawal.amount / 100)}</p>
                      <p className="text-gray-400 text-sm font-rajdhani">
                        {withdrawal.pixKeyType}: {withdrawal.pixKey.substring(0, 10)}...
                      </p>
                      <p className="text-gray-500 text-xs font-rajdhani">
                        {formatDate(withdrawal.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(withdrawal.status)}
                      {withdrawal.receiptUrl && withdrawal.status === 'COMPLETE' && (
                        <a
                          href={withdrawal.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-green-400 text-xs mt-1 hover:underline"
                        >
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
    </div>
  )
}
