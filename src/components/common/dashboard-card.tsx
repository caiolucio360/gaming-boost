import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function DashboardCard({ title, description, children, className }: DashboardCardProps) {
  return (
    <Card className={`group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 hover:shadow-xl hover:shadow-purple-500/20 transition-colors duration-200 overflow-hidden ${className || ''}`}>
      {/* Efeito de brilho sutil no hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
      
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

