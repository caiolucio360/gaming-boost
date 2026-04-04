// src/app/booster/layout.tsx
import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'
import { AppShell } from '@/components/layout/app-shell'

export const metadata: Metadata = generateMetadata({
  title: 'Painel do Booster - GameBoost',
  description: 'Painel de controle para boosters da GameBoost.',
  noindex: true,
})

export default function BoosterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="BOOSTER">
      {children}
    </AppShell>
  )
}
