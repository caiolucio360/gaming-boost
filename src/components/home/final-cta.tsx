import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon } from 'lucide-react'
import { Heading, Text } from '@/components/common/typography'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/home/reveal'
import { Parallax, SectionFx } from '@/components/home/section-fx'

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="relative overflow-hidden bg-background py-20 md:py-28">
      <SectionFx pattern="grid" />
      <div className="container relative z-10 mx-auto px-4">
        <Reveal className="relative overflow-hidden rounded-3xl border border-brand-purple/40 bg-gradient-brand px-6 py-16 text-center md:px-12 md:py-20">
          {/* Photo texture with subtle parallax — scaled up so the parallax shift never reveals edges */}
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

          {/* Atmospheric glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-purple/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-brand-purple-dark/30 blur-3xl"
          />

          <div className="relative z-10 mx-auto max-w-2xl">
            <Heading id="final-cta-title" level={1} className="text-3xl text-white md:text-5xl">
              Pronto para subir de rank?
            </Heading>
            <Text className="mx-auto mt-4 max-w-xl text-base text-white/80 md:text-lg">
              Comece agora ao lado de quem viveu o CS2 de verdade. Entrega garantida, conta protegida.
            </Text>
            <div className="mt-8 flex justify-center">
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
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
