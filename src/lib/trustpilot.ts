/**
 * Trustpilot configuration & helpers (free-plan features only).
 *
 * All values come from `NEXT_PUBLIC_*` env vars (see `.env.example`) and are optional:
 * - The badge / review link always work via the public profile URL.
 * - The Schema.org AggregateRating only renders when real rating values are configured,
 *   to avoid shipping fake review data (which Google penalizes).
 *
 * Env vars are referenced by their full literal name so Next.js inlines them into the
 * client bundle at build time.
 */

const DEFAULT_PROFILE_URL = 'https://www.trustpilot.com/review/flautasboost.com.br'

export const trustpilot = {
  profileUrl: process.env.NEXT_PUBLIC_TRUSTPILOT_PROFILE_URL || DEFAULT_PROFILE_URL,
  ratingValue: process.env.NEXT_PUBLIC_TRUSTPILOT_RATING_VALUE ?? '',
  ratingCount: process.env.NEXT_PUBLIC_TRUSTPILOT_RATING_COUNT ?? '',
} as const

/** Public profile URL where visitors read existing reviews. */
export function getTrustpilotProfileUrl(): string {
  return trustpilot.profileUrl
}

/** Direct "leave a review" URL, derived from the profile domain (.../review/ → .../evaluate/). */
export function getTrustpilotReviewUrl(): string {
  return trustpilot.profileUrl.includes('/review/')
    ? trustpilot.profileUrl.replace('/review/', '/evaluate/')
    : trustpilot.profileUrl
}

/**
 * Schema.org AggregateRating for SEO rich snippets. Returns `null` unless both a rating
 * value and a count are configured — never emit placeholder/fake numbers.
 */
export function getTrustpilotAggregateRating(siteUrl: string) {
  if (!trustpilot.ratingValue || !trustpilot.ratingCount) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: {
      '@type': 'Organization',
      name: 'FlautasBoost',
      url: siteUrl,
    },
    ratingValue: trustpilot.ratingValue,
    bestRating: '5',
    worstRating: '1',
    ratingCount: trustpilot.ratingCount,
  }
}
