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
import { showSuccess, showError, showWarning, showLoading, updateToSuccess, updateToError, handleApiError } from '@/lib/toast'
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
      // Criar orders para cada item do carrinho
      const createdOrders: number[] = []
      const failedItems: string[] = []

      for (const item of items) {
        let serviceIdToUse = item.serviceId

        // Se o item não tiver serviceId, buscar um serviço apropriado de RANK_BOOST para o jogo
        if (!serviceIdToUse) {
          try {
            const servicesResponse = await fetch(`/api/services?game=${item.game}&type=RANK_BOOST`)
            if (servicesResponse.ok) {
              const servicesData = await servicesResponse.json()
              if (servicesData.services && servicesData.services.length > 0) {
                // Tentar encontrar um serviço que corresponda ao modo do item
                const itemMode = item.metadata?.mode // 'PREMIER' ou 'GAMERS_CLUB'
                let selectedService = null

                if (itemMode) {
                  // Prioridade 1: Buscar serviço "Customizado" para o modo específico
                  const customServiceName = itemMode === 'PREMIER' 
                    ? 'Premier Customizado'
                    : 'Gamers Club Customizado'
                  
                  selectedService = servicesData.services.find((service: any) => 
                    service.name.includes(customServiceName)
                  )

                  // Prioridade 2: Se não encontrou customizado, buscar qualquer serviço do modo
                  if (!selectedService) {
                    const modeKeywords: Record<string, string[]> = {
                      'PREMIER': ['Premier', 'premier'],
                      'GAMERS_CLUB': ['Gamers Club', 'gamers club', 'GamersClub']
                    }
                    
                    const keywords = modeKeywords[itemMode] || []
                    
                    selectedService = servicesData.services.find((service: any) => 
                      keywords.some(keyword => 
                        service.name.includes(keyword) || service.description?.includes(keyword)
                      )
                    )
                  }
                }

                // Prioridade 3: Se não encontrou por modo, usar o primeiro serviço disponível
                if (!selectedService) {
                  selectedService = servicesData.services[0]
                }

                serviceIdToUse = selectedService.id
                console.log(`Usando serviço ${serviceIdToUse} (${selectedService.name}) para item sem serviceId:`, item.serviceName)
              } else {
                console.warn('Nenhum serviço RANK_BOOST encontrado para o jogo:', item.game)
                failedItems.push(item.serviceName || 'Item sem nome')
                continue
              }
            } else {
              console.warn('Erro ao buscar serviços:', servicesResponse.status)
              failedItems.push(item.serviceName || 'Item sem nome')
              continue
            }
          } catch (error) {
            console.error('Erro ao buscar serviço genérico:', error)
            failedItems.push(item.serviceName || 'Item sem nome')
            continue
          }
        }

        try {
          const body: any = {
            serviceId: serviceIdToUse,
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

          // Usar apiPost para incluir automaticamente o token de autenticação
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
          
          // Adicionar item à lista de falhas com mensagem específica se disponível
          const itemName = item.serviceName || 'Item sem nome'
          if (errorMessage.includes('já possui') || errorMessage.includes('modalidade')) {
            // Mensagem específica de validação - manter no failedItems para mostrar ao usuário
            failedItems.push(`${itemName} (${errorMessage})`)
          } else {
            failedItems.push(itemName)
          }
        }
      }

      // Se pelo menos uma order foi criada, limpar carrinho e redirecionar para pagamento
      if (createdOrders.length > 0) {
        if (createdOrders.length === items.length) {
          // Todos os pedidos foram criados com sucesso
          updateToSuccess(
            toastId,
            `${createdOrders.length} ${createdOrders.length === 1 ? 'pedido criado' : 'pedidos criados'} com sucesso!`,
            'Redirecionando para pagamento...'
          )
        } else {
          // Alguns pedidos foram criados, mas alguns falharam
          updateToSuccess(
            toastId,
            `${createdOrders.length} de ${items.length} pedidos criados`,
            failedItems.length > 0 
              ? `Não foi possível criar: ${failedItems.join(', ')}. Verifique se você já possui pedidos ativos para a mesma modalidade.`
              : 'Redirecionando para pagamento...'
          )
        }
        
        // Marcar como redirecionando para evitar mostrar carrinho vazio
        setIsRedirecting(true)
        
        // Pequeno delay para mostrar a animação de transição antes de limpar e redirecionar
        setTimeout(() => {
          // Limpar carrinho antes do redirecionamento (mas o estado isRedirecting previne a renderização do vazio)
          clearCart()
          
          // Redirecionar para pagamento (usar replace para evitar voltar ao carrinho vazio)
          router.replace(`/payment?orderId=${createdOrders[0]}`)
        }, 200)
      } else {
        // Nenhum pedido foi criado - manter itens no carrinho
        const errorMessage = failedItems.length > 0
          ? `Não foi possível criar os pedidos: ${failedItems.join(', ')}. Verifique se você já possui pedidos ativos para a mesma modalidade.`
          : 'Não foi possível criar nenhum pedido. Verifique se você já possui pedidos ativos para a mesma modalidade ou tente novamente.'
        
        updateToError(
          toastId,
          'Erro ao criar pedidos',
          errorMessage
        )
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
    <div className="min-h-screen bg-black py-8 sm:py-12 px-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="max-w-5xl xl:max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: '800' }}>
            <span className="text-purple-300">CARRINHO</span>
            <span className="text-white"> DE COMPRAS</span>
          </h1>
          <p className="text-gray-300 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '500' }}>
            Revise seus serviços selecionados antes de finalizar
          </p>
        </div>

        {items.length === 0 && !isRedirecting ? (
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
                  <Link href="/games/cs2">Explorar Jogos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isRedirecting ? (
          <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <LoadingSpinner size="lg" text="Redirecionando para pagamento..." fullScreen={false} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 transition-opacity duration-300">
            <div className="space-y-4">
              {items.map((item: CartItem, index: number) => (
                <Card
                  key={index}
                  className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-all duration-300"
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
                        onClick={() => handleRemoveItem(index)}
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

