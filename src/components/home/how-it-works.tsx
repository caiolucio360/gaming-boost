'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CrosshairIcon, QrCodeIcon, UserCheckIcon, ActivityIcon } from 'lucide-react'
import { Heading, Text } from '@/components/common/typography'
import { RevealStagger, RevealItem } from '@/components/home/reveal'
import { SectionHeading } from '@/components/home/section-heading'
import { IconTile } from '@/components/home/icon-tile'

const STEPS = [
  {
    icon: CrosshairIcon,
    title: 'Escolha o serviço',
    desc: 'Monte seu boost de Premier, Duo ou Coaching e veja o preço na hora, sem surpresa.',
  },
  {
    icon: QrCodeIcon,
    title: 'Pague no PIX',
    desc: 'Pagamento instantâneo e seguro. O pedido entra na fila assim que o PIX confirma.',
  },
  {
    icon: UserCheckIcon,
    title: 'Booster ativado',
    desc: 'Um booster verificado assume seu pedido — incluindo a experiência de um ex-profissional.',
  },
  {
    icon: ActivityIcon,
    title: 'Acompanhe pelo painel',
    desc: 'Acompanhe o status do pedido, converse com o booster e receba seu rank — tudo pelo painel.',
  },
] as const

export function HowItWorks() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      className="relative scroll-mt-20 py-20 md:py-28"
    >
      <div className="container relative z-10 mx-auto px-4">
        <SectionHeading
          eyebrow="Simples assim"
          title="Como funciona"
          subtitle="Do carrinho ao rank em quatro passos. Sem burocracia, sem espera."
          titleId="como-funciona-title"
        />

        <div className="relative">
          {/* Connecting line behind the cards on desktop — draws in on scroll */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-12 hidden h-px origin-left bg-gradient-to-r from-transparent via-brand-purple/50 to-transparent lg:block"
            initial={reduceMotion ? false : { scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          />

          <RevealStagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {STEPS.map((step, index) => (
            <RevealItem
              key={step.title}
              className="card-shine group relative flex flex-col items-center overflow-hidden rounded-2xl border border-brand-purple/20 bg-card/60 p-6 text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-purple/60 hover:bg-card/80 hover:shadow-glow"
            >
              {/* Top accent bar */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand-purple to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100"
              />
              {/* Step number badge */}
              <span className="absolute right-4 top-3 font-orbitron text-4xl font-bold leading-none text-brand-purple/15 transition-colors duration-300 group-hover:text-brand-purple/30">
                {String(index + 1).padStart(2, '0')}
              </span>

              <IconTile icon={step.icon} className="relative z-10 mb-5 h-16 w-16" />

              <Heading as="h3" level={4} className="relative z-10 mb-2 text-lg">
                {step.title}
              </Heading>
              <Text className="relative z-10 text-sm leading-relaxed">{step.desc}</Text>
            </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </div>
    </section>
  )
}
