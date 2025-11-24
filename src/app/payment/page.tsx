'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PaymentForm } from '@/components/payment/payment-form'
import Link from 'next/link'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const total = searchParams.get('total')

  const [payment, setPayment] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  if (!orderId || !total) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-6 py-4 rounded-lg">
          <p className="font-rajdhani">Informações de pagamento inválidas</p>
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 transition-colors">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const handleSuccess = (paymentData: any) => {
    setPayment(paymentData)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setPayment(null)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Show error if any */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6 font-rajdhani">
            {error}
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

        {/* Show payment details after generation */}
        {payment && (
          <div className="bg-black/30 backdrop-blur-md border border-purple-500/50 rounded-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-2 font-orbitron">
                <span className="text-purple-400">PIX</span> Gerado!
              </h2>
              <p className="text-gray-400 font-rajdhani">
                Escaneie o QR Code ou copie o código abaixo
              </p>
            </div>

            {/* Payment URL Link */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 mb-6 text-center">
              <p className="text-gray-300 mb-4 font-rajdhani">
                Clique no botão abaixo para abrir a página de pagamento:
              </p>
              <a
                href={payment.pixCode}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 font-rajdhani"
              >
                ABRIR PÁGINA DE PAGAMENTO
              </a>
            </div>

            {/* Payment Details */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-rajdhani">Valor:</span>
                <span className="text-white font-bold font-rajdhani">
                  R$ {payment.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-rajdhani">Status:</span>
                <span className="text-yellow-400 font-rajdhani">
                  {payment.status === 'PENDING' ? 'Aguardando Pagamento' : payment.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400 font-rajdhani">Expira em:</span>
                <span className="text-gray-300 font-rajdhani">
                  {new Date(payment.expiresAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm font-rajdhani">
                ℹ️ Após o pagamento, seu pedido será automaticamente confirmado e um booster será atribuído.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 font-rajdhani"
              >
                Voltar ao Dashboard
              </button>
              <button
                onClick={() => router.push(`/payment/status?orderId=${orderId}`)}
                className="flex-1 bg-purple-500 hover:bg-purple-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 font-rajdhani"
              >
                Verificar Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-white font-rajdhani">Carregando...</div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}
