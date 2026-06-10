import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { GlowCard } from '@/components/common/glow-card'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconColor?: string
  valueColor?: string
  /** Extra classes for the card root (e.g. a status-colored border). */
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-brand-purple',
  valueColor = 'text-white',
  className,
}: StatCardProps) {
  return (
    <GlowCard className={`hover:shadow-xl hover:shadow-brand-purple/20 ${className || ''}`}>
      <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-rajdhani font-semibold text-brand-gray-400 group-hover:text-brand-gray-300 transition-colors duration-200">
          {title}
        </CardTitle>
        <div className="p-2 rounded-lg bg-brand-purple/10 group-hover:bg-brand-purple/20 transition-colors duration-200">
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={`text-2xl font-bold ${valueColor} font-orbitron`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-brand-gray-400 font-rajdhani mt-1 group-hover:text-brand-gray-300 transition-colors duration-200">
            {description}
          </p>
        )}
      </CardContent>
    </GlowCard>
  )
}

