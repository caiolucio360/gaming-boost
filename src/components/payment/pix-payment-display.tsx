'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { showSuccess, showError } from '@/lib/toast'

interface PixPaymentDisplayProps {
  paymentId: number
  pixCode: string      // brCode copia-e-cola
  qrCodeBase64: string // brCodeBase64 (imagem)
  total: number
  expiresAt: string
  status: string
  onStatusChange?: (status: string) => void
  onPaymentConfirmed?: () => void
}

export function PixPaymentDisplay({
  paymentId,
  pixCode,
  qrCodeBase64,
  total,
  expiresAt,
  status: initialStatus,
  onStatusChange,
  onPaymentConfirmed,
}: PixPaymentDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState(initialStatus)
  const [timeLeft, setTimeLeft] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  // Calcular tempo restante
  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date()
      const expires = new Date(expiresAt)
      const diff = expires.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('Expirado')
        if (status === 'PENDING') {
          setStatus('EXPIRED')
          onStatusChange?.('EXPIRED')
        }
        return
      }

      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, status, onStatusChange])

  // Polling de status
  const checkStatus = useCallback(async () => {
    if (status !== 'PENDING') return

    try {
      setIsChecking(true)
      const response = await fetch(`/api/payment/pix/status?paymentId=${paymentId}`)
      const data = await response.json()

      if (data.status && data.status !== status) {
        setStatus(data.status)
        onStatusChange?.(data.status)

        if (data.status === 'PAID') {
          showSuccess('Pagamento confirmado!')
          onPaymentConfirmed?.()
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setIsChecking(false)
    }
  }, [paymentId, status, onStatusChange, onPaymentConfirmed])

  // Auto-polling a cada 5 segundos
  useEffect(() => {
    if (status !== 'PENDING') return

    const interval = setInterval(checkStatus, 5000)
    return () => clearInterval(interval)
  }, [status, checkStatus])

  // Copiar código PIX
  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      showSuccess('Código PIX copiado!')
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
      showError('Erro ao copiar código')
    }
  }

  // Simular pagamento (dev mode)
  const simulatePayment = async () => {
    try {
      setIsSimulating(true)
      const response = await fetch('/api/payment/pix/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      })

      const data = await response.json()

      if (response.ok && data.status === 'PAID') {
        setStatus('PAID')
        onStatusChange?.('PAID')
        showSuccess('Pagamento simulado com sucesso!')
        onPaymentConfirmed?.()
      } else {
        showError(data.message || 'Erro ao simular pagamento')
      }
    } catch (error) {
      console.error('Erro ao simular:', error)
      showError('Erro ao simular pagamento')
    } finally {
      setIsSimulating(false)
    }
  }

  // Status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'PAID':
        return (
          <div className="flex items-center gap-2 text-green-400 bg-green-500/20 px-4 py-2 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold">Pagamento Confirmado!</span>
          </div>
        )
      case 'EXPIRED':
        return (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/20 px-4 py-2 rounded-lg">
            <XCircle className="w-5 h-5" />
            <span className="font-bold">PIX Expirado</span>
          </div>
        )
      case 'CANCELLED':
        return (
          <div className="flex items-center gap-2 text-gray-400 bg-gray-500/20 px-4 py-2 rounded-lg">
            <XCircle className="w-5 h-5" />
            <span className="font-bold">Cancelado</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-2 text-yellow-400 bg-yellow-500/20 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="font-bold">Aguardando Pagamento</span>
          </div>
        )
    }
  }

  // Se já foi pago ou expirou, mostrar status final
  if (status === 'PAID') {
    return (
      <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="w-16 h-16 text-green-400" />
            <h2 className="text-2xl font-bold text-green-400 font-orbitron">Pagamento Confirmado!</h2>
            <p className="text-gray-300 font-rajdhani">
              Seu pedido foi pago e está sendo processado.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-white font-orbitron">
          Pagamento via <span className="text-purple-400">PIX</span>
        </CardTitle>
        <p className="text-gray-400 font-rajdhani">
          Valor: <span className="text-white font-bold text-xl">R$ {total.toFixed(2)}</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex justify-center">
          {getStatusBadge()}
        </div>

        {status === 'PENDING' && (
          <>
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg">
                Expira em: <span className={timeLeft === 'Expirado' ? 'text-red-400' : 'text-white'}>{timeLeft}</span>
              </span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                {qrCodeBase64 ? (
                  <img 
                    src={qrCodeBase64} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 md:w-64 md:h-64"
                  />
                ) : (
                  <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center text-gray-500">
                    QR Code não disponível
                  </div>
                )}
              </div>
            </div>

            {/* Código copia-e-cola */}
            <div className="space-y-2">
              <p className="text-center text-gray-400 text-sm font-rajdhani">
                Ou copie o código PIX abaixo:
              </p>
              <div className="relative">
                <div className="bg-black/50 border border-purple-500/30 rounded-lg p-3 pr-12 overflow-x-auto">
                  <code className="text-xs text-gray-300 break-all font-mono">
                    {pixCode?.substring(0, 100)}...
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300"
                  onClick={copyPixCode}
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3"
                onClick={copyPixCode}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    COPIADO!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    COPIAR CÓDIGO PIX
                  </>
                )}
              </Button>
            </div>

            {/* Verificar status manualmente */}
            <Button
              variant="outline"
              className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              onClick={checkStatus}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Verificar Pagamento
                </>
              )}
            </Button>

            {/* Simular pagamento (dev mode) */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                onClick={simulatePayment}
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Simulando...
                  </>
                ) : (
                  '🧪 Simular Pagamento (Dev)'
                )}
              </Button>
            )}

            {/* Instruções */}
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <AlertDescription className="text-gray-300 text-sm font-rajdhani">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Abra o app do seu banco</li>
                  <li>Escolha pagar via PIX</li>
                  <li>Escaneie o QR Code ou cole o código copiado</li>
                  <li>Confirme o pagamento</li>
                </ol>
              </AlertDescription>
            </Alert>
          </>
        )}

        {status === 'EXPIRED' && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertDescription className="text-red-300 text-sm font-rajdhani">
              O PIX expirou. Por favor, gere um novo código de pagamento.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
