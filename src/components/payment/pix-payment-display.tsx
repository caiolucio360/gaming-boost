'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { showSuccess, showError } from '@/lib/toast'
import { api, ApiError } from '@/lib/api-client'
// import { TrustpilotReviewLink } from '@/components/trustpilot/trustpilot-review-link'

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
      const data = await api.get<{ status?: string }>(`/api/payment/pix/status?paymentId=${paymentId}`)

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
      const data = await api.post<{ status?: string }>('/api/payment/pix/simulate', { paymentId })

      if (data.status === 'PAID') {
        setStatus('PAID')
        onStatusChange?.('PAID')
        showSuccess('Pagamento simulado com sucesso!')
        onPaymentConfirmed?.()
      } else {
        showError('Erro ao simular pagamento')
      }
    } catch (error) {
      console.error('Erro ao simular:', error)
      showError(error instanceof ApiError ? error.message : 'Erro ao simular pagamento')
    } finally {
      setIsSimulating(false)
    }
  }

  // Status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'PAID':
        return (
          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/20 px-4 py-2 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold">Pagamento Confirmado!</span>
          </div>
        )
      case 'EXPIRED':
        return (
          <div className="flex items-center gap-2 text-brand-red bg-brand-red/20 px-4 py-2 rounded-lg">
            <XCircle className="w-5 h-5" />
            <span className="font-bold">PIX Expirado</span>
          </div>
        )
      case 'CANCELLED':
        return (
          <div className="flex items-center gap-2 text-muted-foreground bg-card px-4 py-2 rounded-lg">
            <XCircle className="w-5 h-5" />
            <span className="font-bold">Cancelado</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-2 text-amber-500 bg-amber-500/20 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="font-bold">Aguardando Pagamento</span>
          </div>
        )
    }
  }

  // Se já foi pago ou expirou, mostrar status final
  if (status === 'PAID') {
    return (
      <Card className="bg-emerald-500/10 border-emerald-500/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <h2 className="text-2xl font-bold text-emerald-500 font-orbitron">Pagamento Confirmado!</h2>
            <p className="text-muted-foreground font-rajdhani">
              Seu pedido foi pago e está sendo processado.
            </p>
            {/* <TrustpilotReviewLink className="mt-2" /> */}
          </div>
        </CardContent>
      </Card>
    )
  }

  // O Asaas retorna o QR Code como base64 puro (sem o prefixo data URI).
  // Sem `data:image/png;base64,` o <img> não renderiza. Normalizamos aqui para
  // cobrir tanto valores crus quanto os que já vêm como data URI completo.
  const qrCodeSrc = qrCodeBase64
    ? qrCodeBase64.startsWith('data:')
      ? qrCodeBase64
      : `data:image/png;base64,${qrCodeBase64}`
    : ''

  return (
    <Card className="bg-card/30 backdrop-blur-md border-brand-purple/50">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold text-foreground font-orbitron">
          Pagamento via <span className="text-brand-purple">PIX</span>
        </CardTitle>
        <p className="text-muted-foreground font-rajdhani">
          Valor: <span className="text-foreground font-bold text-xl">R$ {total.toFixed(2)}</span>
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
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-lg">
                Expira em: <span className={timeLeft === 'Expirado' ? 'text-brand-red' : 'text-foreground'}>{timeLeft}</span>
              </span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                {qrCodeSrc ? (
                  // QR code vem como data: URI base64 — next/image não otimiza data URIs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrCodeSrc}
                    alt="QR Code PIX"
                    className="w-48 h-48 md:w-64 md:h-64"
                  />
                ) : (
                  <div className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center text-muted-foreground">
                    QR Code não disponível
                  </div>
                )}
              </div>
            </div>

            {/* Código copia-e-cola */}
            <div className="space-y-2">
              <p className="text-center text-muted-foreground text-sm font-rajdhani">
                Ou copie o código PIX abaixo:
              </p>
              <div className="relative">
                <div className="bg-card border border-brand-purple/30 rounded-lg p-3 pr-12 overflow-x-auto">
                  <code className="text-xs text-muted-foreground break-all font-mono">
                    {pixCode?.substring(0, 100)}...
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-purple hover:text-brand-purple-light"
                  onClick={copyPixCode}
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <Button
                variant="default"
                size="lg"
                className="w-full font-rajdhani"
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
              className="w-full"
              onClick={checkStatus}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verificando…
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
                className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                onClick={simulatePayment}
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Simulando…
                  </>
                ) : (
                  '🧪 Simular Pagamento (Dev)'
                )}
              </Button>
            )}

            {/* Instruções */}
            <Alert className="bg-brand-purple/10 border-brand-purple/30">
              <AlertDescription className="text-muted-foreground text-sm font-rajdhani">
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
          <Alert className="bg-brand-red/10 border-brand-red/30">
            <AlertDescription className="text-brand-red text-sm font-rajdhani">
              O PIX expirou. Por favor, gere um novo código de pagamento.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
