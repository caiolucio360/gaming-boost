import { Button } from '@/components/ui/button'
import { getTrustpilotReviewUrl } from '@/lib/trustpilot'
import { TrustpilotIcon } from './trustpilot-icon'

interface TrustpilotReviewLinkProps {
  className?: string
}

/**
 * Post-purchase "leave a review" CTA → Trustpilot's evaluate page. Works on the free
 * plan; surface it after a confirmed payment to invite the customer to review.
 */
export function TrustpilotReviewLink({ className = '' }: TrustpilotReviewLinkProps) {
  return (
    <Button
      asChild
      variant="outline"
      className={`border-brand-purple/50 hover:bg-brand-purple/10 ${className}`}
    >
      <a href={getTrustpilotReviewUrl()} target="_blank" rel="noopener noreferrer">
        <TrustpilotIcon className="h-4 w-4 mr-2" />
        Deixe sua avaliação no Trustpilot
      </a>
    </Button>
  )
}
