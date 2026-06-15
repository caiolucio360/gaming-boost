'use client'

import Link from "next/link"
import Image from "next/image"
import { motion, useReducedMotion, type Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon, ShieldCheckIcon, ZapIcon, ChevronDownIcon } from "lucide-react"

const EASE = [0.4, 0, 0.2, 1] as const

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

const TRUST = [
  // Rating item hidden until we have real review data:
  // { icon: StarIcon, label: '4.9 de avaliação' },
  { icon: ShieldCheckIcon, label: 'Conta protegida' },
  { icon: ZapIcon, label: 'PIX instantâneo' },
] as const

export function ElojobHero() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      className="relative min-h-screen overflow-hidden bg-background"
      aria-label="Hero - Seção principal"
    >
      {/* Background photo — next/image com priority gera preload e otimização (melhora o LCP) */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/principal.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Left-dark gradient: keeps the headline readable, lets the art breathe on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/25" />
        {/* Vertical vignette for depth and a clean fade into the next section */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background" />
        {/* Brand glows */}
        <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-purple/20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-brand-purple-dark/20 blur-3xl" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto flex min-h-screen items-center px-4 py-24 md:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl text-left"
          variants={container}
          initial={reduceMotion ? false : 'hidden'}
          animate="show"
        >
          {/* Wordmark badge */}
          <motion.div variants={item} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-purple/40 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <Image
                src="/flautas/flautasboost-flauta.svg"
                alt=""
                width={18}
                height={18}
                className="h-4 w-4"
                aria-hidden="true"
              />
              <span className="font-orbitron text-xs font-bold uppercase tracking-[0.25em] text-brand-purple-light">
                FlautasBoost · CS2
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="font-orbitron text-2xl font-bold leading-[1.2] tracking-tight text-white text-balance drop-shadow-2xl sm:text-3xl lg:text-4xl xl:text-5xl"
          >
            Jogue, suba e evolua ao lado de quem viveu o CS2 de verdade, experiência com um{' '}
            <span className="animate-text-shimmer bg-gradient-to-r from-brand-purple-light via-brand-purple to-brand-purple-light bg-clip-text text-transparent drop-shadow-glow">
              ex jogador profissional
            </span>
            .
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={item}
            className="mt-6 max-w-xl font-rajdhani text-lg leading-relaxed text-white/80 text-pretty md:text-xl"
          >
            Boosters verificados, gameplay 100% limpo e entrega garantida.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="group px-8 py-6 text-base font-bold shadow-glow-lg hover:shadow-glow-hover md:text-lg"
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
            <Button
              size="lg"
              variant="outline"
              className="border-brand-purple/60 bg-white/5 px-8 py-6 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:border-brand-purple-light hover:bg-white/10 md:text-lg"
              asChild
            >
              <a href="#como-funciona">Como funciona</a>
            </Button>
          </motion.div>

          {/* Trust strip */}
          <motion.ul
            variants={item}
            className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 font-rajdhani text-sm text-white/70"
          >
            {TRUST.map((t, index) => (
              <li key={t.label} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="mr-3 hidden h-4 w-px bg-white/20 sm:inline-block" aria-hidden="true" />
                )}
                <t.icon className="h-4 w-4 text-brand-purple-light" aria-hidden="true" />
                {t.label}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.a
        href="#como-funciona"
        aria-label="Rolar para saber como funciona"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/50 transition-colors hover:text-brand-purple-light"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <ChevronDownIcon className="h-7 w-7 animate-bounce" aria-hidden="true" />
      </motion.a>
    </section>
  )
}
