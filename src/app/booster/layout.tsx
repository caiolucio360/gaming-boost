import { generateMetadata } from '@/lib/seo'
import type { Metadata } from 'next'

export const metadata: Metadata = generateMetadata({
  title: 'Painel do Booster - GameBoost Pro',
  description: 'Painel de controle para boosters da GameBoost Pro.',
  noindex: true,
})

export default function BoosterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

