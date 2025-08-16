import { Service } from '@/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { ClockIcon, StarIcon } from 'lucide-react'

interface ServiceCardProps {
  service: Service
}

export function ServiceCard({ service }: ServiceCardProps) {
  const gameColors = {
    LOL: 'bg-blue-500',
    VALORANT: 'bg-red-500',
    CS2: 'bg-orange-500'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{service.name}</CardTitle>
          <Badge 
            className={`${gameColors[service.game]} text-white`}
            variant="secondary"
          >
            {service.game}
          </Badge>
        </div>
        <p className="text-gray-600 text-sm">{service.description}</p>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{service.duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm text-gray-600">4.9</span>
          </div>
        </div>
        
        <div className="text-2xl font-bold text-blue-600">
          {formatPrice(service.price)}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button className="w-full" size="lg">
          Contratar Agora
        </Button>
      </CardFooter>
    </Card>
  )
}