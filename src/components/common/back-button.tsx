import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  href: string
  children?: React.ReactNode
  className?: string
}

/** Standard "back" button used across admin pages (outline, white/10 border). */
export function BackButton({ href, children = 'Voltar', className }: BackButtonProps) {
  return (
    <div className={cn('mb-6', className)}>
      <Button variant="outline" asChild className="border-border hover:border-brand-purple/50">
        <Link href={href}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {children}
        </Link>
      </Button>
    </div>
  )
}
