'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'framer-motion'
// Rating stat disabled for now — re-enable with the rating entry below.
// import { StarIcon } from 'lucide-react'
import { Text } from '@/components/common/typography'
import { RevealStagger, RevealItem } from '@/components/home/reveal'
import { SectionFx } from '@/components/home/section-fx'

/**
 * Social-proof stats bar with count-up on scroll.
 *
 * TODO(home): values below are placeholders. Wire to REAL sources only —
 * `getTrustpilotAggregateRating()` for the rating, and DB aggregates for orders /
 * satisfaction. Render nothing (or hide the stat) when real data is unavailable;
 * never ship fabricated numbers.
 */
const STATS = [
  // Rating stat hidden until we have real review data:
  // { value: 4.9, decimals: 1, suffix: '', label: 'Avaliação média', isRating: true },
  { value: 5000, decimals: 0, suffix: '+', label: 'Pedidos concluídos', isRating: false },
  { value: 98, decimals: 0, suffix: '%', label: 'Clientes satisfeitos', isRating: false },
  { value: 50, decimals: 0, suffix: '+', label: 'Boosters verificados', isRating: false },
] as const

function CountUp({ to, decimals, suffix }: { to: number; decimals: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduceMotion = useReducedMotion()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduceMotion) {
      setValue(to)
      return
    }
    const controls = animate(0, to, {
      duration: 1.4,
      ease: [0.4, 0, 0.2, 1],
      onUpdate: (v) => setValue(v),
    })
    return () => controls.stop()
  }, [inView, to, reduceMotion])

  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref}>
      {formatted}
      {suffix}
    </span>
  )
}

export function SocialProof() {
  return (
    <section aria-label="Prova social" className="relative overflow-hidden border-y border-border bg-background py-12 md:py-16">
      <SectionFx pattern="grid" />
      <div className="container relative z-10 mx-auto px-4">
        <RevealStagger className="grid grid-cols-3 gap-4 md:gap-4">
          {STATS.map((stat) => (
            <RevealItem key={stat.label} className="text-center">
              <div className="flex items-baseline justify-center gap-1 font-orbitron text-3xl font-bold text-foreground md:text-5xl">
                <CountUp to={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
                {/* Rating star hidden until we have real review data:
                {stat.isRating && (
                  <StarIcon
                    className="h-5 w-5 fill-brand-purple-light text-brand-purple-light md:h-7 md:w-7"
                    aria-hidden="true"
                  />
                )} */}
              </div>
              <Text className="mt-2 text-xs uppercase tracking-wider md:text-sm">{stat.label}</Text>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
