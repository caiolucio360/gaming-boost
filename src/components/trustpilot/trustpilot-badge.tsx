import { getTrustpilotProfileUrl } from '@/lib/trustpilot'
import { TrustpilotIcon } from './trustpilot-icon'

interface TrustpilotBadgeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-xs gap-1.5',
  md: 'text-sm gap-2',
  lg: 'text-base gap-2.5',
} as const

/**
 * "Avalie-nos no Trustpilot" link → public profile. Works on the free plan (no
 * Business Unit ID required). Place it in the footer / support sections.
 */
export function TrustpilotBadge({ className = '', size = 'md' }: TrustpilotBadgeProps) {
  return (
    <a
      href={getTrustpilotProfileUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center ${sizeClasses[size]} text-muted-foreground hover:text-brand-purple transition-colors ${className}`}
    >
      <TrustpilotIcon className="h-4 w-4 md:h-5 md:w-5" />
      <span>Avalie-nos no Trustpilot</span>
    </a>
  )
}
