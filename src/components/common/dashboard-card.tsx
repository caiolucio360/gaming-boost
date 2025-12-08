import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  status?: 'PENDING' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}

const statusBorderColors: Record<string, { border: string; hover: string; shadow: string; glow: string }> = {
  PENDING: {
    border: 'border-yellow-500/50',
    hover: 'hover:border-yellow-400/80',
    shadow: 'hover:shadow-yellow-500/20',
    glow: 'from-yellow-500/0 via-yellow-500/5 to-yellow-500/0',
  },
  PAID: {
    border: 'border-cyan-500/50',
    hover: 'hover:border-cyan-400/80',
    shadow: 'hover:shadow-cyan-500/20',
    glow: 'from-cyan-500/0 via-cyan-500/5 to-cyan-500/0',
  },
  IN_PROGRESS: {
    border: 'border-blue-500/50',
    hover: 'hover:border-blue-400/80',
    shadow: 'hover:shadow-blue-500/20',
    glow: 'from-blue-500/0 via-blue-500/5 to-blue-500/0',
  },
  COMPLETED: {
    border: 'border-green-500/50',
    hover: 'hover:border-green-400/80',
    shadow: 'hover:shadow-green-500/20',
    glow: 'from-green-500/0 via-green-500/5 to-green-500/0',
  },
  CANCELLED: {
    border: 'border-red-500/50',
    hover: 'hover:border-red-400/80',
    shadow: 'hover:shadow-red-500/20',
    glow: 'from-red-500/0 via-red-500/5 to-red-500/0',
  },
}

const defaultColors = {
  border: 'border-purple-500/50',
  hover: 'hover:border-purple-400/80',
  shadow: 'hover:shadow-purple-500/20',
  glow: 'from-purple-500/0 via-purple-500/5 to-purple-500/0',
}

export function DashboardCard({ title, description, children, className, status }: DashboardCardProps) {
  const colors = status ? statusBorderColors[status] || defaultColors : defaultColors

  return (
    <Card className={`group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md ${colors.border} ${colors.hover} hover:shadow-xl ${colors.shadow} transition-colors duration-200 overflow-hidden ${className || ''}`}>
      {/* Efeito de brilho sutil no hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none`} style={{ willChange: 'opacity' }} />
      
      <CardHeader className="relative z-10">
        <CardTitle className="text-white font-orbitron group-hover:text-purple-200 transition-colors duration-200" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-gray-400 font-rajdhani group-hover:text-gray-300 transition-colors duration-200" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="relative z-10">
        {children}
      </CardContent>
    </Card>
  )
}

