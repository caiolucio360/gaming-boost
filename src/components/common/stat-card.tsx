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
  iconColor = 'text-purple-500',
  valueColor = 'text-white',
}: StatCardProps) {
  return (
    <Card className="bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-rajdhani text-gray-400" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor} font-orbitron`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-gray-400 font-rajdhani mt-1" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

