import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconColor?: string
  valueColor?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-brand-purple',
  valueColor = 'text-white',
}: StatCardProps) {
  return (
    <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-brand-purple/50 hover:border-brand-purple-light/80 hover:shadow-xl hover:shadow-brand-purple/20 transition-colors duration-200 overflow-hidden">
      {/* Efeito de brilho sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/0 via-brand-purple/5 to-brand-purple/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />

      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-rajdhani text-brand-gray-400 group-hover:text-brand-gray-300 transition-colors duration-200" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-brand-purple/10 group-hover:bg-brand-purple/20 transition-colors duration-200">
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={`text-2xl font-bold ${valueColor} font-orbitron`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-brand-gray-400 font-rajdhani mt-1 group-hover:text-brand-gray-300 transition-colors duration-200" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

