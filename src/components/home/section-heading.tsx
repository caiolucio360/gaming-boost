import { Heading, Text } from '@/components/common/typography'
import { Reveal } from '@/components/home/reveal'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  /** Small uppercase label above the title. */
  eyebrow: string
  title: string
  subtitle?: string
  /** id for the title element (anchor / aria-labelledby). */
  titleId?: string
  className?: string
}

/**
 * Shared marketing section header: eyebrow + title + optional subtitle, revealed
 * on scroll. Keeps every home section visually consistent.
 */
export function SectionHeading({ eyebrow, title, subtitle, titleId, className }: SectionHeadingProps) {
  return (
    <Reveal className={cn('mx-auto mb-14 max-w-2xl text-center md:mb-20', className)}>
      <Text
        as="span"
        className="mb-3 inline-block font-orbitron text-sm font-bold uppercase tracking-[0.25em] text-brand-purple-light"
      >
        {eyebrow}
      </Text>
      <Heading id={titleId} level={1} className="text-3xl md:text-5xl">
        {title}
      </Heading>
      {subtitle && <Text className="mt-4 text-base md:text-lg">{subtitle}</Text>}
    </Reveal>
  )
}
