import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import ElojobHero from "@/components/layout/elojob-hero"

export const metadata: Metadata = generateMetadata({
  title: 'Início - GameBoost Pro',
  description: 'Plataforma profissional de boost para Counter-Strike 2. Subimos seu rank Premier e Gamers Club com segurança e rapidez. Boosters verificados, entrega garantida.',
  keywords: [
    'boost cs2',
    'boost counter strike 2',
    'elo job cs2',
    'rank boost cs2',
    'boost premier cs2',
    'boost gamers club',
    'serviço de boost profissional',
    'boost seguro',
  ],
})

export default function HomePage() {
  return (
    <div className="h-full">
      <ElojobHero />
    </div>
  )
}
