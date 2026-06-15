'use client'

import { CrosshairIcon, QrCodeIcon, UserCheckIcon, ActivityIcon } from 'lucide-react'
import { Heading, Text } from '@/components/common/typography'
import { Reveal, RevealStagger, RevealItem } from '@/components/home/reveal'

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
    title: 'Acompanhe ao vivo',
    desc: 'Veja o progresso, converse com o booster e receba seu rank no painel, em tempo real.',
  },
] as const

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      className="relative scroll-mt-20 bg-background py-20 md:py-28"
    >
      <div className="container mx-auto px-4">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center md:mb-20">
          <Text
            as="span"
            className="mb-3 inline-block font-orbitron text-sm font-bold uppercase tracking-[0.25em] text-brand-purple-light"
          >
            Simples assim
          </Text>
          <Heading id="como-funciona-title" level={1} className="text-3xl md:text-5xl">
            Como funciona
          </Heading>
          <Text className="mt-4 text-base md:text-lg">
            Do carrinho ao rank em quatro passos. Sem burocracia, sem espera.
          </Text>
        </Reveal>

        <RevealStagger className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {/* Connecting line behind the cards on desktop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-brand-purple/40 to-transparent lg:block"
          />

          {STEPS.map((step, index) => (
            <RevealItem
              key={step.title}
              className="group relative flex flex-col items-center rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/50 hover:shadow-glow"
            >
              {/* Step number badge */}
              <span className="absolute -top-3 right-4 font-orbitron text-5xl font-bold leading-none text-brand-purple/10 transition-colors duration-300 group-hover:text-brand-purple/25">
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-brand-purple/40 bg-brand-purple/10 transition-all duration-300 group-hover:border-brand-purple group-hover:bg-brand-purple/20">
                <step.icon
                  className="h-7 w-7 text-brand-purple-light transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
              </div>

              <Heading as="h3" level={4} className="mb-2 text-lg">
                {step.title}
              </Heading>
              <Text className="text-sm leading-relaxed">{step.desc}</Text>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
