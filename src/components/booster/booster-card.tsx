import { Trophy } from 'lucide-react'
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
    completedOrders: number
    languages: string[]
    verificationStatus: string
  }
}

export function BoosterCard({ booster }: BoosterCardProps) {
  return (
    <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-brand-purple/30 hover:border-brand-purple-light/80 hover:shadow-2xl hover:shadow-brand-purple/30 transition-colors duration-200 h-full overflow-hidden">
      {/* Efeito de brilho no hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/10 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />

      <CardHeader className="relative z-10 flex flex-row items-center gap-4 pb-2">
        <div className="relative">
          <Avatar className="h-16 w-16 border-2 border-brand-purple/50 group-hover:border-brand-purple-light group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-brand-purple/50">
            <AvatarImage src={booster.user.image || ''} alt={booster.user.name || 'Booster'} />
            <AvatarFallback className="bg-gradient-to-br from-brand-purple-dark/50 to-purple-800/50 text-brand-purple-lighter">
              {booster.user.name?.substring(0, 2).toUpperCase() || 'BO'}
            </AvatarFallback>
          </Avatar>
          {booster.verificationStatus === 'VERIFIED' && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
              <span className="text-[10px]">✓</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white font-orbitron group-hover:text-brand-purple-light transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {booster.user.name || 'Booster'}
          </h3>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">
            <div className="p-1.5 rounded-md bg-brand-purple/20 group-hover:bg-brand-purple/30 transition-colors duration-300 mr-2">
              <Trophy className="h-4 w-4 text-brand-purple-light" />
            </div>
            <span>{booster.completedOrders} pedidos</span>
          </div>
          <div className="flex gap-1">
            {booster.languages.slice(0, 2).map((lang) => (
              <Badge
                key={lang}
                variant="outline"
                className="text-[10px] border-brand-purple/30 text-brand-purple-light group-hover:border-brand-purple-light/50 group-hover:text-brand-purple-lighter group-hover:scale-110 transition-all duration-300"
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
              <TooltipContent className="bg-black/90 border-brand-purple/50 text-white">
                <p>Booster verificado e aprovado pela plataforma</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
