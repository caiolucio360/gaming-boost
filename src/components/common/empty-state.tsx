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
    <Card className="bg-black/30 backdrop-blur-md border-purple-500/50">
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white font-orbitron mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {title}
          </h3>
          <p className="text-gray-400 font-rajdhani mb-6" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            {description}
          </p>
          {actionLabel && (actionHref ? (
            <Button
              asChild
              className="bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: '600' }}
            >
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : onAction && (
            <Button
              onClick={onAction}
              className="bg-purple-500 hover:bg-purple-400 text-white font-rajdhani"
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

