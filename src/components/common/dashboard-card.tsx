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
    <Card className={`bg-black/30 backdrop-blur-md border-purple-500/50 hover:border-purple-400 transition-colors ${className || ''}`}>
      <CardHeader>
        <CardTitle className="text-white font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-gray-400 font-rajdhani" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

