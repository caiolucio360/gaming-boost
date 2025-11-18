import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Counter-Strike 2 - Boost de Rank',
  description: 'Boost de rank profissional para Counter-Strike 2. Modos Premier e Gamers Club disponíveis. Boosters verificados, entrega rápida e segura.',
  keywords: [
    'boost cs2',
    'counter strike 2 boost',
    'cs2 rank boost',
    'boost premier cs2',
    'boost gamers club cs2',
    'elo job cs2',
    'cs2 boost profissional',
  ],
  canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gameboostpro.com.br'}/games/cs2`,
})

export default function CS2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

