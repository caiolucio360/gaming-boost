import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string // Para usar Link do Next.js quando apropriado
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card className="group relative bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border-purple-500/50 hover:border-purple-400/80 transition-colors duration-200 overflow-hidden">
      {/* Efeito de brilho sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out pointer-events-none" style={{ willChange: 'opacity' }} />
      
      <CardContent className="pt-6 relative z-10">
        <div className="text-center py-12">
          <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 mb-4">
            <Icon className="h-16 w-16 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
          </div>
          <h3 className="text-xl font-bold text-white font-orbitron mb-2 group-hover:text-purple-200 transition-colors duration-300" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {title}
          </h3>
          <p className="text-gray-400 font-rajdhani mb-6 group-hover:text-gray-300 transition-colors duration-300" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {description}
          </p>
          {actionLabel && (actionHref ? (
            <Button
              asChild
              className="bg-gradient-to-r from-purple-600 to-purple-500 text-white font-rajdhani shadow-lg border border-transparent hover:border-white/50 transition-all duration-200"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
            >
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : onAction && (
            <Button
              onClick={onAction}
              className="bg-gradient-to-r from-purple-600 to-purple-500 text-white font-rajdhani shadow-lg border border-transparent hover:border-white/50 transition-all duration-200"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
            >
              {actionLabel}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

