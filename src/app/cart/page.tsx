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
  X,
  ArrowRight,
  Loader2,
  CreditCard
} from 'lucide-react'
import { CartItem } from '@/types'
import { showSuccess, showWarning, showLoading, updateToSuccess, updateToError } from '@/lib/toast'
import { apiPost } from '@/lib/api-client'
import { formatPrice } from '@/lib/utils'
import { LoadingSpinner } from '@/components/common/loading-spinner'

export default function CartPage() {
  const { user, loading: authLoading } = useAuth()
  const { items, removeItem, clearCart } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const total = items.reduce((sum, item) => sum + item.price, 0)

  const handleFinalizePurchase = async () => {
    if (!user) {
      showWarning('Login necessário', 'Faça login para finalizar sua compra')
      router.push('/login')
      return
    }

    if (items.length === 0) {
      showWarning('Carrinho vazio', 'Adicione serviços ao carrinho antes de finalizar')
      return
    }

    setIsProcessing(true)
    const toastId = showLoading(`Processando ${items.length} ${items.length === 1 ? 'pedido' : 'pedidos'}...`)

    try {
      const createdOrders: number[] = []
      const failedItems: string[] = []

      for (const item of items) {
        try {
          const body: any = {
            game: item.game,
            total: item.price,
          }

          // Adicionar metadados se existirem
          if (item.currentRank) body.currentRank = item.currentRank
          if (item.targetRank) body.targetRank = item.targetRank
          if (item.metadata) {
            if (item.metadata.currentRating !== undefined) {
              body.currentRating = typeof item.metadata.currentRating === 'number' 
                ? item.metadata.currentRating 
                : parseInt(item.metadata.currentRating)
            }
            if (item.metadata.targetRating !== undefined) {
              body.targetRating = typeof item.metadata.targetRating === 'number'
                ? item.metadata.targetRating
                : parseInt(item.metadata.targetRating)
            }
            if (item.metadata.mode) body.gameMode = item.metadata.mode
            if (item.metadata.gameType) body.gameType = item.metadata.gameType
            body.metadata = typeof item.metadata === 'string' ? item.metadata : JSON.stringify(item.metadata)
          }

          const data = await apiPost<{ order: { id: number } }>('/api/orders', body)
          
          if (data && data.order) {
            createdOrders.push(data.order.id)
          } else {
            failedItems.push(item.serviceName || 'Item sem nome')
            console.error('Erro ao criar order para item: resposta inválida', item)
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Erro desconhecido ao criar pedido'
          console.error('Erro ao criar order para item:', item, errorMessage)
          
          const itemName = item.serviceName || 'Item sem nome'
          if (errorMessage.includes('já possui') || errorMessage.includes('modalidade')) {
            failedItems.push(`${itemName} (${errorMessage})`)
          } else {
            failedItems.push(itemName)
          }
        }
      }

      if (createdOrders.length > 0) {
        if (createdOrders.length === items.length) {
          updateToSuccess(
            toastId,
            `${createdOrders.length} ${createdOrders.length === 1 ? 'pedido criado' : 'pedidos criados'} com sucesso!`,
            'Redirecionando para pagamento...'
          )
        } else {
          updateToSuccess(
            toastId,
            `${createdOrders.length} de ${items.length} pedidos criados`,
            failedItems.length > 0 
              ? `Não foi possível criar: ${failedItems.join(', ')}`
              : 'Redirecionando para pagamento...'
          )
        }
        
        setIsRedirecting(true)
        
        setTimeout(() => {
          clearCart()
          router.replace(`/payment?orderId=${createdOrders[0]}&total=${items[0].price}`)
        }, 200)
      } else {
        const errorMessage = failedItems.length > 0
          ? `Não foi possível criar os pedidos: ${failedItems.join(', ')}`
          : 'Não foi possível criar nenhum pedido. Tente novamente.'
        
        updateToError(toastId, 'Erro ao criar pedidos', errorMessage)
      }
    } catch (error) {
      console.error('Erro ao finalizar compra:', error)
      updateToError(
        toastId,
        'Erro ao finalizar compra',
        error instanceof Error ? error.message : 'Tente novamente mais tarde'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveItem = (index: number) => {
    const item = items[index]
    removeItem(index)
    showSuccess('Item removido', `${item.serviceName || 'Item'} foi removido do carrinho`)
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-brand-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-5xl xl:max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white font-orbitron mb-2">
            <span className="text-brand-purple-light">CARRINHO</span>
            <span className="text-white"> DE COMPRAS</span>
          </h1>
          <p className="text-brand-gray-300 font-rajdhani">
            Revise seus serviços selecionados antes de finalizar
          </p>
        </div>

        {items.length === 0 && !isRedirecting ? (
          <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-brand-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white font-orbitron mb-2">
                  Carrinho vazio
                </h3>
                <p className="text-brand-gray-500 font-rajdhani mb-6">
                  Seu carrinho está vazio. Adicione serviços para continuar.
                </p>
                <Button asChild className="bg-brand-purple text-white font-rajdhani">
                  <Link href="/games/cs2">Explorar Jogos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isRedirecting ? (
          <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <LoadingSpinner size="lg" text="Redirecionando para pagamento..." fullScreen={false} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {items.map((item: CartItem, index: number) => (
                <Card key={index} className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light/80 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white font-orbitron mb-2">
                          {item.serviceName}
                        </CardTitle>
                        <CardDescription className="text-brand-gray-500 font-rajdhani">
                          {item.description || 'Serviço de boost profissional'}
                        </CardDescription>
                        {item.currentRank && item.targetRank && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge className="bg-brand-purple/20 text-brand-purple-light border-brand-purple/50">
                              {item.currentRank} → {item.targetRank}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                              {item.game}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-brand-gray-500 font-rajdhani mb-1">Duração estimada</p>
                        <p className="text-sm text-white font-rajdhani">{item.duration || '1-3 dias'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-brand-gray-500 font-rajdhani mb-1">Preço</p>
                        <p className="text-xl font-bold text-brand-purple-light font-orbitron">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resumo do pedido */}
            <Card className="bg-brand-black/30 backdrop-blur-md border-brand-purple/50 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white font-orbitron">
                  <span className="text-brand-purple-light">RESUMO</span> DO PEDIDO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-brand-gray-300 font-rajdhani">Total de itens</p>
                  <p className="text-white font-rajdhani font-semibold">{items.length}</p>
                </div>
                <div className="flex items-center justify-between border-t border-brand-purple/30 pt-4">
                  <p className="text-lg font-bold text-white font-orbitron">Total</p>
                  <p className="text-2xl font-bold text-brand-purple-light font-orbitron">
                    {formatPrice(total)}
                  </p>
                </div>
                
                {user ? (
                  <div className="space-y-2 mt-4">
                    <Button
                      onClick={handleFinalizePurchase}
                      disabled={isProcessing || items.length === 0}
                      className="w-full bg-brand-purple text-white font-rajdhani disabled:opacity-50"
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
                      className="w-full border-brand-purple/50 text-brand-purple-light hover:border-brand-purple-light"
                    >
                      <Link href="/dashboard">
                        Ver Meus Pedidos
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 mt-4">
                    <Button asChild className="w-full bg-brand-purple text-white font-rajdhani">
                      <Link href="/login">
                        Fazer Login para Continuar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <p className="text-xs text-center text-brand-gray-500 font-rajdhani">
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
