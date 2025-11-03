'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart,
  Package,
  X,
  ArrowRight,
  Loader2,
  CreditCard
} from 'lucide-react'
import { CartItem } from '@/types'

export default function CartPage() {
  const { user, loading: authLoading } = useAuth()
  const { items, removeItem, clearCart } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const total = items.reduce((sum, item) => sum + item.price, 0)

  const handleFinalizePurchase = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (items.length === 0) {
      setError('Seu carrinho está vazio')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Criar orders para cada item do carrinho
      const createdOrders: string[] = []

      for (const item of items) {
        if (!item.serviceId) {
          console.warn('Item sem serviceId, pulando:', item)
          continue
        }

        try {
          const body: any = {
            serviceId: item.serviceId,
            total: item.price,
          }

          // Adicionar metadados se existirem
          if (item.currentRank) body.currentRank = item.currentRank
          if (item.targetRank) body.targetRank = item.targetRank
          if (item.metadata) {
            if (item.metadata.currentRating !== undefined) body.currentRating = item.metadata.currentRating
            if (item.metadata.targetRating !== undefined) body.targetRating = item.metadata.targetRating
            if (item.metadata.mode) body.gameMode = item.metadata.mode
            if (item.metadata.gameType) body.gameType = item.metadata.gameType
            body.metadata = JSON.stringify(item.metadata)
          }

          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          })

          if (response.ok) {
            const data = await response.json()
            createdOrders.push(data.order.id)
          } else {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Erro ao criar pedido')
          }
        } catch (error) {
          console.error('Erro ao criar order para item:', item, error)
          // Continuar com os outros itens mesmo se um falhar
        }
      }

      // Se pelo menos uma order foi criada, limpar carrinho e redirecionar para pagamento
      if (createdOrders.length > 0) {
        clearCart()
        // Redirecionar para a primeira order criada
        router.push(`/payment?orderId=${createdOrders[0]}`)
      } else {
        setError('Não foi possível criar nenhum pedido. Verifique se você já possui pedidos ativos para a mesma modalidade.')
      }
    } catch (error) {
      console.error('Erro ao finalizar compra:', error)
      setError(error instanceof Error ? error.message : 'Erro ao finalizar compra. Tente novamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">CARRINHO</span>
            <span className="text-white"> DE COMPRAS</span>
          </h1>
          <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Revise seus serviços selecionados antes de finalizar
          </p>
        </div>

        {items.length === 0 ? (
          <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Carrinho vazio
                </h3>
                <p className="text-gray-400 font-rajdhani mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                  Seu carrinho está vazio. Adicione serviços para continuar.
                </p>
                <Button
                  asChild
                  className="bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
                  style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                >
                  <Link href="/services">Explorar Serviços</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {items.map((item: CartItem, index: number) => (
                <Card
                  key={index}
                  className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {item.serviceName}
                        </CardTitle>
                        <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {item.description || 'Serviço de boost profissional'}
                        </CardDescription>
                        {item.currentRank && item.targetRank && (
                          <div className="mt-2">
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 font-rajdhani mr-2" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {item.currentRank} → {item.targetRank}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                              {item.game}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          Duração estimada
                        </p>
                        <p className="text-sm text-white font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          {item.duration || '1-3 dias'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400 font-rajdhani mb-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                          Preço
                        </p>
                        <p className="text-xl font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resumo do pedido */}
            <Card className="bg-black/30 backdrop-blur-md border-purple-500/50 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  <span className="text-purple-300">RESUMO</span>
                  <span className="text-white"> DO PEDIDO</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    Total de itens
                  </p>
                  <p className="text-white font-rajdhani font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {items.length}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-purple-500/30 pt-4">
                  <p className="text-lg font-bold text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Total
                  </p>
                  <p className="text-2xl font-bold text-purple-300 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {formatPrice(total)}
                  </p>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 text-sm font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      {error}
                    </p>
                  </div>
                )}
                
                {user ? (
                  <div className="space-y-2 mt-4">
                    <Button
                      onClick={handleFinalizePurchase}
                      disabled={isProcessing || items.length === 0}
                      className="w-full bg-purple-500 hover:bg-purple-400 text-white font-rajdhani disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          Finalizar Compra
                          <CreditCard className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/10 font-rajdhani"
                      style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                    >
                      <Link href="/dashboard">
                        Ver Meus Pedidos
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 mt-4">
                    <Button
                      asChild
                      className="w-full bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
                      style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
                    >
                      <Link href="/login">
                        Fazer Login para Continuar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <p className="text-xs text-center text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                      Seus itens serão salvos no carrinho
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

