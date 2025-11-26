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
          <div>
            <PaymentForm
              orderId={parseInt(orderId)}
              orderTotal={parseFloat(total)}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>
        )}

        {/* Show payment details after generation */}
        {payment && (
          <div className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border border-purple-500/50 hover:border-purple-400/80 rounded-lg p-6 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 overflow-hidden">
            {/* Efeito de brilho sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
            <div className="text-center mb-6 relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2 font-orbitron group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">PIX</span> Gerado!
              </h2>
              <p className="text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Escaneie o QR Code ou copie o código abaixo
              </p>
            </div>

            {/* Payment URL Link */}
            <div className="relative z-10 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 hover:border-purple-400/60 rounded-lg p-6 mb-6 text-center transition-all duration-300">
              <p className="text-gray-300 mb-4 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                Clique no botão abaixo para abrir a página de pagamento:
              </p>
              <a
                href={payment.pixCode}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 border border-transparent hover:border-white/50 font-rajdhani"
              >
                ABRIR PÁGINA DE PAGAMENTO
              </a>
            </div>

            {/* Payment Details */}
            <div className="space-y-4 mb-6 relative z-10">
              <div className="flex justify-between text-sm p-3 rounded-lg bg-black/30 hover:bg-black/40 transition-colors duration-300">
                <span className="text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Valor:</span>
                <span className="text-white font-bold font-rajdhani bg-gradient-to-r from-purple-300 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  R$ {payment.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm p-3 rounded-lg bg-black/30 hover:bg-black/40 transition-colors duration-300">
                <span className="text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Status:</span>
                <span className="text-yellow-400 font-rajdhani group-hover:text-yellow-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {payment.status === 'PENDING' ? 'Aguardando Pagamento' : payment.status}
                </span>
              </div>
              <div className="flex justify-between text-sm p-3 rounded-lg bg-black/30 hover:bg-black/40 transition-colors duration-300">
                <span className="text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Expira em:</span>
                <span className="text-gray-300 font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  {new Date(payment.expiresAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Info box */}
            <div className="relative z-10 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 hover:border-blue-400/60 rounded-lg p-4 mb-6 transition-all duration-300">
              <p className="text-gray-300 text-sm font-rajdhani group-hover:text-gray-200 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                ℹ️ Após o pagamento, seu pedido será automaticamente confirmado e um booster será atribuído.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 relative z-10">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 border border-transparent hover:border-white/50 font-rajdhani"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                Voltar ao Dashboard
              </button>
              <button
                onClick={() => router.push(`/payment/status?orderId=${orderId}`)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 border border-transparent hover:border-white/50 font-rajdhani"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
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
