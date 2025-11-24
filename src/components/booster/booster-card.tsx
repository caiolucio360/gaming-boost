import Link from 'next/link'
import { Star, Trophy, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface BoosterCardProps {
  booster: {
    id: number
    userId: number
    user: {
      name: string | null
      image: string | null
    }
    rating: number
    totalReviews: number
    completedOrders: number
    languages: string[]
    verificationStatus: string
  }
}

export function BoosterCard({ booster }: BoosterCardProps) {
  return (
    <Link href={`/booster/${booster.userId}`}>
      <Card className="bg-black/30 backdrop-blur-md border-purple-500/30 hover:border-purple-500/80 transition-all duration-300 group cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-16 w-16 border-2 border-purple-500/50 group-hover:border-purple-400 transition-colors">
            <AvatarImage src={booster.user.image || ''} alt={booster.user.name || 'Booster'} />
            <AvatarFallback className="bg-purple-900/50 text-purple-200">
              {booster.user.name?.substring(0, 2).toUpperCase() || 'BO'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white font-orbitron group-hover:text-purple-300 transition-colors">
              {booster.user.name || 'Booster'}
            </h3>
            <div className="flex items-center text-yellow-400">
              <Star className="h-4 w-4 fill-yellow-400 mr-1" />
              <span className="font-bold">{booster.rating.toFixed(1)}</span>
              <span className="text-gray-500 text-xs ml-1">
                ({booster.totalReviews})
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-gray-400 text-sm">
              <Trophy className="h-4 w-4 mr-1 text-purple-400" />
              <span>{booster.completedOrders} pedidos</span>
            </div>
            <div className="flex gap-1">
              {booster.languages.slice(0, 2).map((lang) => (
                <Badge
                  key={lang}
                  variant="outline"
                  className="text-[10px] border-purple-500/30 text-purple-300"
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
          {booster.verificationStatus === 'VERIFIED' && (
            <div className="flex items-center justify-center bg-green-500/10 border border-green-500/30 rounded-md py-1">
              <span className="text-xs text-green-400 font-bold uppercase tracking-wider">
                Verificado
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
