import Link from 'next/link'
import { TrendingUpIcon, UsersIcon, GraduationCapIcon, ArrowRightIcon, type LucideIcon } from 'lucide-react'
import { Heading, Text } from '@/components/common/typography'
import { Button } from '@/components/ui/button'
import { RevealStagger, RevealItem } from '@/components/home/reveal'
import { SectionHeading } from '@/components/home/section-heading'
import { SectionFx } from '@/components/home/section-fx'
import { getGameConfig, type ServiceType } from '@/lib/games-config'

const SERVICE_ICONS: Partial<Record<ServiceType, LucideIcon>> = {
  RANK_BOOST: TrendingUpIcon,
  DUO_BOOST: UsersIcon,
  COACHING: GraduationCapIcon,
}

export function Services() {
  const cs2 = getGameConfig('CS2')
  const serviceTypeInfo = cs2?.serviceTypeInfo ?? {}
  const services = cs2?.supportedServiceTypes ?? []

  return (
    <section aria-labelledby="services-title" className="relative overflow-hidden bg-muted/30 py-20 md:py-28">
      <SectionFx pattern="dots" />
      <div className="container relative z-10 mx-auto px-4">
        <SectionHeading
          eyebrow="Counter-Strike 2"
          title="Nossos serviços"
          subtitle="Escolha o caminho para evoluir — do boost de Premier ao coaching individual."
          titleId="services-title"
        />

        <RevealStagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {services.map((type) => {
            const info = serviceTypeInfo[type]
            const Icon = SERVICE_ICONS[type] ?? TrendingUpIcon
            if (!info) return null

            return (
              <RevealItem
                key={type}
                className="card-shine group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/50 hover:shadow-glow"
              >
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-brand-purple/40 bg-brand-purple/10 transition-all duration-300 group-hover:border-brand-purple group-hover:bg-brand-purple/20">
                  <Icon className="h-7 w-7 text-brand-purple-light" aria-hidden="true" />
                </div>
                <Heading as="h3" level={3} className="mb-3">
                  {info.displayName}
                </Heading>
                <Text className="mb-6 flex-1 text-sm leading-relaxed md:text-base">{info.description}</Text>
                <Button
                  variant="outline"
                  className="w-full border-brand-purple/50 hover:border-brand-purple hover:bg-brand-purple/10"
                  asChild
                >
                  <Link href={cs2?.href ?? '/games/cs2'} className="flex items-center justify-center gap-2">
                    Ver preços
                    <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </Button>
              </RevealItem>
            )
          })}
        </RevealStagger>
      </div>
    </section>
  )
}
