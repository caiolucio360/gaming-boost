'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { Payment } from '@/types'
import { useLoading } from '@/hooks/use-loading'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  ArrowLeft
} from 'lucide-react'

function PaymentContent() {
  const { user, loading: authLoading } = useAuth()
  const { removeItemByServiceId } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  const [payment, setPayment] = useState<Payment | null>(null)
  const [order, setOrder] = useState<any>(null)
  const { loading, withLoading } = useLoading()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      // Usar replace para redirecionamento de autenticação
      router.replace('/login')
    } else if (user && user.role !== 'CLIENT') {
      router.push('/')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (orderId) {
      generatePayment()
    }
  }, [orderId])

  const generatePayment = async () => {
    if (!orderId) return

    setError(null)
    try {
      await withLoading(async () => {
        // Buscar informações da order para pegar o serviceId
        const orderResponse = await fetch(`/api/orders`)
        let foundOrder: any = null
        if (orderResponse.ok) {
          const ordersData = await orderResponse.json()
          foundOrder = ordersData.orders?.find((o: any) => o.id === orderId)
          if (foundOrder) {
            setOrder(foundOrder)
          }
        }

        const response = await fetch('/api/payment/pix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orderId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Erro ao gerar código PIX')
        }

        const data = await response.json()
        setPayment(data.payment)

        // Remover item do carrinho quando o pagamento é gerado
        if (foundOrder?.serviceId) {
          removeItemByServiceId(foundOrder.serviceId)
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar código PIX')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }


  if (authLoading || loading) {
    return <LoadingSpinner />
  }

  if (!user || !orderId) {
    return null
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Button
          asChild
          variant="ghost"
          className="mb-6 text-purple-400 hover:text-purple-300 font-rajdhani"
          style={{ fontFamily: 'Rajdhani, sans-serif' }}
        >
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>

        {error && (
          <Card className="bg-red-500/20 border-red-500/50 mb-6">
            <CardContent className="pt-6">
              <p className="text-red-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {payment ? (
          <div className="space-y-6">
            <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
              <CardHeader>
                <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
                  <span className="text-purple-300">PAGAMENTO</span>
                  <span className="text-white"> PIX</span>
                </CardTitle>
                <CardDescription className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Escaneie o QR Code ou copie o código PIX para pagar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="inline-block bg-white p-4 rounded-lg mb-4">
                    {payment.qrCode ? (
                      <img
                        src={payment.qrCode}
                        alt="QR Code PIX"
                        className="w-64 h-64 mx-auto"
                      />
                    ) : (
                      <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                        <QrCode className="h-32 w-32 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 font-rajdhani mb-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Valor: <span className="text-purple-300 font-bold">{formatPrice(payment.total)}</span>
                  </p>
                  <p className="text-xs text-gray-500 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Válido até: {formatDate(payment.expiresAt)}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-white font-rajdhani font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Código PIX Copia e Cola
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={payment.pixCode}
                      readOnly
                      className="bg-black/50 border-purple-500/50 text-white font-mono text-xs font-rajdhani"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    />
                    <Button
                      onClick={() => copyToClipboard(payment.pixCode)}
                      className="bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Código copiado!
                    </p>
                  )}
                </div>

                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-300 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-blue-300 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        Instruções de Pagamento
                      </p>
                      <ul className="text-xs text-blue-200 space-y-1 font-rajdhani list-disc list-inside" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        <li>Abra o app do seu banco e selecione PIX</li>
                        <li>Escaneie o QR Code ou cole o código copiado</li>
                        <li>Confirme o pagamento de {formatPrice(payment.total)}</li>
                        <li>O pagamento será processado automaticamente</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Gerando código PIX...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return <PaymentContent />
}

