interface TrustpilotIconProps {
  className?: string
}

/**
 * Trustpilot's signature green star. The brand green (`#00B67A`) is Trustpilot's own
 * identity, applied via the SVG `fill` attribute (not a Tailwind class) — which the
 * design-system guard permits for SVG/data-driven colors.
 */
export function TrustpilotIcon({ className }: TrustpilotIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#00B67A" aria-hidden="true">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  )
}
