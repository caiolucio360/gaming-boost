// src/app/booster/layout.tsx
import type { Metadata } from 'next'
import { generateMetadata } from '@/lib/seo'
import { AppShell } from '@/components/layout/app-shell'

export const metadata: Metadata = generateMetadata({
  title: 'Painel do Booster - FlautasBoost',
  description: 'Painel de controle para boosters da FlautasBoost.',
  noindex: true,
})

export default function BoosterLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell role="BOOSTER">
      {children}
    </AppShell>
  )
}
