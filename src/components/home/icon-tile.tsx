import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Gradient-filled icon tile used across the home feature cards. The brand
 * gradient + glow makes the icon pop against the glass card surface; it scales
 * up on hover of the parent `.group`.
 */
export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-purple-dark shadow-glow-sm ring-1 ring-inset ring-white/10 transition-transform duration-300 group-hover:scale-110',
        className,
      )}
    >
      <Icon className="h-7 w-7 text-white" aria-hidden="true" />
    </div>
  )
}
