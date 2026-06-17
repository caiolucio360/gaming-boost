import Link from 'next/link'
import { TrendingUpIcon, UsersIcon, GraduationCapIcon, ArrowRightIcon, type LucideIcon } from 'lucide-react'
import { Heading, Text } from '@/components/common/typography'
import { Button } from '@/components/ui/button'
import { RevealStagger, RevealItem } from '@/components/home/reveal'
import { SectionHeading } from '@/components/home/section-heading'
import { IconTile } from '@/components/home/icon-tile'
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
    <section aria-labelledby="services-title" className="relative py-20 md:py-28">
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
                className="card-shine group relative flex flex-col overflow-hidden rounded-2xl border border-brand-purple/20 bg-card/60 p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-purple/60 hover:bg-card/80 hover:shadow-glow"
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
                <IconTile icon={Icon} className="relative z-10 mb-5" />
                <Heading as="h3" level={3} className="relative z-10 mb-3">
                  {info.displayName}
                </Heading>
                <Text className="relative z-10 mb-6 flex-1 text-sm leading-relaxed md:text-base">{info.description}</Text>
                <Button
                  variant="outline"
                  className="relative z-10 w-full border-brand-purple/50 hover:border-brand-purple hover:bg-brand-purple/10"
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
