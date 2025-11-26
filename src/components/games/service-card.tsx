'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Service, CartItem } from '@/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { ClockIcon, StarIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { handleServiceHire } from '@/lib/cart-utils'
import { GameId } from '@/lib/games-config'
import { ButtonLoading } from '@/components/common/button-loading'
import { showError } from '@/lib/toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ServiceCardProps {
  service: Service
}

export function ServiceCard({ service }: ServiceCardProps) {
  const { user } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const gameColors: Record<GameId, string> = {
    CS2: 'bg-orange-500',
  }

  const handleHire = async () => {
    setIsLoading(true)
    const cartItem: CartItem = {
      serviceId: service.id,
      game: service.game,
      serviceName: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
    }

    try {
      const orderCreated = await handleServiceHire(
        cartItem,
        !!user,
        addItem,
        () => {
          router.replace('/login')
        }
      )

      // Se o pedido foi criado, redirecionar para dashboard
      if (orderCreated) {
        router.replace('/dashboard')
      }
    } catch (error) {
      console.error('Erro ao contratar serviço:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao contratar serviço. Tente novamente.'
      showError('Erro', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="group relative bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-800/90 border-purple-600/50 hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/30 transition-colors duration-200 overflow-hidden">
      {/* Efeito de brilho no hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
      
      <CardHeader className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg font-bold text-white group-hover:text-purple-200 transition-colors duration-200">
            {service.name}
          </CardTitle>
          <Badge 
            className={`${gameColors[service.game] || 'bg-gray-500'} text-white shadow-lg`}
            variant="secondary"
          >
            {service.game}
          </Badge>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-200">
          {service.description}
        </p>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2 cursor-help">
                  <div className="p-1.5 rounded-md bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300">
                    <ClockIcon className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-200">{service.duration}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
                <p>Tempo estimado de conclusão</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2 cursor-help">
                  <div className="p-1.5 rounded-md bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors duration-200">
                    <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <span className="text-sm font-semibold text-gray-400 group-hover:text-yellow-400 transition-colors duration-200">4.9</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
                <p>Avaliação média dos clientes</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-purple-500 transition-all duration-300">
            {formatPrice(service.price)}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="relative z-10 pt-4">
        <ButtonLoading 
          onClick={handleHire}
          loading={isLoading}
          loadingText="Processando..."
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold shadow-lg border border-transparent hover:border-white/50 transition-all duration-200" 
          size="lg"
        >
          Contratar Agora
        </ButtonLoading>
      </CardFooter>
    </Card>
  )
}