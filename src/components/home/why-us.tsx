import { TrophyIcon, ShieldCheckIcon, EyeIcon } from 'lucide-react'
import { Heading, Text } from '@/components/common/typography'
import { RevealStagger, RevealItem } from '@/components/home/reveal'
import { SectionHeading } from '@/components/home/section-heading'
import { IconTile } from '@/components/home/icon-tile'

const DIFFERENTIALS = [
  {
    icon: TrophyIcon,
    title: 'Ao lado de um ex-profissional',
    desc: 'Nosso diferencial: você joga e evolui com quem viveu o CS2 no alto nível. Não é só ranking — é aprender com quem já esteve lá.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Sua conta blindada',
    desc: 'Credenciais Steam protegidas com criptografia AES-256-GCM, boosters verificados e gameplay 100% limpo. Sua conta nunca corre risco.',
  },
  {
    icon: EyeIcon,
    title: 'Transparência total',
    desc: 'Acompanhe o status do seu pedido no painel e fale direto com o booster pelo chat. Você sempre sabe em que etapa seu pedido está.',
  },
] as const

export function WhyUs() {
  return (
    <section aria-labelledby="why-us-title" className="relative py-20 md:py-28">
      <div className="container relative z-10 mx-auto px-4">
        <SectionHeading
          eyebrow="Por que a FlautasBoost"
          title="Mais que subir de elo"
          subtitle="Três motivos que separam a gente de qualquer site de boost genérico."
          titleId="why-us-title"
        />

        <RevealStagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {DIFFERENTIALS.map((item) => (
            <RevealItem
              key={item.title}
              className="card-shine group relative overflow-hidden rounded-2xl border border-brand-purple/20 bg-card/60 p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-purple/60 hover:bg-card/80 hover:shadow-glow"
            >
              {/* Top accent bar */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand-purple to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100"
              />
              {/* Corner glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-purple/15 blur-2xl transition-opacity duration-300 group-hover:bg-brand-purple/30"
              />
              <div className="relative z-10">
                <IconTile icon={item.icon} className="mb-5" />
                <Heading as="h3" level={3} className="mb-3">
                  {item.title}
                </Heading>
                <Text className="text-sm leading-relaxed md:text-base">{item.desc}</Text>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  )
}
