import { Heading, Text } from '@/components/common/typography'
import { Reveal } from '@/components/home/reveal'

/**
 * TODO(home): temporary scaffold for home sections not yet built.
 *
 * The scroll + reveal skeleton and the finished "Como funciona" section are in
 * place; these placeholder bands mark where each remaining section goes so the
 * page renders end-to-end and the scroll/animation flow can be reviewed. Replace
 * each one with its real component (see `notes` for intended content).
 */
interface PlaceholderSectionProps {
  /** Section label, e.g. "Prova social". */
  title: string
  /** One line describing what the finished section will contain. */
  notes: string
  /** Alternate the band background so adjacent sections read as distinct. */
  tone?: 'base' | 'muted'
}

export function PlaceholderSection({ title, notes, tone = 'base' }: PlaceholderSectionProps) {
  return (
    <section
      aria-label={`${title} (em construção)`}
      className={tone === 'muted' ? 'bg-muted/30 py-20 md:py-28' : 'bg-background py-20 md:py-28'}
    >
      <div className="container mx-auto px-4">
        <Reveal className="mx-auto max-w-2xl rounded-2xl border border-dashed border-brand-purple/40 bg-card/50 p-10 text-center">
          <Text
            as="span"
            className="mb-3 inline-block font-orbitron text-xs font-bold uppercase tracking-[0.25em] text-brand-purple-light"
          >
            Seção · em construção
          </Text>
          <Heading level={2} className="text-2xl md:text-3xl">
            {title}
          </Heading>
          <Text className="mt-3 text-sm md:text-base">{notes}</Text>
        </Reveal>
      </div>
    </section>
  )
}
