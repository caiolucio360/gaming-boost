import { StarIcon, QuoteIcon } from 'lucide-react'
import { Heading, Text } from '@/components/common/typography'
import { RevealStagger, RevealItem } from '@/components/home/reveal'
import { SectionHeading } from '@/components/home/section-heading'
import { SectionFx } from '@/components/home/section-fx'

/**
 * TODO(home): PLACEHOLDER testimonials — do NOT ship as real.
 *
 * Replace with verified reviews from a real source (Trustpilot widget or a DB
 * `Review`-style record). Until then this section renders illustrative copy only
 * so the layout can be reviewed; the names/text below are not real customers.
 */
const TESTIMONIALS = [
  {
    name: 'Cliente exemplo',
    rank: 'Subiu para 18k Premier',
    text: 'Atendimento rápido e gameplay impecável. Acompanhei tudo pelo painel e o booster era nível profissional mesmo.',
  },
  {
    name: 'Cliente exemplo',
    rank: 'Duo Boost · 15k Premier',
    text: 'Joguei junto e aprendi muito no processo. Bem mais que só subir de elo — virou aula de verdade.',
  },
  {
    name: 'Cliente exemplo',
    rank: 'Coaching · 8 sessões',
    text: 'Análise de demo cirúrgica. Em poucas semanas meu posicionamento mudou completamente.',
  },
] as const

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-title" className="relative overflow-hidden bg-background py-20 md:py-28">
      <SectionFx pattern="grid" />
      <div className="container relative z-10 mx-auto px-4">
        <SectionHeading
          eyebrow="Quem já jogou com a gente"
          title="O que dizem os clientes"
          subtitle="Avaliações de quem confiou seu rank à FlautasBoost."
          titleId="testimonials-title"
        />

        <RevealStagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <RevealItem
              key={index}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-8 transition-colors duration-300 hover:border-brand-purple/50"
            >
              <QuoteIcon
                className="absolute right-6 top-6 h-8 w-8 text-brand-purple/15"
                aria-hidden="true"
              />
              <div className="mb-4 flex gap-0.5" aria-label="5 de 5 estrelas">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className="h-4 w-4 fill-brand-purple-light text-brand-purple-light"
                    aria-hidden="true"
                  />
                ))}
              </div>
              <Text className="mb-6 flex-1 text-sm leading-relaxed md:text-base">
                &ldquo;{item.text}&rdquo;
              </Text>
              <div>
                <Heading as="h3" level={4} className="text-base">
                  {item.name}
                </Heading>
                <Text className="text-xs uppercase tracking-wider text-brand-purple-light">{item.rank}</Text>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
