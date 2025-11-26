import Link from 'next/link'
import { Star, Trophy, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
  const boosterName = booster.user.name || 'Booster'
  return (
    <Link 
      href={`/booster/${booster.userId}`}
      aria-label={`Ver perfil de ${boosterName}, ${booster.rating.toFixed(1)} estrelas, ${booster.completedOrders} pedidos completos${booster.verificationStatus === 'VERIFIED' ? ', verificado' : ''}`}
    >
      <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/30 hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/30 transition-colors duration-200 cursor-pointer h-full overflow-hidden">
        {/* Efeito de brilho no hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
        
        <CardHeader className="relative z-10 flex flex-row items-center gap-4 pb-2">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-purple-500/50 group-hover:border-purple-400 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-purple-500/50">
              <AvatarImage src={booster.user.image || ''} alt={booster.user.name || 'Booster'} />
              <AvatarFallback className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 text-purple-200">
                {booster.user.name?.substring(0, 2).toUpperCase() || 'BO'}
              </AvatarFallback>
            </Avatar>
            {/* Badge de verificação no avatar */}
            {booster.verificationStatus === 'VERIFIED' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                <span className="text-[10px]">✓</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white font-orbitron group-hover:text-purple-300 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {booster.user.name || 'Booster'}
            </h3>
            <div className="flex items-center text-yellow-400 group-hover:scale-105 transition-transform duration-300">
              <Star className="h-4 w-4 fill-yellow-400 mr-1 group-hover:fill-yellow-300 transition-colors duration-300" />
              <span className="font-bold">{booster.rating.toFixed(1)}</span>
              <span className="text-gray-500 text-xs ml-1 group-hover:text-gray-400 transition-colors duration-300">
                ({booster.totalReviews})
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
              <div className="p-1.5 rounded-md bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors duration-300 mr-2">
                <Trophy className="h-4 w-4 text-purple-400" />
              </div>
              <span>{booster.completedOrders} pedidos</span>
            </div>
            <div className="flex gap-1">
              {booster.languages.slice(0, 2).map((lang) => (
                <Badge
                  key={lang}
                  variant="outline"
                  className="text-[10px] border-purple-500/30 text-purple-300 group-hover:border-purple-400/50 group-hover:text-purple-200 group-hover:scale-110 transition-all duration-300"
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
          {booster.verificationStatus === 'VERIFIED' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 rounded-md py-1.5 group-hover:from-green-500/20 group-hover:to-green-600/20 transition-all duration-300 cursor-help">
                    <span className="text-xs text-green-400 font-bold uppercase tracking-wider group-hover:text-green-300 transition-colors duration-300">
                      ✓ Verificado
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black/90 border-purple-500/50 text-white">
                  <p>Booster verificado e aprovado pela plataforma</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
