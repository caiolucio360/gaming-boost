'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRightIcon } from 'lucide-react'
import { Heading, Text } from '@/components/common/typography'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/home/reveal'
import { Parallax, SectionFx } from '@/components/home/section-fx'

export function FinalCta() {
  const reduceMotion = useReducedMotion()

  return (
    <section aria-labelledby="final-cta-title" className="relative overflow-hidden bg-background py-20 md:py-28">
      <SectionFx pattern="grid" />
      <div className="container relative z-10 mx-auto px-4">
        <Reveal>
          {/* Outer wrapper: the animated conic ring shows only at the 1px border */}
          <div className="relative overflow-hidden rounded-3xl p-px">
            <div className="cta-ring absolute inset-[-60%]" aria-hidden="true" />

            {/* Inner card */}
            <div className="relative overflow-hidden rounded-[calc(1.5rem-1px)] bg-gradient-brand px-6 py-16 text-center md:px-12 md:py-20">
              {/* Photo texture with subtle parallax — scaled up so the shift never reveals edges */}
              <Parallax distance={30} className="pointer-events-none absolute inset-0">
                <Image
                  src="/principal.png"
                  alt=""
                  fill
                  sizes="100vw"
                  aria-hidden="true"
                  className="scale-110 object-cover object-center opacity-20 mix-blend-luminosity"
                />
              </Parallax>
              {/* Readability overlay over the photo */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-purple-dark/40 via-black/40 to-black/60"
              />

              {/* Animated glow orbs */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-brand-purple/30 blur-3xl"
                animate={reduceMotion ? undefined : { scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-20 -right-12 h-72 w-72 rounded-full bg-brand-purple-light/25 blur-3xl"
                animate={reduceMotion ? undefined : { scale: [1, 1.22, 1], opacity: [0.4, 0.75, 0.4] }}
                transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />

              <div className="relative z-10 mx-auto max-w-2xl">
                <Heading id="final-cta-title" level={1} className="text-3xl text-white md:text-5xl">
                  Pronto para{' '}
                  <span className="animate-text-shimmer bg-gradient-to-r from-brand-purple-light via-white to-brand-purple-light bg-clip-text text-transparent">
                    subir de rank?
                  </span>
                </Heading>
                <Text className="mx-auto mt-4 max-w-xl text-base text-white/80 md:text-lg">
                  Comece agora ao lado de quem viveu o CS2 de verdade. Entrega garantida, conta protegida.
                </Text>
                <div className="mt-8 flex justify-center">
                  <motion.div
                    animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Button
                      size="lg"
                      className="group animate-glow px-8 py-6 text-base font-bold shadow-glow-lg hover:shadow-glow-hover md:text-lg"
                      asChild
                    >
                      <Link href="/games/cs2" className="flex items-center gap-3">
                        CONTRATE JÁ!
                        <ArrowRightIcon
                          className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
