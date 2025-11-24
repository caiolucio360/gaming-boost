'use client'

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

interface ServiceCardProps {
  service: Service
}

export function ServiceCard({ service }: ServiceCardProps) {
  const { user } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()

  const gameColors: Record<GameId, string> = {
    CS2: 'bg-orange-500',
  }

  const handleHire = async () => {
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
          router.push('/login')
        }
      )

      // Se o pedido foi criado, redirecionar para dashboard
      if (orderCreated) {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Erro ao contratar serviço:', error)
      alert('Erro ao contratar serviço. Tente novamente.')
    }
  }

  return (
    <Card className="bg-gray-900 border-purple-600/50 hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg text-white">{service.name}</CardTitle>
          <Badge 
            className={`${gameColors[service.game] || 'bg-gray-500'} text-white`}
            variant="secondary"
          >
            {service.game}
          </Badge>
        </div>
        <p className="text-gray-400 text-sm">{service.description}</p>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-gray-400">{service.duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm text-gray-400">4.9</span>
          </div>
        </div>
        
        <div className="text-2xl font-bold text-purple-400">
          {formatPrice(service.price)}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleHire}
          className="w-full" 
          size="lg"
        >
          Contratar Agora
        </Button>
      </CardFooter>
    </Card>
  )
}