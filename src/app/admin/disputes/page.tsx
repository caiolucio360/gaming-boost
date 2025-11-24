'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { showSuccess, showError } from '@/lib/toast'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { formatDate, formatPrice } from '@/lib/utils'

interface Dispute {
  id: number
  orderId: number
  reason: string
  status: string
  createdAt: string
  creator: {
    id: number
    name: string | null
    email: string
  }
  order: {
    id: number
    total: number
    status: string
    user: { id: number; name: string | null }
    booster: { id: number; name: string | null } | null
  }
  messages: Array<{
    id: number
    content: string
    createdAt: string
  }>
}

export default function AdminDisputesPage() {
  const router = useRouter()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState('')
  const [resolutionStatus, setResolutionStatus] = useState<string>('')
  const [resolving, setResolving] = useState(false)

  const fetchDisputes = async () => {
    try {
      const response = await fetch('/api/disputes')
      if (response.ok) {
        const data = await response.json()
        setDisputes(data.disputes)
      }
    } catch (error) {
      console.error('Erro ao buscar disputas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDisputes()
  }, [])

  const handleResolve = async () => {
    if (!selectedDispute || !resolutionStatus) return

    setResolving(true)
    try {
      const response = await fetch(`/api/disputes/${selectedDispute.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: resolutionStatus,
          resolution: resolution || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao resolver disputa')
      }

      showSuccess('Disputa resolvida!', 'As partes foram notificadas.')
      setSelectedDispute(null)
      setResolution('')
      setResolutionStatus('')
      await fetchDisputes()
    } catch (error) {
      showError('Erro', error instanceof Error ? error.message : 'Erro ao resolver disputa')
    } finally {
      setResolving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-500/20 text-yellow-300'
      case 'RESOLVED_REFUND':
        return 'bg-blue-500/20 text-blue-300'
      case 'RESOLVED_PAYOUT':
        return 'bg-green-500/20 text-green-300'
      case 'RESOLVED_PARTIAL':
        return 'bg-purple-500/20 text-purple-300'
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-300'
      default:
        return 'bg-gray-500/20 text-gray-300'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white font-orbitron mb-8">
          Gerenciar Disputas
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Disputes List */}
          <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
            <CardHeader>
              <CardTitle className="text-white font-orbitron">
                Disputas ({disputes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {disputes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhuma disputa encontrada</p>
              ) : (
                disputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    onClick={() => setSelectedDispute(dispute)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedDispute?.id === dispute.id
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-gray-800/30 border-gray-700/30 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-white">Disputa #{dispute.id}</p>
                        <p className="text-sm text-gray-400">Pedido #{dispute.orderId}</p>
                      </div>
                      <Badge className={getStatusColor(dispute.status)}>
                        {dispute.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                      {dispute.reason}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{dispute.creator.name || dispute.creator.email}</span>
                      <span>{formatDate(dispute.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Dispute Detail & Resolution */}
          <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
            <CardHeader>
              <CardTitle className="text-white font-orbitron">
                {selectedDispute ? `Disputa #${selectedDispute.id}` : 'Selecione uma disputa'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDispute ? (
                <p className="text-center text-gray-500 py-12">
                  Selecione uma disputa para visualizar os detalhes
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Criador</p>
                    <p className="text-white">{selectedDispute.creator.name || selectedDispute.creator.email}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">Pedido</p>
                    <p className="text-white">#{selectedDispute.orderId} - {formatPrice(selectedDispute.order.total)}</p>
                    <p className="text-sm text-gray-400">
                      Cliente: {selectedDispute.order.user.name} | 
                      Booster: {selectedDispute.order.booster?.name || 'Não atribuído'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">Motivo</p>
                    <p className="text-white">{selectedDispute.reason}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">Mensagens</p>
                    <p className="text-white">{selectedDispute.messages.length} mensagens</p>
                    <Button
                      variant="link"
                      className="text-purple-400 p-0 h-auto"
                      onClick={() => router.push(`/disputes/${selectedDispute.id}`)}
                    >
                      Ver conversa completa
                    </Button>
                  </div>

                  {selectedDispute.status === 'OPEN' && (
                    <div className="pt-4 border-t border-gray-700">
                      <p className="text-white font-semibold mb-3">Resolver Disputa</p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">Resolução</label>
                          <Select value={resolutionStatus} onValueChange={setResolutionStatus}>
                            <SelectTrigger className="bg-black/50 border-purple-500/30 text-white">
                              <SelectValue placeholder="Selecione a resolução" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RESOLVED_REFUND">Reembolso ao Cliente</SelectItem>
                              <SelectItem value="RESOLVED_PAYOUT">Pagamento ao Booster</SelectItem>
                              <SelectItem value="RESOLVED_PARTIAL">Resolução Parcial</SelectItem>
                              <SelectItem value="CANCELLED">Cancelar Disputa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">
                            Mensagem (opcional)
                          </label>
                          <Textarea
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            placeholder="Adicione detalhes sobre a resolução..."
                            className="bg-black/50 border-purple-500/30 text-white"
                          />
                        </div>

                        <Button
                          onClick={handleResolve}
                          disabled={!resolutionStatus || resolving}
                          className="w-full bg-purple-600 hover:bg-purple-500"
                        >
                          {resolving ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Resolvendo...
                            </>
                          ) : (
                            'Resolver Disputa'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
