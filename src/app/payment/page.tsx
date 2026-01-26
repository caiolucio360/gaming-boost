'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaymentForm } from '@/components/payment/payment-form'
import { PixPaymentDisplay } from '@/components/payment/pix-payment-display'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'

interface PaymentData {
  id: number
  pixCode: string
  qrCode: string
  total: number
  expiresAt: string
  status: string
}

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const total = searchParams.get('total')

  const [payment, setPayment] = useState<PaymentData | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!orderId || !total) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-6 py-4 rounded-lg text-center">
          <p className="font-rajdhani mb-4">Informações de pagamento inválidas</p>
          <Link href="/dashboard" className="text-brand-purple-light hover:text-brand-purple-light transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const handleSuccess = (paymentData: PaymentData) => {
    setPayment(paymentData)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setPayment(null)
  }

  const handlePaymentConfirmed = () => {
    // Redirecionar para dashboard após um breve delay
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  const handleStatusChange = (newStatus: string) => {
    if (payment) {
      setPayment({ ...payment, status: newStatus })
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col">
      {/* Header */}
      <header className="bg-brand-black/50 backdrop-blur-md border-b border-brand-purple/20 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-brand-gray-500 hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-rajdhani hidden sm:inline">Voltar</span>
          </Link>
          <h1 className="text-lg font-bold text-white font-orbitron">
            Pedido #{orderId}
          </h1>
          <Link href="/" className="text-brand-gray-500 hover:text-white transition-colors">
            <Home className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Show error if any */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 font-rajdhani">
              {error}
              <Button
                variant="ghost"
                size="sm"
                className="ml-4 text-red-300 hover:text-white"
                onClick={() => setError(null)}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Show payment form if no payment generated yet */}
          {!payment && (
            <PaymentForm
              orderId={parseInt(orderId)}
              orderTotal={parseFloat(total)}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}

          {/* Show PIX QR Code after generation */}
          {payment && (
            <div className="space-y-4">
              <PixPaymentDisplay
                paymentId={payment.id}
                pixCode={payment.pixCode}
                qrCodeBase64={payment.qrCode}
                total={payment.total}
                expiresAt={payment.expiresAt}
                status={payment.status}
                onStatusChange={handleStatusChange}
                onPaymentConfirmed={handlePaymentConfirmed}
              />

              {/* Navigation buttons */}
              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 border-gray-500/50 text-brand-gray-500 hover:text-white hover:bg-gray-500/10"
                  onClick={() => router.push('/dashboard')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                {payment.status === 'EXPIRED' && (
                  <Button
                    className="flex-1 bg-brand-purple hover:bg-brand-purple-dark text-white"
                    onClick={() => setPayment(null)}
                  >
                    Gerar Novo PIX
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
        <div className="text-white font-rajdhani flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
          Carregando...
        </div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}

